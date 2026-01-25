import { Router } from "express";
import { Product } from "../models/Product";
import { StockIn } from "../models/StockIn";
import { StockOut } from "../models/StockOut";
import mongoose from "mongoose";

const router = Router();

// GET /api/dashboard
router.get("/", async (_req, res) => {
  try {
    const products = await Product.find().lean();

    let lowStockCount = 0;

    const summaries = await Promise.all(
      products.map(async (p) => {
        const productId = new mongoose.Types.ObjectId(p._id);

        const inAgg = await StockIn.aggregate([
          { $match: { productId } },
          { $group: { _id: null, total: { $sum: "$quantity" } } }
        ]);

        const outAgg = await StockOut.aggregate([
          { $match: { productId } },
          { $group: { _id: null, total: { $sum: "$quantity" } } }
        ]);

        const totalIn = inAgg[0]?.total || 0;
        const totalOut = outAgg[0]?.total || 0;
        const currentStock = totalIn - totalOut;

        if (currentStock < p.minStock) lowStockCount++;

        return {
          id: p._id,
          name: p.name,
          currentStock,
          minStock: p.minStock
        };
      })
    );

    res.json({
      totalProducts: products.length,
      lowStockCount,
      products: summaries
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

export default router;
