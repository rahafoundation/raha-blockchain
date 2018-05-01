import { Buffer } from "buffer";
import * as bs58 from "bs58";
import fetch, { Response } from "isomorphic-fetch";
import StellarSdk from "stellar-sdk";
import * as url from "url";

import {
  IPFS_ENDPOINT,
  IPFS_SHA_256_LEN_32_PREFIX,
  STELLAR_ENDPOINT,
  RAHA_IO_STELLAR_PUBLIC_KEY
} from "./constants";
import { BLOCKCHAIN_VERSION_NO, VirtualBlock, StellarMetadata } from "./schema";
import RahaStellar, {
  getTransactionMetaFromTransaction,
  getBlockNameFromTransactionMeta,
  getMultiHashFromTransactionMeta
} from "./stellar";

/**
 * A utility function to convert a Raha transaction memo (stored on Stellar) to a base58-encoded IPFS MultiHash.
 */
function memoToMultiHash(memoHashB64) {
  // Source: https://github.com/node-browser-compat/atob/blob/master/node-atob.js.
  const memoHashBytes = Buffer.from(memoHashB64, "base64").toString("binary");
  const byteVals = memoHashBytes.split("").map(c => c.charCodeAt(0));
  const resBytes = IPFS_SHA_256_LEN_32_PREFIX.concat(byteVals);
  return bs58.encode(Uint8Array.from(resBytes));
}

/**
 * Transform a Stellar transaction into an object describing the Raha blockchain block to which it points.
 * Return null if the transaction does not describe a block.
 */
function stellarTxToBlockMetaData(stellarTx): StellarMetadata | void {
  const transactionMeta = getTransactionMetaFromTransaction(stellarTx);
  const blockName = getBlockNameFromTransactionMeta(transactionMeta);
  if (!blockName || !blockName.startsWith("block-")) {
    // This is not a blockchain transaction.
    return undefined;
  }
  const stellarTxId = stellarTx.id;
  const timeStr = stellarTx.created_at;
  const multiHash = stellarTx.memo
    ? memoToMultiHash(stellarTx.memo)
    : getMultiHashFromTransactionMeta(transactionMeta);
  return { multiHash, stellarTxId, timeStr };
}

/**
 * Return metadata about all IPFS blocks in the Raha blockchain.
 */
async function getBlockMetadata(account, isTest): Promise<StellarMetadata[]> {
  const transactions = await new RahaStellar(isTest).getTransactions(account);
  return transactions
    .map(stellarTxToBlockMetaData)
    .filter(x => x) as StellarMetadata[];
}

async function getBlockFromBlockMetadata(metadata): Promise<VirtualBlock> {
  return {
    metadata,
    data: await (await fetch(
      url.resolve(IPFS_ENDPOINT, metadata.multiHash)
    )).json()
  };
}

/**
 * Filter blocks which don't belong to the latest version of the blockchain.
 */
function filterBlocksByVersion(blocks) {
  return blocks.filter(x => x.data.version === BLOCKCHAIN_VERSION_NO);
}

/**
 * Sort blocks in ascending order.
 */
function sortBlocks(blocks) {
  return blocks.sort((a, b) => a.data.sequence - b.data.sequence);
}

/**
 * Return the entire Raha blockchain as a list of objects ordered by block sequence number.
 */
async function getBlockchain(
  account = RAHA_IO_STELLAR_PUBLIC_KEY,
  isTest = false
): Promise<VirtualBlock[]> {
  const blockMetadata: StellarMetadata[] = await getBlockMetadata(
    account,
    isTest
  );
  const blocks: VirtualBlock[] = await Promise.all(
    blockMetadata.map(getBlockFromBlockMetadata)
  );
  return sortBlocks(filterBlocksByVersion(blocks));
}

export { getBlockMetadata, getBlockchain };
