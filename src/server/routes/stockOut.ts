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
