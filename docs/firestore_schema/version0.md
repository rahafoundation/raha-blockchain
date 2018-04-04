# Version 0 Schema
## Operations
```typescript
type Operation {
    // Schema version
    version: int,
    // Has the operation been applied to the blockchain?
    applied: boolean,
    // ISO-formatted datetime at which this operation was included in the blockchain
    block_at: string,
    // Sequence number of the block cointaining this operation
    block_seq: int,
    // ISO-formatted datetime at which this operation document was created
    created_at: string,
    // MID of the creator of this operation
    creator_mid: string,
    // UID of the creator of this operation - auth backend specific
    creator_uid: string,
    // The type of this operation  - one of [REQUEST_INVITE and TRUST]
    op_code: string,
    // An object containing information specific to the operation type
    data: object,
    // The sequence number of this operation in its blockchain block
    op_seq: int
}
```

## Member
The member object is a view on top of Operations that describes Raha network members.
```typescript
type Member {
    // Schema version
    version: int,
    // UID of this member - the same as the UID of the auth-backend-specific firebase user
    id: string,
    // Member's full name
    full_name: string,
    // Has the user been trusted by the member they requested an invite from?
    invite_confirmed: boolean,
    // The member's raha-created unique MID
    // This is usually a '.' separated full name suffixed by a '$' and random 4-digit number
    mid: string,
    // The MID of the member this user requested an invite from
    requested_invite_from_mid: string,
    // The UID of the member this user requested an invite from
    requested_invite_from_uid: [string][uid_of_requestee],
    // The URL of the invite video
    video_url: [string][url_of_invite_video]
}
```

### Data objects
#### Operations(REQUEST_INVITE)
```typescript
type Data_RequestInvite {
    // User's full name
    full_name: string,
    // MID of the member the invite is being requested from
    to_mid: string,
    // UID of the member the invite is being requested from
    to_uid: string,
    // URL of the invite video
    video_url: string
}
```

#### Operations(TRUST)
```typescript
type Data_Trust {
    // MID of the user being trusted
    to_mid: string,
    // UID of the user being trusted
    to_uid: string
}
```