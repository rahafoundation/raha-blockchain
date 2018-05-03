/**
 * Creates the next block in the Raha Blockchain from unapplied operations in Firestore.
 *
 * This module is intended to be run in a Node environment, not the browser.
 *
 * Example usage:
 * node dist/createBlock.js > newBlock.json
 */

import fs from "fs";
import crypto from "crypto";

import { getBlockchain } from "../blockchain";
import {
  operationsCollectionFilters as filters,
  get,
  operationsCollection,
  getVideoHashForUid
} from "../firestore";
import {
  BLOCKCHAIN_VERSION_NO,
  VirtualBlock,
  StellarMetadata
} from "../schema";
import {
  Block,
  Operation,
  RequestInviteData,
  TrustData,
  Uid
} from "../schema/blockchain/version_01";
import { saveDataToIpfsAsFile } from "../ipfs";

const BLOCK_FORMAT_SPACES = 2;

/**
 * A map of functions that build the data component of Blockchain Operations from
 * the data component of Firestore Operations.
 */
const blockchainOpDataBuilders = {
  REQUEST_INVITE: async (firestoreOp): Promise<RequestInviteData> => {
    const opData = firestoreOp.get("data");
    return {
      full_name: opData.full_name,
      to_uid: opData.to_uid,
      video_hash: await getVideoHashForUid(firestoreOp.get(
        "creator_uid"
      ) as Uid)
    };
  },
  TRUST: async (firestoreOp): Promise<TrustData> => ({
    to_uid: firestoreOp.get("data").to_uid
  })
};

/**
 * Filter new operations are invalid within the context of the current blockchain.
 * This means:
 *   * users cannot perform operations on nonexistent users.
 *   * // TODO: there must exist a trust path from a user who joined in a previous block to any user who performs a new TRUST operation
 */
function filterInvalidBlockchainOps(blockchain, blockchainOps) {
  // Create a set of creator_mid on all REQUEST_INVITE operations in blockchain and bcOps.
  // Check if to_mid, from_mid is included in above set.
  // TODO;
  return blockchainOps;
}

/**
 * TODO.
 */
function validateBlockchainOp(blockchainOp) {
  return true;
}

/**
 * Build a Blockchain Operation from a Firestore Operation. Returns undefined if the operation is invalid.
 */
async function buildBlockchainOpFromFirestoreOp(
  firestoreOp: firebase.firestore.DocumentSnapshot,
  index: number
): Promise<Operation | undefined> {
  const opCode = firestoreOp.get("op_code");

  if (!(opCode in blockchainOpDataBuilders)) {
    return undefined;
  }
  const operationDataBuilder = blockchainOpDataBuilders[opCode];

  const blockchainOp: Operation = {
    sequence: index,
    op_code: opCode,
    creator_uid: firestoreOp.get("creator_uid"),
    data: await operationDataBuilder(firestoreOp)
  };
  return validateBlockchainOp(blockchainOp) ? blockchainOp : undefined;
}

/**
 * Return a list of all valid unapplied operations from Firestore.
 */
async function getBlockOperations(): Promise<Operation[]> {
  const unappliedFirestoreOps = await get(
    filters.applied(false)(operationsCollection())
  );

  let i = 0;
  const blockchainOperations = await Promise.all(
    unappliedFirestoreOps.map(op => buildBlockchainOpFromFirestoreOp(op, i++))
  );
  return blockchainOperations.filter(x => x) as Operation[];
}

/**
 * Assumes the blockchain list is sorted by sequence number. Returns the last sequence number + 1.
 */
function getNextBlockSequenceNumber(blockchain: VirtualBlock[]): number {
  if (blockchain.length > 0) {
    return blockchain[blockchain.length - 1].data.sequence + 1;
  } else {
    return 0;
  }
}

/**
 * Assumes the blockchain list is sorted by sequence number. Returns the hash of the last block.
 */
function getLastBlockHash(blockchain: VirtualBlock[]): string {
  if (blockchain.length > 0) {
    return blockchain[blockchain.length - 1].metadata.hash;
  } else {
    return "no_previous_blocks_found";
  }
}

/**
 * Create an IpfsBlock with all valid unapplied operations from Firestore.
 */
async function createIpfsBlock(): Promise<Block> {
  console.log("Creating IPFS block.");
  // getBlockchain and getBlockOperations in parallel.
  const [blockchain, blockOperations] = await Promise.all([
    getBlockchain(),
    getBlockOperations()
  ]);
  const validOperations = filterInvalidBlockchainOps(
    blockchain,
    blockOperations
  );

  return {
    sequence: getNextBlockSequenceNumber(blockchain),
    version: BLOCKCHAIN_VERSION_NO,
    prev_hash: getLastBlockHash(blockchain),
    operations: validOperations
  };
}

/**
 * Return Block as string.
 */
function formatData(data) {
  console.log("Formatting data.");
  return JSON.stringify(data, null, BLOCK_FORMAT_SPACES);
}

/**
 * Write the block to a file.
 */
async function writeBlockDataToLocalFile(blockData, multiHash, formattedData) {
  return new Promise((resolve, error) => {
    const filename = `block-${blockData.sequence}-${multiHash}.json`;
    fs.writeFile(filename, formattedData, err => {
      if (err) {
        error(err);
      } else {
        console.log(
          `Please upload ${filename} to the raha-blocks bucket in Google Cloud.`
        );
        console.log(
          "If you have configured gsutil as described in the README, you may use the following command:"
        );
        console.log(`gsutil cp ${filename} gs://raha-blocks/`);
        resolve();
      }
    });
  });
}

/**
 * Return hex-encoded sha256 hash of formattedData.
 */
function getBlockHash(formattedData: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(formattedData);
  return hash.digest("hex");
}

/**
 * Create a Block with all valid unapplied operations from Firestore.
 * Note: The multiHash is a valid IPFS MultiHash constructed by adding the IpfsBlock to IPFS,
 * but there will likely be no node hosting that file.
 */
async function createBlock(): Promise<VirtualBlock> {
  try {
    const data = await createIpfsBlock();
    const formattedData = formatData(data);
    const multiHash = await saveDataToIpfsAsFile(
      `block-${data.sequence}`,
      formattedData
    );
    const blockHash: string = getBlockHash(formattedData);
    console.log(
      `Block hash: ${blockHash}. Block IPFS multihash: ${multiHash}.`
    );
    await writeBlockDataToLocalFile(data, blockHash, formattedData);
    return {
      metadata: {
        hash: blockHash
      },
      data
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function main() {
  const block = await createBlock();
  // Exit if called directly.
  if (require.main === module) {
    process.exit();
  } else {
    return block;
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
