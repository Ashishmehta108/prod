import { Router } from "express";
import { Product } from "../models/Product";
import { StockIn } from "../models/StockIn";
import { StockOut } from "../models/StockOut";
import mongoose from "mongoose";
import { auth, adminOnly } from "../middleware/auth";
import { uploadSingleImage } from "../middleware/upload";
import * as QRCodeController from "../controller/qrcode.controller";


const router = Router();


router.get("/categories", auth, async (req, res) => {
  try {
    // Redundant but kept for backward compatibility if needed by other components
    const categories = await Product.distinct("category");
    res.json(categories.filter(Boolean).sort());
  } catch (err) {
    console.error("Failed to fetch categories:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// GET /api/products/low-stock/export - returns ALL low/out-of-stock products (no pagination cap) for Excel export
router.get("/low-stock/export", auth, async (req, res) => {
  try {
    const pipeline: any[] = [
      // Only include products with a real minimum threshold and strictly below it
      { $match: { $expr: { $and: [{ $gt: ["$minStock", 0] }, { $lt: ["$stockQuantity", "$minStock"] }] } } },
      { $sort: { stockQuantity: 1 } },
      {
        $project: {
          id: "$_id",
          name: 1,
          category: 1,
          unit: 1,
          image: 1,
          refIds: 1,
          machineName: 1,
          minStock: 1,
          currentStock: "$stockQuantity",
        },
      },
    ];
    const data = await Product.aggregate(pipeline);
    res.json({ data, total: data.length });
  } catch (err) {
    console.error("Low stock export error:", err);
    res.status(500).json({ error: "Failed to export low stock products" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const isPaginated = !!(req.query.page || req.query.limit);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = isPaginated
      ? Math.min(Number(req.query.limit) || 10, 50)
      : 1000; // Large limit for non-paginated calls
    const skip = (page - 1) * limit;
    const {
      search,
      category,
      unit,
      machineName,
      refIdPrefix,
      minStockOnly,
      inStock,
      outOfStock,
      createdFrom,
      createdTo,
    } = req.query;
    const baseMatch: any = {};

    if (category) baseMatch.category = category as string;
    if (unit) baseMatch.unit = unit as string;
    if (machineName) baseMatch.machineName = machineName as string;

    if (createdFrom || createdTo) {
      baseMatch.createdAt = {};
      if (createdFrom) baseMatch.createdAt.$gte = new Date(createdFrom as string);
      if (createdTo) baseMatch.createdAt.$lte = new Date(createdTo as string);
    }


    if (search) {
      const regex = new RegExp(search as string, "i");

      baseMatch.$or = [
        { name: regex },
        { category: regex },
        { machineName: regex },
        {
          refIds: {
            $elemMatch: {
              $regex: `^${search}`,
              $options: "i",
            },
          },
        },
      ];
    }
    if (refIdPrefix) {
      baseMatch.refIds = {
        $elemMatch: {
          $regex: `^${refIdPrefix}`,
          $options: "i",
        },
      };
    }

    const pipeline: any[] = [
      { $match: baseMatch },
    ];

    const stockMatch: any = {};

    if (minStockOnly === "true") {
      // Only include products that have a real minimum threshold (minStock > 0)
      // AND whose stock is strictly below that threshold
      stockMatch.$expr = {
        $and: [
          { $gt: ["$minStock", 0] },
          { $lt: ["$stockQuantity", "$minStock"] },
        ],
      };
    }

    if (inStock === "true") {
      stockMatch.stockQuantity = { $gt: 0 };
    }

    if (outOfStock === "true") {
      stockMatch.stockQuantity = { $lte: 0 };
    }

    if (Object.keys(stockMatch).length) {
      pipeline.push({ $match: stockMatch });
    }

    pipeline.push(
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                id: "$_id",
                name: 1,
                category: 1,
                unit: 1,
                image: 1,
                refIds: 1,
                machineName: 1,
                minStock: 1,
                currentStock: "$stockQuantity",
              },
            },
          ],
          meta: [{ $count: "total" }],
        },
      }
    );

    const [result] = await Product.aggregate(pipeline);

    const total = result?.meta[0]?.total || 0;
    const finalData = result?.data || [];

    // Backward compatibility: If no pagination requested, return array directly
    if (!req.query.page && !req.query.limit) {
      return res.json(finalData);
    }

    res.json({
      data: finalData,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Advanced product fetch error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});



router.post("/", auth, adminOnly, uploadSingleImage, async (req: any, res) => {
  try {
    const { name, category, unit, minStock, refIds, machineName } = req.body;
    let image = req.body.image;

    if (req.file) {
      image = `/upload/images/${req.file.filename}`;
    }

    if (!name || !unit) {
      return res.status(400).json({ error: "name and unit are required fields" });
    }

    // Handle refIds if they come as a string (from FormData)
    let processedRefIds = refIds;
    if (typeof refIds === 'string') {
      try {
        processedRefIds = JSON.parse(refIds);
      } catch (e) {
        processedRefIds = refIds.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }

    const product = await Product.create({
      name,
      category,
      unit,
      minStock: Number(minStock) || 0,
      image,
      refIds: processedRefIds || [],
      machineName,
    });

    res.status(201).json(product);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// GET /api/products/export — returns ALL products with applied filters, no pagination, for Excel download
router.get("/export", auth, async (req, res) => {
  try {
    const {
      search, category, unit, machineName, refIdPrefix,
      minStockOnly, inStock, outOfStock, createdFrom, createdTo,
    } = req.query;

    const baseMatch: any = {};
    if (category) baseMatch.category = category as string;
    if (unit) baseMatch.unit = unit as string;
    if (machineName) baseMatch.machineName = machineName as string;
    if (createdFrom || createdTo) {
      baseMatch.createdAt = {};
      if (createdFrom) baseMatch.createdAt.$gte = new Date(createdFrom as string);
      if (createdTo) baseMatch.createdAt.$lte = new Date(createdTo as string);
    }
    if (search) {
      const regex = new RegExp(search as string, "i");
      baseMatch.$or = [
        { name: regex }, { category: regex }, { machineName: regex },
        { refIds: { $elemMatch: { $regex: `^${search}`, $options: "i" } } },
      ];
    }
    if (refIdPrefix) {
      baseMatch.refIds = { $elemMatch: { $regex: `^${refIdPrefix}`, $options: "i" } };
    }

    const pipeline: any[] = [{ $match: baseMatch }];
    const stockMatch: any = {};
    if (minStockOnly === "true") stockMatch.$expr = {
      $and: [
        { $gt: ["$minStock", 0] },
        { $lt: ["$stockQuantity", "$minStock"] },
      ],
    };
    if (inStock === "true") stockMatch.stockQuantity = { $gt: 0 };
    if (outOfStock === "true") stockMatch.stockQuantity = { $lte: 0 };
    if (Object.keys(stockMatch).length) pipeline.push({ $match: stockMatch });

    pipeline.push(
      { $sort: { createdAt: -1 } },
      {
        $project: {
          id: "$_id", name: 1, category: 1, unit: 1, image: 1,
          refIds: 1, machineName: 1, minStock: 1, currentStock: "$stockQuantity",
        },
      }
    );

    const data = await Product.aggregate(pipeline);
    res.json({ data, total: data.length });
  } catch (err) {
    console.error("Products export error:", err);
    res.status(500).json({ error: "Failed to export products" });
  }
});

router.get("/search", auth, async (req, res) => {
  try {
    const { q } = req.query;
    const searchTerm = (q as string)?.trim() || "";

    if (!searchTerm) {
      return res.json([]);
    }

    // Case-insensitive search on name and category
    const products = await Product.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: searchTerm, $options: "i" } },
      ],
    })
      .lean()
      .limit(50);

    const result = products.map((p) => ({
      id: p._id,
      name: p.name,
      category: p.category,
      unit: p.unit,
      minStock: p.minStock,
      currentStock: p.stockQuantity,
      image: p.image,
      machineName: p.machineName,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search products" });
  }

});

router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).json({ error: "Product not found" });

    const [totalIn, totalOut] = await Promise.all([
      StockIn.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: null, total: { $sum: "$quantity" } } }
      ]),
      StockOut.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: null, total: { $sum: "$quantity" } } }
      ])
    ]);

    res.json({
      id: product._id,
      name: product.name,
      category: product.category,
      unit: product.unit,
      minStock: product.minStock,
      image: product.image,
      refIds: product.refIds || [],
      machineName: product.machineName,
      currentStock: product.stockQuantity,
      totalIn: totalIn[0]?.total || 0,
      totalOut: totalOut[0]?.total || 0
    });

  } catch (e) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});



