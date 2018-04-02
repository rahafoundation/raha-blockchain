/**
 * Creates the next block in the Raha Blockchain from unapplied operations in Firestore.
 *
 * This module is intended to be run in a Node environment, not the browser.
 *
 * Example usage:
 * node dist/createBlock.js > newBlock.json
 */

import * as fs from 'fs';
import { saveDataToIpfsAsFile } from '../modules/ipfs';
import { getBlockchain } from '../modules/blockchain';
import { operationsCollectionFilters as filters, get, operationsCollection } from '../modules/firestore';
import { BLOCKCHAIN_VERSION_NO, Block, StellarMetadata, IpfsBlock, Operation, RequestInvite, Trust } from '../modules/schema';

/**
 * A map of functions that build the data component of Blockchain Operations from
 * the data component of Firestore Operations.
 */
const blockchainOpDataBuilders = {
    REQUEST_INVITE: (firestoreOpData): RequestInvite => ({
        full_name: firestoreOpData.full_name,
        to_mid: firestoreOpData.to_mid,
        video_url: firestoreOpData.video_url,
    }),
    TRUST: (firestoreOpData): Trust => ({
        to_mid: firestoreOpData.to_mid,
    }),
}

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
function buildBlockchainOpFromFirestoreOp(
    firestoreOp: firebase.firestore.DocumentSnapshot, index: number
): Operation | undefined {
    const opCode = firestoreOp.get('op_code');

    if (!(opCode in blockchainOpDataBuilders)) {
        return undefined;
    }
    const operationDataBuilder = blockchainOpDataBuilders[opCode];

    const blockchainOp = {
        sequence: index,
        op_code: opCode,
        creator_mid: firestoreOp.get('creator_mid'),
        data: operationDataBuilder(firestoreOp.get('data')),
    };
    return validateBlockchainOp(blockchainOp) ? blockchainOp : undefined;
}

/**
 * Return a list of all valid unapplied operations from Firestore.
 */
async function getBlockOperations(): Promise<Operation[]> {
    const unappliedFirestoreOps = await get(
        filters.applied(false)(
            operationsCollection()));

    let i = 0;
    const blockchainOperations = unappliedFirestoreOps.map(
        (op) => buildBlockchainOpFromFirestoreOp(op, i++));
    return blockchainOperations.filter(x => x) as Operation[];
}

/**
 * Assumes the blockchain list is sorted by sequence number. Returns the last sequence number + 1.
 */
function getNextBlockSequenceNumber(blockchain: Block[]): number {
    return blockchain[blockchain.length - 1].data.sequence + 1;
}

/**
 * Assumes the blockchain list is sorted by sequence number. Returns the hash of the last block.
 */
function getLastBlockHash(blockchain: Block[]): string {
    return blockchain[blockchain.length - 1].metadata.multiHash;
}

/**
 * Create an IpfsBlock with all valid unapplied operations from Firestore.
 */
async function createIpfsBlock(): Promise<IpfsBlock> {
    // getBlockchain and getBlockOperations in parallel.
    const [ blockchain, blockOperations ] = await Promise.all(
        [ getBlockchain(), getBlockOperations() ]);
    const validOperations = filterInvalidBlockchainOps(blockchain, blockOperations);

    return {
        sequence: getNextBlockSequenceNumber(blockchain),
        origin_created: undefined,
        version: BLOCKCHAIN_VERSION_NO,
        prev_version_block: undefined,
        prev_hash: getLastBlockHash(blockchain),
        operations: validOperations,
    };
}

/**
 * Return Block as string.
 */
function formatData(data) {
    return JSON.stringify(data, null, 4);
}

/**
 * Write the block to a file.
 */
async function writeBlockDataToLocalFile(blockData, multiHash, formattedData) {
    return new Promise((resolve, error) => {
        const filename = `block-${blockData.sequence}-${multiHash}.json`;
        fs.writeFile(filename, formattedData, (err) => {
            if (err) {
                error(err);
            } else {
                console.log(`Please upload ${filename} to the raha-blocks bucket in Google Cloud.`);
                console.log('If you have configured gsutil as described in the README, you may use the following command:');
                console.log(`gsutil cp ${filename} gs://raha-blocks/`);
                resolve();
            }
        });
    });
}

/**
 * Create a Block with all valid unapplied operations from Firestore.
 * Note: The multiHash is a valid IPFS MultiHash constructed by adding the IpfsBlock to IPFS,
 * but there will likely be no node hosting that file.
 */
async function createBlock(): Promise<Block> {
    try {
        const data = await createIpfsBlock();
        const formattedData = formatData(data);
        const multiHash = await saveDataToIpfsAsFile(`block-${data.sequence}`, formatData);
        await writeBlockDataToLocalFile(data, multiHash, formattedData);
        return {
            metadata: {
                multiHash: multiHash,
            },
            data,
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

main();

