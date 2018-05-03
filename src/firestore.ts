/**
 * A module that exports an api for interacting with Raha's Firestore db.
 *
 * Example usage:
 * async function getAppliedOperations() {
 *     return await get(
 *         operationsCollectionFilters.applied(true)(
 *             operationsCollection()));
 * }
 */

import * as firebase from "firebase";
import "firebase/firestore";
import { Hash, Uid } from "./schema/blockchain/version_01";

const db = firebase
  // tslint:disable-next-line:no-var-requires
  .initializeApp(require("./config/firebase.config.json"))
  .firestore();

/**
 * Resolve a query on a Firestore collection.
 */
export async function get(collection: firebase.firestore.CollectionReference) {
  return (await collection.get()).docs;
}

/**
 * Return the Operations collection.
 */
export function operationsCollection() {
  return db.collection("operations");
}

/**
 * Filters that can be applied to an Firestore collection.
 */
export const operationsCollectionFilters = {
  applied: isApplied => collection =>
    collection.where("applied", "==", isApplied)
};

export async function getVideoHashForUid(uid: Uid): Promise<Hash> {
  return (await db
    .collection("uidToVideoHashMap")
    .doc(uid)
    .get()).get("hash");
}
