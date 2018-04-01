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
function saveDataToIpfsAsFile(filename, data, providedNode=undefined): Promise<string> {
    return new Promise((resolve, reject) => {
        const node = providedNode === undefined ? new IPFS() : providedNode;
        let multiHash;

        async function addFile() {
            // If the IPFS node is already online, the 'ready' callback will not get triggered.
            // Wrapping this in a promise ensures that we only add the file once.
            await new Promise((innerResolve, innerReject) => {
                node.on('ready', () => {
                    innerResolve();
                });
                node.on('error', (err) => {
                    innerReject(err);
                });
                if (node.isOnline()) {
                    innerResolve();
                }
            });

            node.files.add({
                path: filename,
                content: Buffer.from(data),
            }, null, (err, res) => {
                if (err) {
                    reject(err);
                }
                resolve(res[0].hash);
                // Stop the node if we created it.
                if (providedNode === undefined) {
                    node.stop();
                }
            });
        }

        addFile();
    });
}

export {
    saveDataToIpfsAsFile,
};
