import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { BSON } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/factory_inventory";
const BACKUP_DIR = path.join(process.cwd(), "factory_inventory - Copy");

async function restoreCollection(collectionName: string, modelName: string) {
    const filePath = path.join(BACKUP_DIR, `${collectionName}.bson`);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }

    const buffer = fs.readFileSync(filePath);
    let offset = 0;
    const documents: any[] = [];

    while (offset < buffer.length) {
        const size = buffer.readInt32LE(offset);
        if (offset + size > buffer.length) break;
        const docBuffer = buffer.subarray(offset, offset + size);
        const doc = BSON.deserialize(docBuffer);
        documents.push(doc);
        offset += size;
    }

    console.log(`Loaded ${documents.length} documents from ${collectionName}.bson`);

    const Model = mongoose.model(modelName);
    let restoredCount = 0;

    for (const doc of documents) {
        // We only care about January/Early February data that might be missing
        // or just restore everything that doesn't exist.
        const existing = await Model.findById(doc._id);
        if (!existing) {
            await Model.create(doc);
            restoredCount++;
        }
    }

    console.log(`Restored ${restoredCount} new documents to ${modelName}`);
}

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // We need to make sure models are registered
        // Importing models dynamically or assuming they are already loaded
        // For this script, we'll define minimal schemas if needed, 
        // but since we are using Models from the codebase, we should import them.

        // Let's import the models properly
        const { StockIn } = await import("../models/StockIn");
        const { StockOut } = await import("../models/StockOut");
        const { Product } = await import("../models/Product");
        const { Category } = await import("../models/Category");

        console.log("Restoring Categories...");
        await restoreCollection("categories", "Category");

        console.log("Restoring Products...");
        await restoreCollection("products", "Product");

        console.log("Restoring StockIn...");
        await restoreCollection("stockins", "StockIn");

        console.log("Restoring StockOut...");
        await restoreCollection("stockouts", "StockOut");

        console.log("Data restoration complete.");

        // After restoration, we should run the migrate-stock script logiic to sync quantities
        console.log("Syncing product quantities...");
        const products = await Product.find({});
        for (const product of products) {
            const productId = product._id;
            const ins = await StockIn.find({ productId });
            const outs = await StockOut.find({ productId });

            const totalIn = ins.reduce((sum, item) => sum + (item.quantity || 0), 0);
            const totalOut = outs.reduce((sum, item) => sum + (item.quantity || 0), 0);
            const currentStock = totalIn - totalOut;

            await Product.findByIdAndUpdate(productId, { stockQuantity: currentStock });
            console.log(`Updated ${product.name}: ${currentStock}`);
        }

        console.log("All done!");
        process.exit(0);
    } catch (error) {
        console.error("Error during restoration:", error);
        process.exit(1);
    }
}

main();
