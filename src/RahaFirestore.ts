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

import * as firebase from 'firebase';
import 'firebase/firestore';

/**
 * Retrieve an instance of the Firestore db.
 */
function getFirebaseDb() {
    return firebase.initializeApp(require('./config/firebase.config.json')).firestore();
}

/**
 * Resolve a query on a Firestore collection.
 */
async function get(collection: firebase.firestore.CollectionReference) {
    return (await collection.get()).docs;
}

/**
 * Return the Operations collection.
 */
function operationsCollection() {
    return getFirebaseDb().collection('operations');
}

/**
 * Filters that can be applied to an Firestore collection.
 */
const operationsCollectionFilters = {
    applied: (isApplied) => (collection) => collection.where('applied', '==', isApplied),
};

export {
    get,
    operationsCollectionFilters,
    operationsCollection,
};