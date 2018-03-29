# Adding a block to the blockchain
1. Install dependencies: `yarn`
1. Use the prod database: `yarn use-prod-db`
1. Create the new block: `yarn create-block`
(TODO) If you seriously want to add this block to the blockchain,
confirm when the script prompts you to record the block with a
transaction on Stellar.
1. Upload the new block to the raha-blocks bucket in Google Cloud.
It should have been created in the root directory of this repository.
(You can use the browser console for this).
1. (TODO) Restart one of the machines in Google Cloud Compute.
It should be running a service script that will download all files from the
raha-blocks bucket and add them to ipfs.
