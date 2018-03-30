# Adding a block to the blockchain
1. Install dependencies: `yarn`
1. Use the prod database: `yarn use-prod-db`
1. Create the new block: `yarn create-block`
1. Upload the new block to the raha-blocks bucket in Google Cloud.
It should have been created in the root directory of this repository.
(The script should have output a gsutil cli command you can use to do this.
Or, you can use the browser console).
1. (TODO) Restart one of the machines in Google Cloud Compute.
It should be running a service script that will download all files from the
raha-blocks bucket and add them to ipfs.
1. Record the new block in a Stellar transaction:
`yarn create-block [isTest(y/n)] [multiHash] [secretKey]`. Example usage:
`yarn create-block y QmTcHdEZNrKB3zb5XSUeMUy83kfVJCbxcbRuFqDYdDxdsa $(openssl aes-256-cbc -d -in ~/.enc_secret_key)`

## Setting up gsutil
1. Install gsutil: `pip install gsutil`
* Note gsutil requires python2.7 and does not work with python3
1. Initialize gsutil credentials: `gsutil config`
* gsutil will give you a link to paste into your browser. You may have to
remove the final param, `access_type=offline` from the url.
