/**
 * A script to create a transaction recording a new IPFS block Multihash in Stellar.
 */

import RahaStellar, { getNewTestAccount } from '../RahaStellar';

const modes = ['test', 'prod'];

function errorOnUsage() {
    throw new Error('Usage is: node uploadBlock.ts [test|prod] [multiHash] [secretKey (optional if testing)]');
}

async function main(args) {
    // Verify existence of isTest and multiHash arguments
    if (args.length < 4) errorOnUsage();

    const mode = process.argv[2];
    if (!modes.includes(mode)) errorOnUsage();
    const isTest = mode === 'test';

    const multiHash = process.argv[3];

    let publicKey;
    let secretKey;
    if (args.length < 5) {
        if (isTest) {
            const keyPair = await getNewTestAccount();
            console.log(`New test public key is ${keyPair.publicKey()}.`);
            secretKey = keyPair.secret();
        } else {
            errorOnUsage();
        }
    } else {
        secretKey = args[4];
    }
    console.log(await new RahaStellar(isTest).createRahaBlockchainTransaction(multiHash, secretKey));
}


main(process.argv)
    .then(() => process.exit(0))
    .catch((err) => {
        if (err.name === 'BadResponseError') {
            console.error(err.message);
            console.error(JSON.stringify(err.data, null, 4));
        } else {
            console.error(err);
        }
        process.exit(1);
    });
