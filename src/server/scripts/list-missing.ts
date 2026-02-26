import fs from "fs";
import path from "path";
import { BSON } from "mongodb";

const BACKUP_DIR = path.join(process.cwd(), "factory_inventory - Copy");

const stockBuffer = fs.readFileSync(path.join(BACKUP_DIR, "stockins.bson"));
let offset = 0;
const missingProductIds = new Set<string>();

while (offset < stockBuffer.length) {
    const size = stockBuffer.readInt32LE(offset);
    const doc = BSON.deserialize(stockBuffer.subarray(offset, offset + size));
    const date = new Date(doc.date).toISOString();
    if (date.startsWith("2026-01-28")) {
        missingProductIds.add(doc.productId.toString());
    }
    offset += size;
}

console.log("Missing product IDs:", Array.from(missingProductIds));

// Let's see if we can find these IDs anywhere else or if we can see what their records look like in the DB (if they WERE restored)
// Actually, they WON'T be in the DB because I used findById to skip.
// But wait, if they weren't in the DB, they should have been created!
// Unless they WERE in the DB but pointing to null? No.
