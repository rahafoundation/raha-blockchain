import { Block } from "./schema/blockchain/version_01";

export const BLOCKCHAIN_VERSION_NO = 1;

/**
 * Metadata we care about from the Stellar transaction.
 */
export interface StellarMetadata {
  hash: string;
  timeStr?: string;
  stellarTxId?: string;
}

/**
 * A block in the blockchain.
 * This can be considered a virtual data structured stored across both Stellar and IPFS.
 */
export interface VirtualBlock {
  metadata: StellarMetadata;
  data: Block;
}
