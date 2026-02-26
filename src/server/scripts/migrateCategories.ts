import "dotenv/config";
import mongoose from "mongoose";
import { Product } from "../models/Product";
import { Category } from "../models/Category";

async function migrateCategories() {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error("MONGO_URI not found in environment");
        process.exit(1);
    }

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully.");

        // 1. Get unique category strings from products
        // We use .distinct() to get all unique values of the 'category' field
        const uniqueCategoryNames = await Product.distinct("category");

        // Filter out null, undefined, or empty strings
        const filteredNames = uniqueCategoryNames
            .filter(name => name && typeof name === 'string' && name.trim().length > 0)
            .map(name => name.trim());

        console.log(`Found ${filteredNames.length} unique category names in existing products:`, filteredNames);

        let createdCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const name of filteredNames) {
            try {
                // Check if this category already exists in the new Category model
                // Case-insensitive check to be extra safe
                const existing = await Category.findOne({
                    name: { $regex: new RegExp(`^${name}$`, 'i') }
                });

                if (!existing) {
                    await Category.create({
                        name: name,
                        description: "Auto-migrated from existing products",
                        isActive: true
                    });
                    console.log(`[CREATED] Category: "${name}"`);
                    createdCount++;
                } else {
                    console.log(`[SKIPPED] Category already exists: "${name}"`);
                    skippedCount++;
                }
            } catch (err) {
                console.error(`[ERROR] Failed to process category "${name}":`, err);
                errorCount++;
            }
        }

        console.log("\n-------------------------------------------");
        console.log("MIGRATION SUMMARY");
        console.log("-------------------------------------------");
        console.log(`Unique names processed: ${filteredNames.length}`);
        console.log(`New categories created: ${createdCount}`);
        console.log(`Existing skipped:      ${skippedCount}`);
        console.log(`Errors encountered:    ${errorCount}`);
        console.log("-------------------------------------------");

        if (errorCount === 0) {
            console.log("Migration finished successfully!");
        } else {
            console.log("Migration finished with some errors. Please check the logs above.");
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Migration failed with fatal error:", err);
        process.exit(1);
    }
}

migrateCategories();
