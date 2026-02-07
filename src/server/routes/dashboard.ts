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

    const lowStockCount = await Product.countDocuments({
      $expr: { $lt: ["$stockQuantity", "$minStock"] }
    });

    const summaries = products.map((p) => ({
      id: p._id,
      name: p.name,
      currentStock: p.stockQuantity,
      minStock: p.minStock
    }));

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
