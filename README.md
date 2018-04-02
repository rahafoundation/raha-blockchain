# Adding a block to the blockchain
1. Install dependencies: `yarn`
1. Use the prod database: `yarn use-prod-db`
1. Create the new block: `yarn create-block`
1. Upload the new block to the raha-blocks bucket in Google Cloud.
It should have been created in the root directory of this repository.
(The script should have output a gsutil cli command you can use to do this.
Or, you can use the browser console).
1. Follow the instructions below on pinning blocks to IPFS.
1. Record the new block in a Stellar transaction:
`yarn create-block [test|prod] [multiHash] [secretKey]`. Example usage:
`yarn create-block prod QmTcHdEZNrKB3zb5XSUeMUy83kfVJCbxcbRuFqDYdDxdsa $(openssl aes-256-cbc -d -in ~/.enc_secret_key)`

## Setting up gsutil
1. Install gsutil: `pip install gsutil`
* Note gsutil requires python2.7 and does not work with python3
1. Initialize gsutil credentials: `gsutil config`
* gsutil will give you a link to paste into your browser. You may have to
remove the final param, `access_type=offline` from the url.

## Pinning all blocks to IPFS
We run a machine in Google compute with an IPFS daemon.
We then download all blocks from the blockchain to this machine
and pin them to the IPFS node, ensuring their availability on
IPFS. See the following instructions:

### Create a new machine
1. Go to the Google Cloud Compute console
1. Create a new instance. The only settings you should need to change are:
* Machine type: change to [small]
* Firewall: [allow HTTPS traffic]

### Set up IPFS on a new machine
1. Ssh into the machine (ssh button on Cloud Compute console) and run:
```
wget https://dist.ipfs.io/go-ipfs/v0.4.13/go-ipfs_v0.4.13_linux-amd64.tar.gz
tar xvfz go-ipfs_v0.4.13_linux-amd64.tar.gz
./go-ipfs/ipfs init
```

### Run the IPFS daemon.
1. Use screen to run the daemon: `screen`
1. Run the daemon: `~/go-ipfs/ipfs daemon`
1. Detach your screen so the daemon can continue to run after
you've logged out: `[ctrl+a] [d]`

### Download and pin all blocks
* Do this step if all you need to do is refresh the pinned
blocks. (i.e. after adding a block to the blockchain)
1. Ensure that `~/downloadAndPinBlocks.sh` exists. If not:
```
cat >~/downloadAndPinBlocks.sh <<EOL
#!/bin/bash
set -x

rm -rf /tmp/raha-blocks
gsutil cp -r gs://raha-blocks /tmp/

# Ensure that IPFS is running and output bandwidth stats.
if pidof -x ipfs > /dev/null
then
    echo "IPFS is running."
else
    echo "IPFS is not running."
    exit 1
fi

rm -f addedBlocks
rm -f multiHashes
ls /tmp/raha-blocks | xargs -I % ~/go-ipfs/ipfs add /tmp/raha-blocks/% >> addedBlocks
cat addedBlocks | awk -F ' ' '{printf "%s\n", \$2}' >> multiHashes
cat multiHashes | ~/go-ipfs/ipfs pin add
EOL

chmod +x downloadAndPinBlocks.sh
```
1. Run the script: `./downloadAndPinBlocks.sh`.
1. Optionally: see `addedBlocks` and `multiHashes` for the
added blocks and their multiHashes.
