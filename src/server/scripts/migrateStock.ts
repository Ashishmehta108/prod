import "dotenv/config";
import mongoose from "mongoose";
import { Product } from "../models/Product";
import { StockIn } from "../models/StockIn";
import { StockOut } from "../models/StockOut";

async function migrate() {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error("MONGO_URI not found in environment");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const products = await Product.find({});
        console.log(`Found ${products.length} products to migrate`);

        for (const product of products) {
            const productId = product._id;

            // Aggregate Stock In
            const [inAgg] = await StockIn.aggregate([
                { $match: { productId } },
                { $group: { _id: null, total: { $sum: "$quantity" } } },
            ]);

            // Aggregate Stock Out
            const [outAgg] = await StockOut.aggregate([
                { $match: { productId } },
                { $group: { _id: null, total: { $sum: "$quantity" } } },
            ]);

            const totalIn = inAgg?.total || 0;
            const totalOut = outAgg?.total || 0;
            const currentStock = totalIn - totalOut;

            await Product.findByIdAndUpdate(productId, {
                stockQuantity: currentStock,
            });

            console.log(`Updated product ${product.name}: TotalIn=${totalIn}, TotalOut=${totalOut}, CurrentStock=${currentStock}`);
        }

        console.log("Migration completed successfully");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
