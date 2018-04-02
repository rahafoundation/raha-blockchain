/**
 * Raha Blockchain Schema Version 1.
 * TODO: Define the schema using an InterfaceDefinitionLanguage like Thrift
 * that can then be compiled to interfaces in other languages.
 */

const BLOCKCHAIN_VERSION_NO = 1;

interface OperationData {}

interface RequestInvite extends OperationData {
    full_name: string,
    to_mid: string,
    video_url: string,
}

interface Trust extends OperationData {
    to_mid: string,
}

interface Operation {
    sequence: number,
    op_code: string,
    creator_mid: string,
    data: OperationData,
}

/**
 * The interface of the block as stored in IPFS.
 */
interface IpfsBlock {
    sequence: number,
    origin_created?: string,
    version: 0 | 1,
    prev_version_block?: string,
    prev_hash: string | undefined,
    operations: Array<Operation>,
}

/**
 * Metadata we care about from the Stellar transaction.
 */
interface StellarMetadata {
    multiHash: string,
    timeStr?: string,
    stellarTxId?: string,
}

/**
 * A block in the blockchain.
 * This can be considered a virtual data structured stored across both Stellar and IPFS.
 */
interface Block {
    metadata: StellarMetadata,
    data: IpfsBlock,
}

export {
    BLOCKCHAIN_VERSION_NO,
    Block,
    IpfsBlock,
    StellarMetadata,
    Operation,
    RequestInvite,
    Trust,
};