router.get("/:id/stock-in", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 10,
      supplier,
      location,
      invoiceNo,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
      search
    } = req.query;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Validate pagination parameters
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit))); // Cap at 100

    // Build match query
    const match: any = {
      productId: new mongoose.Types.ObjectId(id),
    };

    if (supplier) match.supplier = supplier as string;
    if (location) match.location = location as string;
    if (invoiceNo) match.invoiceNo = invoiceNo as string;

    // Date range filtering
    if (startDate || endDate) {
      match.date = {};
      if (startDate) {
        match.date.$gte = new Date(startDate as any);
      }
      if (endDate) {
        const end = new Date(endDate as any);
        end.setHours(23, 59, 59, 999);
        match.date.$lte = end;
      }
    }

    // Search functionality (searches across multiple fields)
    if (search) {
      match.$or = [
        { invoiceNo: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortOptions: any = {};
    const validSortFields = ['date', 'quantity', 'supplier', 'invoiceNo', 'location'];
    const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'date';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      StockIn.find(match)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      StockIn.countDocuments(match),
    ]);

    res.json({
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      },
    });
  } catch (err) {
    console.error('Error fetching stock-in:', err);
    res.status(500).json({
      error: "Failed to fetch stock-in records",
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

router.get("/:id/stock-out-raw", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const items = await StockOut.find({
      productId: new mongoose.Types.ObjectId(id)
    }).limit(10).lean();

    res.json({
      total: items.length,
      sampleData: items,
      uniqueIssuedTo: [...new Set(items.map(i => i.issuedTo))],
      uniqueIssuedBy: [...new Set(items.map(i => i.issuedBy))],
      uniqueDepartments: [...new Set(items.map(i => i.department))],
      uniquePurposes: [...new Set(items.map(i => i.purpose))]
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});
router.get("/:id/stock-out", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 10,
      department,
      issuedBy,
      issuedTo,
      purpose,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
      search
    } = req.query;
    const sample = await StockOut.findOne().lean();
    console.log('sample StockOut doc:', sample);


    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Validate pagination parameters
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    // Build match query
    const match: any = {
      productId: new mongoose.Types.ObjectId(id),
    };

    // Use regex for case-insensitive matching on filters
    if (department) {
      match.department = { $regex: new RegExp(`^${(department as string).trim()}$`, 'i') };
    }
    if (issuedBy) {
      match.issuedBy = { $regex: new RegExp(`^${(issuedBy as string).trim()}$`, 'i') };
    }
    if (issuedTo) {
      match.issuedTo = { $regex: new RegExp(`^${(issuedTo as string).trim()}$`, 'i') };
    }
    if (purpose) {
      match.purpose = { $regex: new RegExp(`^${(purpose as string).trim()}$`, 'i') };
    }

    // Date range filtering
    if (startDate || endDate) {
      match.date = {};
      if (startDate) {
        match.date.$gte = new Date(startDate as any);
      }
      if (endDate) {
        const end = new Date(endDate as any);
        end.setHours(23, 59, 59, 999);
        match.date.$lte = end;
      }
    }

    // Search functionality
    if (search) {
      match.$or = [
        { department: { $regex: search, $options: 'i' } },
        { issuedBy: { $regex: search, $options: 'i' } },
        { issuedTo: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortOptions: any = {};
    const validSortFields = ['date', 'quantity', 'department', 'issuedBy', 'issuedTo', 'purpose'];
    const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'date';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

    const skip = (pageNum - 1) * limitNum;

    console.log('Match query:', match);
    console.log('Sort options:', sortOptions);

    const [items, total] = await Promise.all([
      StockOut.find(match)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      StockOut.countDocuments(match),
    ]);

    console.log('Found items:', items.length);

    res.json({
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      },
    });
  } catch (err) {
    console.error('Error fetching stock-out:', err);
    res.status(500).json({
      error: "Failed to fetch stock-out records",
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});



router.put("/:id", auth, adminOnly, uploadSingleImage, async (req: any, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const { name, category, unit, minStock, refIds, machineName, currentStock } = req.body;
    let image = req.body.image;

    if (req.file) {
      image = `/upload/images/${req.file.filename}`;
    }

    // Handle refIds if they come as a string
    let processedRefIds = refIds;
    if (typeof refIds === 'string') {
      try {
        processedRefIds = JSON.parse(refIds);
      } catch (e) {
        processedRefIds = refIds.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      {
        name,
        category,
        unit,
        minStock: Number(minStock) || 0,
        image,
        refIds: processedRefIds,
        machineName,
      },
      { new: true }
    );


    if (!updated) return res.status(404).json({ error: "Product not found" });
    const parsedCurrentStock =
      currentStock !== undefined ? Number(currentStock) : undefined;


    if (!isNaN(parsedCurrentStock!)) {
      const currentRealStock = updated.stockQuantity;
      const diff = parsedCurrentStock! - currentRealStock;

      if (diff !== 0) {
        if (diff > 0) {
          await StockIn.create({
            productId: id,
            quantity: diff,
            date: new Date(),
            location: "Stock Adjustment",
          });
        } else {
          await StockOut.create({
            productId: id,
            quantity: Math.abs(diff),
            date: new Date(),
            purpose: "Stock Adjustment",
          });
        }
      }
    }

    // Fetch final updated doc to get the new stockQuantity if adjusted
    const finalDoc = await Product.findById(id);
    res.json(finalDoc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Check if there are any stock records for this product
    const inCount = await StockIn.countDocuments({ productId: id });
    const outCount = await StockOut.countDocuments({ productId: id });

    if (inCount > 0 || outCount > 0) {
      return res.status(400).json({
        error: "Cannot delete product with existing stock history. Please delete stock records first.",
      });
    }

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// GENERATE QR CODE FOR PRODUCT
router.get("/:id/qr", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).json({ error: "Product not found" });

    return QRCodeController.generateProductQRCode(req, res, product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

export default router;

