# Version 1 schema

## Block schema

```
{
   "sequence": [int][block_sequence_no], // 0-indexed
   "origin_created": [datetime][created_datetime_of_same_block_with_earliest_version], // new
   "version": 1,
   "prev_version_block": [hashPtr][ptr_to_same_block_in_previous_version_of_blockchain], // new
   "prev_hash": [hash][hash_of_the_previous_block], // null for first block
   "operations": [list][operations_contained_in_block]
}
```

## Operation schema

```
{
    "sequence": [int][operation_seqeuence_no], // 0-indexed
    "op_code": [string][choice(operation)],
    "creator_uid": [string][raha_assigned_uid], // new
    "data": [obj][operation_specific_data_obj]
}
```

## Choices

operation: `["REQUEST_INVITE", "TRUST"]`

## Data objects

### REQUEST_INVITE `// new`

```
{
    "full_name": [string][full_name],
    "to_uid": [string][mid_of_user_requesting_invite_from],
    "video_multihash": [multihash][multihash_of_invite_video],
}
```

### Trust `// new`

```
{
    "to_uid": [string][mid_of_user_to_trust],
}
```

## Notes

* A user, Alice, can only TRUST another user if there exists a path of TRUST to Alice from a user, Bob, who become a member of the network in a prior block. Block 0 is exempt from this restriction.

## Changelog

### Enable blockchain versioning

* added `prev_version_block` hashPtr to block schema
* added `origin_created` datetime to block schema

### Update operation schema

* add the `creator_uid` field.
  * All previously created users are now assigned an mid.
  * New users are assigned an mid upon joining Raha.
  * Mids can be changed via a to-be-added RENAME operation.
* renamed `op` field to `op_code`
* replaced `CREATE_USER` operation with `REQUEST_INVITE` and `TRUST` operations.
  * All previously created users now have `REQUEST_INVITE` and `TRUST` operations in the same block sequence number they were created in.
