// Version 01 schema

// Hex-encoded sha-256 hash
export type Hash = string;
export type HashPointer = Hash;
export type Uid = string;
export type Datetime = string;

// Block schema
export interface Block {
  sequence: number; // 0-indexed
  version: 1;
  // The ISO 8601-formatted datetime at which the earliest version of this block was created.
  // If this is the first version of this block, see Stellar transaction timestamp.
  origin_created?: Datetime; // new
  // Points to the same block in the previous version of the blockchain.
  prev_version_hash?: HashPointer; // new
  // Points to the previous block in the blockchain. null for first block.
  prev_hash: HashPointer | null;
  // Operations contained in the block.
  operations: Operation[];
}

// Operation schema

export enum OperationTypes {
  REQUEST_INVITE = "REQUEST_INVITE",
  TRUST = "TRUST"
}

interface OperationBase {
  // global sequence number. Operations maintain sequence numbers across blockchain versions,
  // so if an operation becomes multiple operations in a later version of the
  // blockchain, all those operations will have the same sequence number.
  sequence: number;
  creator_uid: Uid; // new
}

// Data objects

// new
export interface RequestInviteData {
  full_name: string;
  // Uid of user requesting invite from.
  to_uid: Uid;
  // Hash of invite video.
  video_hash: Hash;
}

// new
export interface TrustData {
  // Uid of user to trust.
  to_uid: Uid;
}

export type RequestInviteOperation = OperationBase & {
  op_code: OperationTypes.REQUEST_INVITE;
  data: RequestInviteData;
};

export type TrustOperation = OperationBase & {
  op_code: OperationTypes.TRUST;
  data: TrustData;
};

export type Operation = RequestInviteOperation | TrustOperation;
