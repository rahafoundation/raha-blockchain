// Version 1 schema

type Multihash = string;
type HashPointer = string;
type UID = string;
type Datetime = string;

// Block schema
interface Block {
  sequence: number; // 0-indexed
  // The datetime at which the earliest version of this block was created.
  origin_created: Datetime; // new
  version: 1;
  // Points to the same block in the previous version of the blockchain.
  prev_version_block?: HashPointer; // new
  // Points to the previous block in the blockchain. null for first block.
  prev_hash: HashPointer | null;
  // Operations contained in the block.
  operations: Operation[];
}

// Operation schema

enum OperationTypes {
  REQUEST_INVITE = "REQUEST_INVITE",
  TRUST = "TRUST"
}

interface OperationBase {
  sequence: number; // 0-indexed
  creator_uid: UID; // new
}

// Data objects

// new
interface RequestInviteData {
  full_name: string;
  // UID of user requesting invite from.
  to_uid: UID;
  // Multihash of invite video.
  video_multihash: Multihash;
}

// new
interface TrustData {
  // UID of user to trust.
  to_uid: UID;
}

type RequestInviteOperation = OperationBase & {
  op_code: OperationTypes.REQUEST_INVITE;
  data: RequestInviteData;
};

type TrustOperation = OperationBase & {
  op_code: OperationTypes.TRUST;
  data: TrustData;
};

type Operation = RequestInviteOperation | TrustOperation;
