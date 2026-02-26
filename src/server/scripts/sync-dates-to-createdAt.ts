/**
 * Script: sync-dates-to-createdAt.ts
 * Sets the `date` field of every StockIn and StockOut record
 * to exactly match its `createdAt` timestamp.
 *
 * Run: npx ts-node src/server/scripts/sync-dates-to-createdAt.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/factory_inventory";

async function syncCollection(collectionName: string) {
    const db = mongoose.connection.db!;
    const col = db.collection(collectionName);

    const total = await col.countDocuments();
    console.log(`\n[${collectionName}] Found ${total} documents`);

    const result = await col.updateMany(
        {}, // all documents
        [
            {
                $set: {
                    date: "$createdAt"  // MongoDB aggregation pipeline syntax — copies createdAt into date
                }
            }
        ]
    );

    console.log(`[${collectionName}] Updated ${result.modifiedCount} / ${total} documents`);
}

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        await syncCollection("stockins");
        await syncCollection("stockouts");

        // Verify a sample record
        const db = mongoose.connection.db!;
        const sample = await db.collection("stockins").findOne({});
        if (sample) {
            console.log("\n--- Sample StockIn after sync ---");
            console.log(`  _id:       ${sample._id}`);
            console.log(`  date:      ${new Date(sample.date).toISOString()}`);
            console.log(`  createdAt: ${new Date(sample.createdAt).toISOString()}`);
            console.log(`  match:     ${new Date(sample.date).getTime() === new Date(sample.createdAt).getTime() ? "✅ YES" : "❌ NO"}`);
        }

        console.log("\n✅ Sync complete!");
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

main();
