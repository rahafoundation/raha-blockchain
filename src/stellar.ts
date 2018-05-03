import * as bs58 from "bs58";
import { Buffer } from "buffer";
import fetch from "isomorphic-fetch";
import StellarSdk from "stellar-sdk";
import { URL, URLSearchParams } from "url";

import {
  IPFS_SHA_256_LEN_32_PREFIX,
  STELLAR_ENDPOINT,
  RAHA_IO_STELLAR_PUBLIC_KEY,
  STELLAR_TEST_ENDPOINT
} from "./constants";

/**
 * Note: TransactionMetadata is undocumented and quite ugly to interact with. Mark had to look into the SDK source to do
 * TODO: Can we use documented features/do this in an easier to understand and less brittle way?
 */
function getFirstOperationAttributesFromTransactionMeta(transactionMeta) {
  return transactionMeta._value[0]._attributes.changes[0]._value._attributes
    .data._value._attributes;
}

/**
 * Return the name of a block from transaction metadata.
 */
export function getBlockNameFromTransactionMeta(transactionMeta) {
  return getFirstOperationAttributesFromTransactionMeta(transactionMeta)
    .dataName;
}

/**
 * Legacy method for blocks set using only managed data with no memo hash.
 * See note on TransactionMetadata above.
 */
export function getHashFromTransactionMeta(transactionMeta) {
  const charCode = getFirstOperationAttributesFromTransactionMeta(
    transactionMeta
  ).dataValue;
  return String.fromCharCode.apply(null, charCode);
}

/**
 * Extract the TransactionMeta XDR object from the Stellar transaction.
 * See note on TransactionMetadata above.
 */
export function getTransactionMetaFromTransaction(stellarTx) {
  // xdr cast because StellarSdk XDR typing is bad.
  return (StellarSdk.xdr as any).TransactionMeta.fromXDR(
    stellarTx.result_meta_xdr,
    "base64"
  );
}

/**
 * TODO: On change to raw sha-256 hashes, we shouldn't need to decode and slice multihash bytes.
 */
export function sha256MultiHashToMemo(base58MultiHash: string) {
  const multiHashBuffer = bs58.decode(base58MultiHash);
  const multiHashBytes = Uint8Array.from(multiHashBuffer);
  const multiHashPrefix = multiHashBytes
    .slice(0, IPFS_SHA_256_LEN_32_PREFIX.length)
    .toString();
  if (multiHashPrefix !== IPFS_SHA_256_LEN_32_PREFIX.toString()) {
    throw new Error(`Invalid MultiHash prefix: ${multiHashPrefix}.`);
  }
  return multiHashBuffer.slice(2);
}

/**
 * Create a new Stellar account for testing (on the test network). Returns a
 * KeyPair object with the new account's public and private keys.
 */
export async function getNewTestAccount() {
  const keyPair = StellarSdk.Keypair.random();
  const friendBotFundRequest = new URL("https://friendbot.stellar.org");
  friendBotFundRequest.searchParams.append("addr", keyPair.publicKey());
  await fetch(friendBotFundRequest.href);
  return keyPair;
}

class StellarMemoHashes {
  useTestNetwork: boolean;
  horizonServer: StellarSdk.Server;

  constructor(useTestNetwork) {
    this.useTestNetwork = useTestNetwork;
    if (useTestNetwork) {
      StellarSdk.Network.useTestNetwork();
      this.horizonServer = new StellarSdk.Server(STELLAR_TEST_ENDPOINT);
    } else {
      StellarSdk.Network.usePublicNetwork();
      this.horizonServer = new StellarSdk.Server(STELLAR_ENDPOINT);
    }
  }

  async getAccount(address) {
    return this.horizonServer.loadAccount(address);
  }

  /**
   * Return all transactions associated with the Raha account from the Stellar blockchain ordered chronologically.
   * TODO: Documentation doesn't specify the current page limit. Add paging support.
   * Update: Default limit is 10, max is 200. https://stellar.stackexchange.com/a/792/1187.
   */
  async getTransactions(address = RAHA_IO_STELLAR_PUBLIC_KEY) {
    return (await this.horizonServer
      .transactions()
      .forAccount(address)
      .order("desc")
      .limit(200)
      .call()).records;
  }

  /**
   * Create a new transaction in the Stellar blockchain that records
   * the multiHash of the new block.
   */
  async createRahaBlockchainTransaction(multiHash: string, secretKey: string) {
    // Lol. these types are broken. also, so is the documentation.
    const memo = new StellarSdk.Memo(
      "hash" as "MemoHash",
      sha256MultiHashToMemo(multiHash)
    );
    const keyPair = StellarSdk.Keypair.fromSecret(secretKey);
    const address = keyPair.publicKey();
    if (address !== RAHA_IO_STELLAR_PUBLIC_KEY && !this.useTestNetwork) {
      console.warn(
        "The public key of provided secret key does not match known RAHA_IO_STELLAR_PUBLIC_KEY."
      );
    }
    const transaction = new StellarSdk.TransactionBuilder(
      await this.getAccount(keyPair.publicKey())
    )
      .addOperation(
        StellarSdk.Operation.manageData({
          name: "block-latest",
          value: multiHash
        })
      )
      .addMemo(memo)
      .build();
    transaction.sign(keyPair);
    return await this.horizonServer.submitTransaction(transaction);
  }
}

export default StellarMemoHashes;
