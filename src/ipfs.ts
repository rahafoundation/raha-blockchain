import { Buffer } from "buffer";
import IPFS from "ipfs";

/**
 * Add the given data to IPFS.
 * Returns a promise that resolves with the IPFS MultiHash of the data.
 *
 * Note, you'll probably have to re-add the data to an IPFS node yourself,
 * as this function spins up an IPFS node only temporarily, and the data
 * will likely be nowhere else on the network once the node is stopped
 * and the promise resolves.
 */
async function saveDataToIpfsAsFile(
  filename: string,
  data: string,
  providedIpfsNode?
): Promise<string> {
  const node = providedIpfsNode === undefined ? new IPFS() : providedIpfsNode;

  // If the IPFS node is already online, the 'ready' callback will not get triggered.
  // Wrapping this in a promise ensures that we only add the file once.
  await new Promise((resolve, reject) => {
    node.on("ready", () => {
      resolve();
    });
    node.on("error", err => {
      reject(err);
    });
    if (node.isOnline()) {
      resolve();
    }
  });

  return await new Promise<Promise<string>>((resolve, reject) => {
    node.files.add(
      {
        path: filename,
        content: Buffer.from(data)
      },
      null,
      (err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res[0].hash);
        // Stop the node if we created it.
        if (providedIpfsNode === undefined) {
          node.stop();
        }
      }
    );
  });
}

export { saveDataToIpfsAsFile };
