import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/factory_inventory";

async function crudTest() {
    await mongoose.connect(MONGO_URI);
    const { StockIn } = await import("../models/StockIn");
    const { Product } = await import("../models/Product");

    console.log("--- CRUD TEST START ---");

    // 1. Create a January record
    const testProduct = await Product.findOne();
    if (!testProduct) {
        console.log("No products available for test");
        return;
    }

    const newRecord = await StockIn.create({
        productId: testProduct._id,
        quantity: 10,
        supplier: "Test Supplier",
        date: new Date("2026-01-15T10:00:00Z")
    });
    console.log("Created Jan 15 record:", newRecord._id);

    // 2. Update it
    newRecord.quantity = 15;
    await newRecord.save();
    console.log("Updated record quantity to 15");

    // 3. Find it
    const found = await StockIn.findById(newRecord._id);
    console.log("Found record in DB:", !!found && found.quantity === 15);

    // 4. Delete it
    await StockIn.findByIdAndDelete(newRecord._id);
    console.log("Deleted test record");

    console.log("--- CRUD TEST END ---");
    await mongoose.disconnect();
}
crudTest();
