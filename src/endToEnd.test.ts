import { expect } from 'chai';
import IPFS from 'ipfs';
import StellarSdk from 'stellar-sdk';

import RahaStellar, { getNewTestAccount } from "./RahaStellar";
import { saveDataToIpfsAsFile } from "./RahaIpfs";
import { getBlockchain } from './RahaBlockchain';
import { IpfsBlock } from './RahaSchema';

/**
 * Test steps:
 * * TODO: Create operations in Firestore.
 * * TODO: Create a block from those operations.
 * * Upload a block to IPFS.
 * * Record block in a transaction in Stellar.
 * * Get transaction back from Stellar.
 * * Verify block contents.
 */

describe('An EndToEnd test for creating a new block in the blockchain.', function() {
    const block : IpfsBlock = {
        sequence: 3,
        prev_hash: undefined,
        origin_created: undefined,
        version: 1,
        prev_version_block: undefined,
        operations: [],
    };
    const blockContents = JSON.stringify(block);
    const expectedMultiHash = 'QmbYbzo6s8KeirqciMx99EyitXvs2mYh1mWgpKhQLuXc3y';

    let ipfsNode;
    let keyPair : StellarSdk.Keypair;

    // Set test timeout to 30 seconds.
    this.timeout(30000);

    before(async function () {
        ipfsNode = new IPFS();
        console.log('IPFS node initialized.');
        keyPair = await getNewTestAccount();
        console.log('New Stellar test account created.');
    });

    it('Should upload a block to IPFS.', async function () {
        this.timeout(10000);
        const multiHash = await saveDataToIpfsAsFile('testFile', blockContents, ipfsNode);
        console.log(multiHash);
        expect(multiHash).to.equal(expectedMultiHash);
    });

    it('Should record the block\'s multihash in a transaction in Stellar.', async function() {
        const stellar = new RahaStellar(true);
        await stellar.createRahaBlockchainTransaction(expectedMultiHash, keyPair.secret());
        // Fail if this throws an error.
    });

    it('It should be able to retrieve the Blockchain from Stellar and IPFS.', async function () {
        const blockchain = await getBlockchain(keyPair.publicKey(), true);
        expect(blockchain.length).to.equal(1);
        const blockMetadata = blockchain[0].metadata;
        expect(blockMetadata.multiHash).to.equal(expectedMultiHash);
        const blockData = blockchain[0].data;
        for (let key in Object.keys(block)) {
            if (block[key] !== undefined) {
                expect(blockData[key]).to.equal(block[key]);
            }
        }
    });

    after(function(done) {
        ipfsNode.on('stop', () => done());
        ipfsNode.stop();
    })
});