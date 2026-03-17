import { Router } from "express";
import { StockOut } from "../models/StockOut";
import { StockIn } from "../models/StockIn";
import { Product } from "../models/Product";
import mongoose from "mongoose";

const router = Router();

async function getCurrentStock(productId: string): Promise<number> {
  const objId = new mongoose.Types.ObjectId(productId);

  const inAgg = await StockIn.aggregate([
    { $match: { productId: objId } },
    { $group: { _id: null, total: { $sum: "$quantity" } } },
  ]);

  const outAgg = await StockOut.aggregate([
    { $match: { productId: objId } },
    { $group: { _id: null, total: { $sum: "$quantity" } } },
  ]);

  const totalIn = inAgg[0]?.total || 0;
  const totalOut = outAgg[0]?.total || 0;
  return totalIn - totalOut;
}

router.get("/", async (req, res) => {
  try {
    const { search, department, dateFrom, dateTo } = req.query;
    const match: any = {};

    if (department) {
      match.department = { $regex: department, $options: "i" };
    }

    if (dateFrom || dateTo) {
      match.date = {};
      if (dateFrom) match.date.$gte = new Date(dateFrom as string);
      if (dateTo) match.date.$lte = new Date(dateTo as string);
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productId",
        },
      },
      { $unwind: "$productId" },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "productId.name": { $regex: search, $options: "i" } },
            { department: { $regex: search, $options: "i" } },
            { issuedBy: { $regex: search, $options: "i" } },
            { issuedTo: { $regex: search, $options: "i" } },
            { purpose: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }

    pipeline.push(
      { $sort: { date: -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                quantity: 1,
                department: 1,
                issuedBy: 1,
                issuedTo: 1,
                purpose: 1,
                date: 1,
                "productId._id": 1,
                "productId.name": 1,
                "productId.image": 1,
                "productId.unit": 1,
              }
            }
          ],
          meta: [{ $count: "total" }]
        }
      }
    );

    const results = await StockOut.aggregate(pipeline);
    const result = results[0] || { data: [], meta: [] };
    const records = result.data || [];
    const total = result.meta?.[0]?.total || 0;

    res.json({
      data: records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stock-out records" });
  }
});

// POST /api/stock-out
router.post("/", async (req, res) => {
  try {
    const {
      productId,
      quantity,
      department,
      issuedBy,
      issuedTo,
      purpose,
      date,
    } = req.body;

    if (!productId || !quantity) {
      return res
        .status(400)
        .json({ error: "productId and quantity are required" });
    }

    const qty = Number(quantity);
    const current = await getCurrentStock(productId);

    if (current < qty) {
      return res.status(400).json({
        error: `Insufficient stock. Current: ${current}, requested: ${qty}`,
      });
    }

    const record = await StockOut.create({
      productId,
      quantity: qty,
      department,
      issuedBy,
      issuedTo,
      purpose,
      date: date ? new Date(date) : undefined,
    });

    // Note: StockQuantity decrement is now handled by StockOut model hooks!

    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create stock-out record" });
  }
});

// POST /api/stock-out/bulk — create multiple stock-out records in one request
router.post("/bulk", async (req, res) => {
  try {
    const { items, department, issuedBy, issuedTo, purpose, date } = req.body as {
      items: Array<{ productId: string; quantity: number | string }>;
      department?: string;
      issuedBy?: string;
      issuedTo?: string;
      purpose?: string;
      date?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items are required" });
    }

    const normalized = items
      .map((it) => ({
        productId: String(it.productId || "").trim(),
        quantity: Number(it.quantity),
      }))
      .filter((it) => it.productId && !isNaN(it.quantity) && it.quantity > 0);

    if (normalized.length === 0) {
      return res.status(400).json({ error: "At least one valid item is required" });
    }

    // Merge duplicates to validate stock correctly
    const qtyByProduct = new Map<string, number>();
    for (const it of normalized) {
      qtyByProduct.set(it.productId, (qtyByProduct.get(it.productId) || 0) + it.quantity);
    }

    // Validate stock for each product before creating any docs
    for (const [productId, totalQty] of qtyByProduct.entries()) {
      const current = await getCurrentStock(productId);
      if (current < totalQty) {
        return res.status(400).json({
          error: `Insufficient stock for product ${productId}. Current: ${current}, requested: ${totalQty}`,
        });
      }
    }

    const docs = normalized.map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      department,
      issuedBy,
      issuedTo,
      purpose,
      date: date ? new Date(date) : undefined,
    }));

    const created = await StockOut.insertMany(docs, { ordered: true });
    res.status(201).json({ count: created.length, items: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create bulk stock-out records" });
  }
});

// GET /api/stock-out/export  — returns ALL records for Excel download (no pagination)
router.get("/export", async (req, res) => {
  try {
    const { search, department, dateFrom, dateTo } = req.query;
    const match: any = {};

    if (department) {
      match.department = { $regex: department, $options: "i" };
    }

    if (dateFrom || dateTo) {
      match.date = {};
      if (dateFrom) match.date.$gte = new Date(dateFrom as string);
      if (dateTo) match.date.$lte = new Date(dateTo as string);
    }

    const pipeline: any[] = [
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productId",
        },
      },
      { $unwind: "$productId" },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "productId.name": { $regex: search, $options: "i" } },
            { department: { $regex: search, $options: "i" } },
            { issuedBy: { $regex: search, $options: "i" } },
            { issuedTo: { $regex: search, $options: "i" } },
            { purpose: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }

    pipeline.push(
      { $sort: { date: -1 } },
      {
        $project: {
          _id: 1,
          quantity: 1,
          department: 1,
          issuedBy: 1,
          issuedTo: 1,
          purpose: 1,
          date: 1,
          "productId._id": 1,
          "productId.name": 1,
          "productId.unit": 1,
        },
      }
    );

    const records = await StockOut.aggregate(pipeline);
    res.json({ data: records, total: records.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export stock-out records" });
  }
});

router.get("/departments", async (req, res) => {
  try {
    const departments = await StockOut.distinct("department", { department: { $nin: [null, ""] } });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

// PUT /api/stock-out/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, department, issuedBy, issuedTo, purpose, date } = req.body;

    const record = await StockOut.findById(id);
    if (!record) return res.status(404).json({ error: "Record not found" });

    if (quantity !== undefined) {
      const diff = Number(quantity) - record.quantity;
      if (diff > 0) {
        const current = await getCurrentStock(record.productId.toString());
        if (current < diff) {
          return res.status(400).json({
            error: `Insufficient stock for update. Current: ${current}, additional needed: ${diff}`,
          });
        }
      }
      record.quantity = Number(quantity);
    }

    if (department !== undefined) record.department = department;
    if (issuedBy !== undefined) record.issuedBy = issuedBy;
    if (issuedTo !== undefined) record.issuedTo = issuedTo;
    if (purpose !== undefined) record.purpose = purpose;
    if (date !== undefined) record.date = new Date(date);

    await record.save(); // This triggers pre('save') and post('save') hooks for stock update

    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update stock-out record" });
  }
});

// DELETE /api/stock-out/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const record = await StockOut.findById(id);
    if (!record) return res.status(404).json({ error: "Record not found" });

    await StockOut.findOneAndDelete({ _id: id }); // This triggers post('findOneAndDelete') hook

    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete stock-out record" });
  }
});

export default router;
