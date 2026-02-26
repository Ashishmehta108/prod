import fs from "fs";
import path from "path";
import { BSON } from "mongodb";

const BACKUP_DIR = path.join(process.cwd(), "factory_inventory - Copy");

function checkProductInBackup(productId: any) {
    const buffer = fs.readFileSync(path.join(BACKUP_DIR, "products.bson"));
    let offset = 0;
    while (offset < buffer.length) {
        const size = buffer.readInt32LE(offset);
        const doc = BSON.deserialize(buffer.subarray(offset, offset + size));
        if (doc._id.toString() === productId.toString()) return true;
        offset += size;
    }
    return false;
}

const stockBuffer = fs.readFileSync(path.join(BACKUP_DIR, "stockins.bson"));
let offset = 0;
while (offset < stockBuffer.length) {
    const size = stockBuffer.readInt32LE(offset);
    const doc = BSON.deserialize(stockBuffer.subarray(offset, offset + size));
    const date = new Date(doc.date).toISOString();
    if (date.startsWith("2026-01-28")) {
        console.log(`Product ${doc.productId} for StockIn on ${date} in backup: ${checkProductInBackup(doc.productId)}`);
    }
    offset += size;
}
