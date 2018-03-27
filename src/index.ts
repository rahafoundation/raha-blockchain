import { getBlocks } from './RahaBlockchain';
import { operationsCollectionFilters as filters, get, operationsCollection } from './RahaFirestore';

async function test() {
    console.log('starting');
    const blocks = await getBlocks();
    console.log(blocks);
    console.log('done with blocks');
    const operations = await get(
        filters.applied(false)(
            operationsCollection()))
    console.log(operations);
    console.log('done with operations');
    console.log('done');
}

test();
