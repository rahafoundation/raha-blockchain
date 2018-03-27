import { Buffer } from 'buffer';
import * as bs58 from 'bs58';
import fetch, { Response } from 'node-fetch';
import StellarSdk from 'stellar-sdk';

import { IPFS_ENDPOINT, IPFS_SHA_256_LEN_32_PREFIX, STELLAR_ENDPOINT, RAHA_IO_STELLAR_PUBLIC_KEY } from './constants';

/**
 * Note: TransactionMetadata is undocumented and quite ugly to interact with. Mark had to look into the SDK source to do this.
 * TODO: Can we use documented features/do this in an easier to understand and less brittle way?
 */
function getBlockNameFromTransactionMeta(transactionMeta) {
    return transactionMeta._value[0]._attributes.changes[0]._value._attributes.data._value._attributes.dataName;
}

/**
 * Legacy method for blocks set using only managed data with no memo hash.
 * See note on TransactionMetadata above.
 */
function getMultiHashFromTransactionMeta(transactionMeta) {
    const charCode = transactionMeta._value[0]._attributes.changes[0]._value._attributes.data._value._attributes.dataValue;
    return String.fromCharCode.apply(null, charCode);
}

/**
 * Extract the TransactionMeta XDR object from the Stellar transaction.
 * See note on TransactionMetadata above.
 */
function getTransactionMetaFromTransaction(stellarTx) {
    // xdr cast because StellarSdk XDR typing is bad.
    return (StellarSdk.xdr as any).TransactionMeta.fromXDR(stellarTx.result_meta_xdr, 'base64');
}

/**
 * A utility function to convert a Raha transaction memo (stored on Stellar) to a base58-encoded IPFS MultiHash.
 */
function memoToMultiHash(memoHashB64) {
    // Source: https://github.com/node-browser-compat/atob/blob/master/node-atob.js.
    const memoHashBytes = Buffer.from(memoHashB64, 'base64').toString('binary');
    const byteVals = memoHashBytes.split('').map(c => c.charCodeAt(0));
    const resBytes = IPFS_SHA_256_LEN_32_PREFIX.concat(byteVals);
    return bs58.encode(Uint8Array.from(resBytes));
}

/**
 * Transform a Stellar transaction into an object describing the Raha blockchain block to which it points.
 * Return null if the transaction does not describe a block.
 */
function stellarTxToBlockMetaData(stellarTx) {
    const transactionMeta = getTransactionMetaFromTransaction(stellarTx);
    const blockName = getBlockNameFromTransactionMeta(transactionMeta);
    if (!blockName || !blockName.startsWith('block-')) {
        // This is not a blockchain transaction.
        return null;
    }
    const stellarTxId = stellarTx.id;
    const timeStr = stellarTx.created_at;
    const multiHash = stellarTx.memo ? memoToMultiHash(stellarTx.memo) : getMultiHashFromTransactionMeta(transactionMeta);
    return { multiHash, stellarTxId, timeStr };
}

class RahaBlockchain {
    horizonServer;
    transactions;
    blockMetadata;
    blocks;

    constructor() {
        this.horizonServer = new StellarSdk.Server(STELLAR_ENDPOINT);
    }

    /**
     * Return all transactions associated with the Raha account from the Stellar blockchain ordered chronologically.
     */
    async getTransactions() {
        if (this.transactions === undefined) {
            this.transactions = (await this.horizonServer.transactions()
                .forAccount(RAHA_IO_STELLAR_PUBLIC_KEY)
                .order('desc')
                .call()).records;
        }
        return this.transactions;
    }

    /**
     * Return metadata about all IPFS blocks in the Raha blockchain.
     */
    async getBlockMetadata() {
        if (this.blockMetadata === undefined) {
            const transactions = await this.getTransactions();
            this.blockMetadata = transactions.map(stellarTxToBlockMetaData).filter(x => x !== null);
        }
        return this.blockMetadata;
    }

    /**
     * Return the entire Raha blockchain as a list of objects ordered chronologically.
     */
    async getBlocks() {
        if (this.blocks === undefined) {
            const blockMetaData = await this.getBlockMetadata();
            const multiHashes = blockMetaData.map((metaData) => metaData.multiHash);
            const blocksData = await Promise.all<Response>(
                multiHashes.map((multiHash) => fetch(IPFS_ENDPOINT + multiHash)));
            this.blocks = await Promise.all(
                blocksData.map((blockData) => blockData.json()));
        }
        return this.blocks;
    }
}

export default RahaBlockchain;