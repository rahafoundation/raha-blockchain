# Version 0 Schema
## Operations
```
{
    "version": [int][firebase_schema_version],
    "applied": [boolean][operation_is_added_to_blockchain],
    "block_at": [datetime][added_to_blockchain_at],
    "block_seq": [int][seq_no_of_blockchain_block],
    "created_at": [datetime][operation_doc_created_at],
    "creator_mid": [string][raha_created_unique_member_id],
    "creator_uid": [string][firebase_created_user_unique_id], // auth backend specific
    "op_code": [string][operation],
    "data": [data_obj],
    "op_seq": [int][sequence_number_of_operation_in_blockchain_block]
}
```

## Member
The member object is a "view" on top of Operations that describes Raha network members.
```
{
    "version": [int][firebase_schema_version],
    "id": [string][firebase_created_user_unique_id], // auth backend specific
    "full_name": [string][member_full_name],
    "invite_confirmed": [boolean][invite_request_reciprocated],
    "mid": [string][raha_created_unique_member_id],
    "requested_invite_from_mid": [string][mid_of_requestee],
    "requested_invite_from_uid": [string][uid_of_requestee],
    "video_url": [string][url_of_invite_video]
}
```

### Data objects
#### Operations(REQUEST_INVITE)
```
{
    "full_name": [string][full_name],
    "to_mid": [string][mid_of_requestee],
    "to_uid": [string][uid_of_requestee],
    "video_url": [string][url_of_invite_video]
}
```

#### Operations(TRUST)
```
{
    "to_mid": [string][mid_of_trusted],
    "to_uid": [string][uid_of_trusted]
}
```