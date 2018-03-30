/**
 * A script to create a transaction recording a new IPFS block Multihash in Stellar.
 */

import RahaStellar from '../RahaStellar';

async function main() {
    if (process.argv.length !== 5) {
        console.log('Usage is: node uploadBlock.ts [isTest(y/n)] [multiHash] [secretKey]')
        process.exit(1);
    } else {
        const isTest = process.argv[2] == 'y';
        const multiHash = process.argv[3];
        const secretKey = process.argv[4];
        console.log(await new RahaStellar(isTest).createRahaBlockchainTransaction(multiHash, secretKey));
        process.exit(0);
    }
    // console.log(await (new RahaStellar(true).createRahaBlockchainTransaction(
    //     'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'SBK2VIYYSVG76E7VC3QHYARNFLY2EAQXDHRC7BMXBBGIFG74ARPRMNQM')));
}

main();