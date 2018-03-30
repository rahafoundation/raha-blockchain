import { expect } from 'chai';
import IPFS from 'ipfs';
import StellarSdk from 'stellar-sdk';

import RahaStellar, { getNewTestAccount } from "./RahaStellar";
import { saveDataToIpfsAsFile } from "./RahaIpfs";

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
    const blockContents = 'Raha E2E Block Test Contents.';
    const expectedMultiHash = 'QmNdNoLUozAweXrRBaAZKTjpccxY6eeW5T7PSKVAxkXWh5';

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
        expect(multiHash).to.equal(expectedMultiHash);
    });

    it('Should record the block\'s multihash in a transaction in Stellar.', async function() {
        const stellar = new RahaStellar(true);
        await stellar.createRahaBlockchainTransaction(expectedMultiHash, keyPair.secret());
        // Fail if this throws an error.
    });

    after(function(done) {
        ipfsNode.on('stop', () => done());
        ipfsNode.stop();
    })
});