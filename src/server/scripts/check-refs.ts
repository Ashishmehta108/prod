import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { BSON } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/factory_inventory";
const BACKUP_DIR = path.join(process.cwd(), "factory_inventory - Copy");

async function checkProductRefs() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db!;

    const buffer = fs.readFileSync(path.join(BACKUP_DIR, "stockins.bson"));
    let offset = 0;

    const Product = mongoose.model("Product", new mongoose.Schema({}));

    while (offset < buffer.length) {
        const size = buffer.readInt32LE(offset);
        const doc = BSON.deserialize(buffer.subarray(offset, offset + size));

        const date = new Date(doc.date).toISOString();
        if (date.startsWith("2026-01-28")) {
            const product = await Product.findById(doc.productId);
            console.log(`StockIn on ${date} points to Product ${doc.productId}. Exists in DB: ${!!product}`);
        }

        offset += size;
    }

    await mongoose.disconnect();
}

checkProductRefs();
