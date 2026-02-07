import { Router } from "express";
import { Category } from "../models/Category";

const router = Router();

// GET /api/categories
router.get("/", async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        console.error("Fetch categories error:", err);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});

// POST /api/categories
router.post("/", async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: "Category name is required" });

        const category = await Category.create({ name, description });
        res.status(201).json(category);
    } catch (err: any) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "Category already exists" });
        }
        console.error("Create category error:", err);
        res.status(500).json({ error: "Failed to create category" });
    }
});

// PUT /api/categories/:id
router.put("/:id", async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description, isActive },
            { new: true }
        );
        if (!category) return res.status(404).json({ error: "Category not found" });
        res.json(category);
    } catch (err) {
        console.error("Update category error:", err);
        res.status(500).json({ error: "Failed to update category" });
    }
});

// DELETE /api/categories/:id
router.delete("/:id", async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ error: "Category not found" });
        res.json({ message: "Category deleted successfully" });
    } catch (err) {
        console.error("Delete category error:", err);
        res.status(500).json({ error: "Failed to delete category" });
    }
});

export default router;
