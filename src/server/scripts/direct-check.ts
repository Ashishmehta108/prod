import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/factory_inventory";

async function check() {
    await mongoose.connect(MONGO_URI);
    const Product = mongoose.model("Product", new mongoose.Schema({}));
    const p1 = await Product.findById("6975e8ba1db74d894aefd7c5");
    const p2 = await Product.findById("697a37f1ec7d057cc96ded62");
    console.log("Product 1 exists:", !!p1);
    console.log("Product 2 exists:", !!p2);
    await mongoose.disconnect();
}
check();
