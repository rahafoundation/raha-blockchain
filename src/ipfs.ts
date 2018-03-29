import { Buffer } from 'buffer';
import IPFS from 'ipfs';

/**
 * Add the given data to IPFS.
 * Returns a promise that resolves with the IPFS MultiHash of the data.
 *
 * Note, you'll probably have to re-add the data to an IPFS node yourself,
 * as this function spins up an IPFS node only temporarily, and the data
 * will likely be nowhere else on the network once the node is stopped
 * and the promise resolves.
 */
function saveDataToIpfsAsFile(filename, data): Promise<string> {
    return new Promise((resolve, reject) => {
        const node = new IPFS();
        let multiHash;
        node.on('ready', () => {
            node.files.add({
                path: filename,
                content: Buffer.from(data),
            }, null, (err, res) => {
                if (err) {
                    reject(err);
                }
                resolve(res[0].hash);
                node.stop();
            });
        });
    });
}

export {
    saveDataToIpfsAsFile,
};
