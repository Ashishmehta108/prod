import { Router } from "express";
import { StockIn } from "../models/StockIn";
import { StockOut } from "../models/StockOut";
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


// GET /api/stock-in
router.get("/", async (req, res) => {
  try {
    const { search, supplier, location, dateFrom, dateTo } = req.query;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const pipeline: any[] = [];

    // 1. Initial Match (Filters on StockIn fields)
    const match: any = {};
    if (supplier) match.supplier = { $regex: supplier as string, $options: "i" };
    if (location) match.location = { $regex: location as string, $options: "i" };
    if (dateFrom || dateTo) {
      match.date = {};
      if (dateFrom) match.date.$gte = new Date(dateFrom as string);
      if (dateTo) match.date.$lte = new Date(dateTo as string);
      if (!Object.keys(match.date).length) delete match.date;
    }
    if (Object.keys(match).length) pipeline.push({ $match: match });

    // 2. Lookup Product (Required for search by product name)
    pipeline.push(
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" }
    );

    // 3. Search Match (Filters on lookup fields + original fields)
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "product.name": { $regex: search, $options: "i" } },
            { supplier: { $regex: search, $options: "i" } },
            { invoiceNo: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // 4. Facet for Data and Count
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
                supplier: 1,
                invoiceNo: 1,
                location: 1,
                date: 1,
                productId: {
                  _id: "$product._id",
                  name: "$product.name",
                  image: "$product.image",
                },
              },
            },
          ],
          meta: [{ $count: "total" }],
        },
      }
    );

    const results = await StockIn.aggregate(pipeline);
    const result = results[0] || { data: [], meta: [] };
    const records = result.data || [];
    const total = result.meta?.[0]?.total || 0;

    res.json({
      data: records,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("StockIn pagination error:", err);
    res.status(500).json({ error: "Failed to fetch stock-in records" });
  }
});



// GET /api/stock-in/export — returns ALL records for Excel download (no pagination)
router.get("/export", async (req, res) => {
  try {
    const { search, supplier, location, dateFrom, dateTo } = req.query;
    const pipeline: any[] = [];

    const match: any = {};
    if (supplier) match.supplier = { $regex: supplier as string, $options: "i" };
    if (location) match.location = { $regex: location as string, $options: "i" };
    if (dateFrom || dateTo) {
      match.date = {};
      if (dateFrom) match.date.$gte = new Date(dateFrom as string);
      if (dateTo) match.date.$lte = new Date(dateTo as string);
      if (!Object.keys(match.date).length) delete match.date;
    }
    if (Object.keys(match).length) pipeline.push({ $match: match });

    pipeline.push(
      { $lookup: { from: "products", localField: "productId", foreignField: "_id", as: "product" } },
      { $unwind: "$product" }
    );

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "product.name": { $regex: search, $options: "i" } },
            { supplier: { $regex: search, $options: "i" } },
            { invoiceNo: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { date: -1 } },
      {
        $project: {
          _id: 1,
          quantity: 1,
          supplier: 1,
          invoiceNo: 1,
          location: 1,
          date: 1,
          productId: { _id: "$product._id", name: "$product.name", image: "$product.image" },
        },
      }
    );

    const records = await StockIn.aggregate(pipeline);
    res.json({ data: records, total: records.length });
  } catch (err) {
    console.error("StockIn export error:", err);
    res.status(500).json({ error: "Failed to export stock-in records" });
  }
});


// POST /api/stock-in
router.post("/", async (req, res) => {
  try {
    const { productId, quantity, supplier, invoiceNo, location, date } =
      req.body;

    if (!productId || !quantity) {
      return res
        .status(400)
        .json({ error: "productId and quantity are required" });
    }

    const qty = Number(quantity);

    const record = await StockIn.create({
      productId,
      quantity: qty,
      supplier,
      invoiceNo,
      location,
      date: date ? new Date(date) : undefined
    });

    // Note: StockQuantity increment is now handled by StockIn model hooks!

    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create stock-in record" });
  }
});

// PUT /api/stock-in/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, supplier, invoiceNo, location, date } = req.body;

    const record = await StockIn.findById(id);
    if (!record) return res.status(404).json({ error: "Record not found" });

    if (quantity !== undefined) {
      const newQty = Number(quantity);
      const diff = newQty - record.quantity;
      if (diff < 0) {
        const current = await getCurrentStock(record.productId.toString());
        if (current < Math.abs(diff)) {
          return res.status(400).json({
            error: `Insufficient stock for update. Current: ${current}, reduction needed: ${Math.abs(diff)}. Items from this receipt may have already been issued.`
          });
        }
      }
      record.quantity = newQty;
    }

    if (supplier !== undefined) record.supplier = supplier;
    if (invoiceNo !== undefined) record.invoiceNo = invoiceNo;
    if (location !== undefined) record.location = location;
    if (date !== undefined) record.date = new Date(date);

    await record.save(); // This triggers pre('save') and post('save') hooks for stock update

    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update stock-in record" });
  }
});

// DELETE /api/stock-in/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const record = await StockIn.findById(id);
    if (!record) return res.status(404).json({ error: "Record not found" });

    const current = await getCurrentStock(record.productId.toString());
    if (current < record.quantity) {
      return res.status(400).json({
        error: `Cannot delete: current stock (${current}) is less than this receipt quantity (${record.quantity}). Items from this receipt have already been issued.`
      });
    }

    await StockIn.findOneAndDelete({ _id: id }); // This triggers post('findOneAndDelete') hook



    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete stock-in record" });
  }
});


router.get("/frequent", async (req, res) => {
  const { search } = req.query;
  const match: any = { supplier: { $exists: true, $ne: "" } };

  if (search) {
    match.supplier = { $regex: search as string, $options: "i" };
  }

  const result = await StockIn.aggregate([
    { $match: match },
    { $group: { _id: "$supplier", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);

  res.json(result.map(r => r._id));
});


router.get("/locations", async (req, res) => {
  try {
    const locations = await StockIn.distinct("location", { location: { $ne: null } });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});


export default router;


