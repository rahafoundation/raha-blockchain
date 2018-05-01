import { getBlockchain } from "./blockchain";
import {
  operationsCollectionFilters as filters,
  get,
  operationsCollection
} from "./firestore";

async function test() {
  console.log("starting");
  const blocks = await getBlockchain();
  console.log(blocks);
  console.log("done with blocks");
  const operations = await get(filters.applied(false)(operationsCollection()));
  console.log(operations);
  console.log("done with operations");
  console.log("done");
}

test();
