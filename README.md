# Adding a block to the blockchain
1. Install dependencies: `yarn`
1. Use the prod database: `yarn use-prod-db`
1. Create the new block: `yarn create-block`
(TODO) If you seriously want to add this block to the blockchain,
confirm when the script prompts you to record the block with a
transaction on Stellar.
1. Upload the new block to the raha-blocks bucket in Google Cloud.
It should have been created in the root directory of this repository.
(The script should have output a gsutil cli command you can use to do this.
Or, you can use the browser console).
1. (TODO) Restart one of the machines in Google Cloud Compute.
It should be running a service script that will download all files from the
raha-blocks bucket and add them to ipfs.

## Setting up gsutil
1. Install gsutil: `pip install gsutil`
* Note gsutil requires python2.7 and does not work with python3
1. Initialize gsutil credentials: `gsutil config`
* gsutil will give you a link to paste into your browser. You may have to
remove the final param, `access_type=offline` from the url.
