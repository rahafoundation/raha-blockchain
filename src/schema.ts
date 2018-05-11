import { Block } from "./schema/blockchain/version_01";

export const BLOCKCHAIN_VERSION_NO = 1;

/**
 * Block Metadata we care about from the Stellar transaction.
 * This allows us to verify the block data and creation time by storing this
 * information in an external trusted blockchain.
 */
export interface StellarMetadata {
  multiHash: string;
  timeStr?: string;
  stellarTxId?: string;
}

/**
 * A block in the blockchain composed of the raw block data and Stellar Metadata.
 * This can be considered a virtual data structured stored across both Stellar and IPFS.
 */
export interface VirtualBlock {
  metadata: StellarMetadata;
  data: Block;
}
