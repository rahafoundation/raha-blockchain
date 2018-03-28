/**
 * Creates the next block in the Raha Blockchain from unapplied operations in Firestore.
 *
 * Example usage:
 * node dist/createBlock.js > newBlock.json
 */

import { getBlockchain } from './RahaBlockchain';
import { operationsCollectionFilters as filters, get, operationsCollection } from './RahaFirestore';
import { BLOCKCHAIN_VERSION_NO, Block, StellarMetadata, IpfsBlock, Operation, RequestInvite, Trust } from './schema';

/**
 * A map of functions that build the data component of Blockchain Operations from
 * the data component of Firestore Operations.
 */
const bcOpDataBuilders = {
    'REQUEST_INVITE': (fsOpData): RequestInvite => ({
        full_name: fsOpData.full_name,
        to_mid: fsOpData.to_mid,
        video_url: fsOpData.video_url,
    }),
    'TRUST': (operationData): Trust => ({
        to_mid: operationData.to_mid,
    }),
}

/**
 * Filter new operations are invalid within the context of the current blockchain.
 * This means:
 *   * users cannot perform operations on nonexistent users.
 *   * // TODO: there must exist a trust path from a user who joined in a previous block to any user who performs a new TRUST operation
 */
function filterBcOpsAgainstBlockchain(blockchain, bcOps) {
    // Create a set of creator_mid on all REQUEST_INVITE operations in blockchain and bcOps.
    // Check if to_mid, from_mid is included in above set.
    // TODO;
    return bcOps;
}

/**
 * TODO.
 */
function validateBcOp(bcOp) {
    return true;
}

/**
 * Build a Blockchain Operation from a Firestore Operation. Returns undefined if the operation is invalid.
 */
function buildBcOpFromFsOp(
        fsOp, index: number): Operation|void {
    const opCode = fsOp.get('op_code');
    const operationDataBuilder = bcOpDataBuilders[opCode];
    if (!operationDataBuilder) {
        return undefined;
    }

    const bcOp = {
        sequence: index,
        op_code: opCode,
        creator_mid: fsOp.get('creator_mid'),
        data: operationDataBuilder(fsOp.get('data')),
    };
    return validateBcOp(bcOp) ? bcOp : undefined;
}

/**
 * Return a list of all valid unapplied operations from Firestore.
 */
async function getBlockOperations(): Promise<Operation[]> {
    const unappliedFsOps = await get(
        filters.applied(false)(
            operationsCollection()));

    let i = 0;
    const blockchainOperations = unappliedFsOps.map(
        (op) => buildBcOpFromFsOp(op, i++));
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
    const blockchain = await getBlockchain();
    const blockOperations = await getBlockOperations();
    const validOperations = filterBcOpsAgainstBlockchain(blockchain, blockOperations);

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
 * Compute an IPFS MultiHash over the provided data.
 * TODO.
 */
function computeMultiHash(data: string) {
    return 'multihash';
}

/**
 * Return Block as string.
 */
function formatData(data) {
    return JSON.stringify(data, null, 4);
}

/**
 * Create a Block with all valid unapplied operations from Firestore.
 */
async function createBlock(): Promise<Block> {
    const data = await createIpfsBlock();
    const formattedData = formatData(data);
    return {
        metadata: {
            multiHash: computeMultiHash(formattedData),
            timeStr: '',
            stellarTxId: '',
        },
        data,
    }
}

createBlock().then((block) => {
    console.log(formatData(block))
    process.exit();
});
