import "dotenv/config";
import mongoose from "mongoose";
import { Product } from "../models/Product";
import { StockIn } from "../models/StockIn";
import { StockOut } from "../models/StockOut";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI not found in environment variables");
    process.exit(1);
}

const DEPARTMENTS = ["Production", "Packaging", "Quality Control", "Maintenance", "Sales"];
const SUPPLIERS = ["Global Materials Co.", "Industrial Supplies Ltd.", "Tech Components Inc.", "Direct Raw Materials"];
const USERS = ["John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson", "Robert Brown"];
const LOCATIONS = ["Warehouse A", "Warehouse B", "Main Store", "Cold Storage"];
const PURPOSES = ["Production Line A", "Client Order #1234", "Machine Maintenance", "Export", "Internal Testing"];

async function seedStock() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI as string);
        console.log("Connected to MongoDB");

        const products = await Product.find({});
        console.log(`Found ${products.length} products`);

        if (products.length === 0) {
            console.log("No products found to seed stock for. Please add some products first.");
            process.exit(0);
        }

        // Clear existing stock data (optional, but good for a fresh seed)
        // await StockIn.deleteMany({});
        // await StockOut.deleteMany({});
        // console.log("Cleared existing stock data");

        for (const product of products) {
            console.log(`Seeding stock for product: ${product.name}`);

            // Seed Stock In
            const stockInCount = Math.floor(Math.random() * 51) + 50; // 50 to 100 records
            const StockInRecords = [];

            for (let i = 0; i < stockInCount; i++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Last 90 days

                StockInRecords.push({
                    productId: product._id,
                    quantity: Math.floor(Math.random() * 100) + 10,
                    supplier: SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)],
                    invoiceNo: `INV-${Math.floor(Math.random() * 10000)}`,
                    location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
                    date: date,
                });
            }

            await StockIn.insertMany(StockInRecords);
            console.log(`  Added ${stockInCount} Stock In records`);

            // Seed Stock Out
            const stockOutCount = Math.floor(Math.random() * 51) + 50; // 50 to 100 records
            const StockOutRecords = [];

            for (let i = 0; i < stockOutCount; i++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Last 90 days

                StockOutRecords.push({
                    productId: product._id,
                    quantity: Math.floor(Math.random() * 20) + 5,
                    department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
                    issuedBy: USERS[Math.floor(Math.random() * USERS.length)],
                    issuedTo: USERS[Math.floor(Math.random() * USERS.length)],
                    purpose: PURPOSES[Math.floor(Math.random() * PURPOSES.length)],
                    date: date,
                });
            }

            await StockOut.insertMany(StockOutRecords);
            console.log(`  Added ${stockOutCount} Stock Out records`);
        }

        console.log("Stock seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding stock:", error);
        process.exit(1);
    }
}

seedStock();
