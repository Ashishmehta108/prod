import { Router } from "express";
import { StockIn } from "../models/StockIn";

const router = Router();

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

    const record = await StockIn.create({
      productId,
      quantity: Number(quantity),
      supplier,
      invoiceNo,
      location,
      date: date ? new Date(date) : undefined
    });

    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create stock-in record" });
  }
});



router.get("/frequent", async (req, res) => {
  const result = await StockIn.aggregate([
    { $match: { supplier: { $exists: true, $ne: "" } } },
    { $group: { _id: "$supplier", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
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


