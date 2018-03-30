import * as bs58 from 'bs58';
import { Buffer } from 'buffer';
import StellarSdk from 'stellar-sdk';

import { STELLAR_ENDPOINT, RAHA_IO_STELLAR_PUBLIC_KEY } from './constants';

/**
 * Note: TransactionMetadata is undocumented and quite ugly to interact with. Mark had to look into the SDK source to do
 * TODO: Can we use documented features/do this in an easier to understand and less brittle way?
 */
function getFirstOperationAttributesFromTransactionMeta(transactionMeta) {
    return transactionMeta._value[0]._attributes.changes[0]._value._attributes.data._value._attributes
}

/**
 * Return the name of a block from transaction metadata.
 */
export function getBlockNameFromTransactionMeta(transactionMeta) {
    return getFirstOperationAttributesFromTransactionMeta(transactionMeta).dataName;
}

/**
 * Legacy method for blocks set using only managed data with no memo hash.
 * See note on TransactionMetadata above.
 */
export function getMultiHashFromTransactionMeta(transactionMeta) {
    const charCode = getFirstOperationAttributesFromTransactionMeta(transactionMeta).dataValue;
    return String.fromCharCode.apply(null, charCode);
}

/**
 * Extract the TransactionMeta XDR object from the Stellar transaction.
 * See note on TransactionMetadata above.
 */
export function getTransactionMetaFromTransaction(stellarTx) {
    // xdr cast because StellarSdk XDR typing is bad.
    return (StellarSdk.xdr as any).TransactionMeta.fromXDR(stellarTx.result_meta_xdr, 'base64');
}

function multiHashToMemo(base58MultiHash) {
    const bytes = bs58.decode(base58MultiHash);
    return bytes.slice(2);
}

class RahaStellar {
    isTest;
    horizonServer : StellarSdk.Server;

    constructor (isTest) {
        this.isTest = isTest;
        StellarSdk.Network.usePublicNetwork();
        this.horizonServer = new StellarSdk.Server(STELLAR_ENDPOINT);
    }

    async getRahaAccount() {
        return this.horizonServer.loadAccount(RAHA_IO_STELLAR_PUBLIC_KEY);
    }

    /**
     * Return all transactions associated with the Raha account from the Stellar blockchain ordered chronologically.
     * TODO: Documentation doesn't specify the current page limit. Add paging support.
     * Update: Default limit is 10, max is 200. https://stellar.stackexchange.com/a/792/1187.
     */
    async getTransactions() {
        return (await this.horizonServer.transactions()
            .forAccount(RAHA_IO_STELLAR_PUBLIC_KEY)
            .order('desc')
            .limit(200)
            .call()).records;
    }

    /**
     * Create a new transaction in the Stellar blockchain that records
     * the multiHash of the new block.
     */
    async createRahaBlockchainTransaction(multiHash, secretKey) {
        // Lol. these types are broken. also, so is the documentation.
        const memo = new StellarSdk.Memo('hash' as 'MemoHash', multiHashToMemo(multiHash));
        const transaction = new StellarSdk.TransactionBuilder(await this.getRahaAccount())
            .addMemo(memo)
            .build();
        transaction.sign(StellarSdk.Keypair.fromSecret(secretKey));
        try {
            if (this.isTest) {
                console.log('Returning without submitting transaction.');
                return 0;
            } else {
                return this.horizonServer.submitTransaction(transaction);
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}

export default RahaStellar;
