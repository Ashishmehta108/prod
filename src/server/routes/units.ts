import { Router } from "express";
import { Unit } from "../models/Unit";
import { auth, adminOnly } from "../middleware/auth";

const router = Router();

// GET /api/units
router.get("/", auth, async (_req, res) => {
  try {
    const units = await Unit.find({ isActive: true }).sort({ name: 1 }).lean();
    res.json(units);
  } catch (err) {
    console.error("Fetch units error:", err);
    res.status(500).json({ error: "Failed to fetch units" });
  }
});

// POST /api/units
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { name, description } = req.body;
    const trimmed = String(name || "").trim();
    if (!trimmed) return res.status(400).json({ error: "Name is required" });

    const existing = await Unit.findOne({ name: new RegExp(`^${trimmed}$`, "i") });
    if (existing) return res.status(400).json({ error: "Unit already exists" });

    const created = await Unit.create({
      name: trimmed,
      description: description ? String(description) : "",
      isActive: true,
    });
    res.status(201).json(created);
  } catch (err) {
    console.error("Create unit error:", err);
    res.status(500).json({ error: "Failed to create unit" });
  }
});

// PUT /api/units/:id
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const trimmed = String(name || "").trim();
    if (!trimmed) return res.status(400).json({ error: "Name is required" });

    const existing = await Unit.findOne({ _id: { $ne: id }, name: new RegExp(`^${trimmed}$`, "i") });
    if (existing) return res.status(400).json({ error: "Unit name already in use" });

    const updated = await Unit.findByIdAndUpdate(
      id,
      { name: trimmed, description: description ? String(description) : "" },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Unit not found" });
    res.json(updated);
  } catch (err) {
    console.error("Update unit error:", err);
    res.status(500).json({ error: "Failed to update unit" });
  }
});

// DELETE /api/units/:id
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Unit.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Unit not found" });
    res.json({ message: "Unit deleted successfully" });
  } catch (err) {
    console.error("Delete unit error:", err);
    res.status(500).json({ error: "Failed to delete unit" });
  }
});

export default router;

