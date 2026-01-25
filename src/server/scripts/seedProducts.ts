import "dotenv/config";
import mongoose from "mongoose";
import { Product } from "../models/Product";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI not found in environment variables");
    process.exit(1);
}

const CATEGORIES = ["Raw Material", "Finished Goods", "Packaging", "Spare Parts", "Chemicals"];
const UNITS = ["kg", "pcs", "mtr", "ltr", "pkt", "box"];
const MACHINE_NAMES = ["Extruder-01", "Cutter-A", "Mixer-Main", "Packaging Unit 1", "Quality Scanner"];

const PRODUCT_ADJECTIVES = ["Premium", "Standard", "Efficient", "High-Grade", "Eco-Friendly", "Industrial", "Advanced", "Basic"];
const PRODUCT_TYPES = ["Polymer", "Resin", "Fiber", "Adhesive", "Coating", "Solvent", "Granule", "Pellet"];

async function seedProducts() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI as string);
        console.log("Connected to MongoDB");

        // Clear existing products (Optional: uncomment if you want exactly 52 products total)
        // console.log("Clearing existing products...");
        // await Product.deleteMany({});

        const productsToInsert = [];

        for (let i = 1; i <= 52; i++) {
            const adj = PRODUCT_ADJECTIVES[Math.floor(Math.random() * PRODUCT_ADJECTIVES.length)];
            const type = PRODUCT_TYPES[Math.floor(Math.random() * PRODUCT_TYPES.length)];
            const name = `${adj} ${type} - ${String(i).padStart(3, '0')}`;

            const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
            const unit = UNITS[Math.floor(Math.random() * UNITS.length)];
            const machineName = Math.random() > 0.3 ? MACHINE_NAMES[Math.floor(Math.random() * MACHINE_NAMES.length)] : undefined;
            const minStock = Math.floor(Math.random() * 500) + 50;
            const refIds = [`REF-${Math.floor(Math.random() * 100000)}`, `SKU-${Math.floor(Math.random() * 10000)}`];

            productsToInsert.push({
                name,
                category,
                unit,
                minStock,
                refIds,
                machineName,
            });
        }

        console.log(`Inserting 52 products...`);
        await Product.insertMany(productsToInsert);
        console.log("Product seeding completed successfully!");

        process.exit(0);
    } catch (error) {
        console.error("Error seeding products:", error);
        process.exit(1);
    }
}

seedProducts();
