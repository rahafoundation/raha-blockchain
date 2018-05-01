# Version 00 schema

## Block schema

```
{
   "sequence": [int][block_sequence_no], // 0-indexed
   "version": 0,
   "prev_hash": [hashPtr][hash_of_the_previous_block], // null for first block
   "operations": [list(operation)][operations_contained_in_block]
}
```

## Operation schema

```
{
    "sequence": [int][operation_seqeuence_no], // 0-indexed
    "op": [string][choice(operation)],
    "data": [obj][operation_specific_data_obj]
}
```

## Choices

operation: `["CREATE_USER"]`

## Data objects

### CREATE_USER

```
{
    "full_name": [string][full_name],
    "user_name": [string][user_name],
    "admin": [string][user_name_of_inviting_user],
    "trust": [list(string)][user_names_of_trusted_users]
}
```
