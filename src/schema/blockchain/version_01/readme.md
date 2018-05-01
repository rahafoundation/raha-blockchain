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
