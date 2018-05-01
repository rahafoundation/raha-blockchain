import { expect } from "chai";
import IPFS from "ipfs";
import StellarSdk from "stellar-sdk";

import StellarMemoHashes, { getNewTestAccount } from "./stellar";
import { saveDataToIpfsAsFile } from "./ipfs";
import { getBlockchain } from "./blockchain";
import { Block } from "./schema/blockchain/version_01";

/**
 * Test steps:
 * * TODO: Create operations in Firestore.
 * * TODO: Create a block from those operations.
 * * Upload a block to IPFS.
 * * Record block in a transaction in Stellar.
 * * Get transaction back from Stellar.
 * * Verify block contents.
 */

describe("An EndToEnd test for creating a new block in the blockchain.", () => {
  jest.setTimeout(30000);

  const block: Block = {
    sequence: 3,
    prev_hash: null,
    version: 1,
    operations: []
  };
  const blockContents = JSON.stringify(block);
  const expectedMultiHash = "QmbYbzo6s8KeirqciMx99EyitXvs2mYh1mWgpKhQLuXc3y";

  let ipfsNode;
  let keyPair: StellarSdk.Keypair;

  beforeAll(async () => {
    ipfsNode = new IPFS();
    console.log("IPFS node initialized.");
    keyPair = await getNewTestAccount();
    console.log("New Stellar test account created.");
  });

  it("Should upload a block to IPFS.", async () => {
    const multiHash = await saveDataToIpfsAsFile(
      "testFile",
      blockContents,
      ipfsNode
    );
    console.log(multiHash);
    expect(multiHash).to.equal(expectedMultiHash);
  });

  it("Should record the block's multihash in a transaction in Stellar.", async () => {
    const stellar = new StellarMemoHashes(true);
    await stellar.createRahaBlockchainTransaction(
      expectedMultiHash,
      keyPair.secret()
    );
    // Fail if this throws an error.
  });

  it("It should be able to retrieve the Blockchain from Stellar and IPFS.", async () => {
    const blockchain = await getBlockchain(keyPair.publicKey(), true);
    expect(blockchain.length).to.equal(1);
    const blockMetadata = blockchain[0].metadata;
    expect(blockMetadata.multiHash).to.equal(expectedMultiHash);
    const blockData = blockchain[0].data;
    for (const key in Object.keys(block)) {
      if (block.hasOwnProperty(key)) {
        expect(blockData[key]).to.equal(block[key]);
      }
    }
  });

  afterAll(done => {
    ipfsNode.stop();
    ipfsNode.on("stop", () => done());
  });
});
