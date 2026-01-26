import { Router } from "express";
import mongoose from "mongoose";
import { StockIn } from "../models/StockIn";
import { StockOut } from "../models/StockOut";
import { Product } from "../models/Product";

const router = Router();

// GET /api/stock/summary
router.get("/summary", async (req, res) => {
  try {
    const { from, to, productId } = req.query;

    // Validate date range
    if (!from || !to) {
      return res.status(400).json({
        error: "Both 'from' and 'to' date parameters are required (ISO date format)",
      });
    }

    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);

    // Set toDate to end of day for inclusive range
    toDate.setHours(23, 59, 59, 999);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({
        error: "Invalid date format. Please use ISO date format (YYYY-MM-DD)",
      });
    }

    if (fromDate > toDate) {
      return res.status(400).json({
        error: "'from' date must be before or equal to 'to' date",
      });
    }

    // Build product filter
    const productFilter: any = {};
    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId as string)) {
        return res.status(400).json({ error: "Invalid productId" });
      }
      productFilter._id = new mongoose.Types.ObjectId(productId as string);
    }

    // Get all products (or filtered product)
    const products = await Product.find(productFilter).lean();

    if (products.length === 0) {
      return res.json([]);
    }

    const productIds = products.map((p) => p._id);

    // Aggregate StockIn for date range
    const stockInRange = await StockIn.aggregate([
      {
        $match: {
          productId: { $in: productIds },
          date: { $gte: fromDate, $lte: toDate },
        },
      },
      {
        $group: {
          _id: "$productId",
          totalStockInInRange: { $sum: "$quantity" },
        },
      },
    ]);

    // Aggregate StockOut for date range
    const stockOutRange = await StockOut.aggregate([
      {
        $match: {
          productId: { $in: productIds },
          date: { $gte: fromDate, $lte: toDate },
        },
      },
      {
        $group: {
          _id: "$productId",
          totalStockOutInRange: { $sum: "$quantity" },
        },
      },
    ]);

    // Aggregate all-time StockIn for current stock calculation
    const stockInAllTime = await StockIn.aggregate([
      {
        $match: {
          productId: { $in: productIds },
        },
      },
      {
        $group: {
          _id: "$productId",
          totalIn: { $sum: "$quantity" },
        },
      },
    ]);

    // Aggregate all-time StockOut for current stock calculation
    const stockOutAllTime = await StockOut.aggregate([
      {
        $match: {
          productId: { $in: productIds },
        },
      },
      {
        $group: {
          _id: "$productId",
          totalOut: { $sum: "$quantity" },
        },
      },
    ]);

    // Create lookup maps for efficient access
    const stockInRangeMap = new Map(
      stockInRange.map((item) => [
        item._id.toString(),
        item.totalStockInInRange || 0,
      ])
    );

    const stockOutRangeMap = new Map(
      stockOutRange.map((item) => [
        item._id.toString(),
        item.totalStockOutInRange || 0,
      ])
    );

    const stockInAllTimeMap = new Map(
      stockInAllTime.map((item) => [item._id.toString(), item.totalIn || 0])
    );

    const stockOutAllTimeMap = new Map(
      stockOutAllTime.map((item) => [item._id.toString(), item.totalOut || 0])
    );

    // Build response
    const result = products.map((product) => {
      const productIdStr = product._id.toString();
      const totalStockInInRange = stockInRangeMap.get(productIdStr) || 0;
      const totalStockOutInRange = stockOutRangeMap.get(productIdStr) || 0;
      const totalIn = stockInAllTimeMap.get(productIdStr) || 0;
      const totalOut = stockOutAllTimeMap.get(productIdStr) || 0;
      const currentAvailableStock = totalIn - totalOut;

      return {
        productId: productIdStr,
        productName: product.name,
        unit: product.unit,
        totalStockInInRange,
        totalStockOutInRange,
        currentAvailableStock,
      };
    });

    res.json(result);
  } catch (error: any) {
    console.error("[Stock Summary] Error:", error);
    res.status(500).json({
      error: "Failed to fetch stock summary",
      message: error.message,
    });
  }
});

export default router;
