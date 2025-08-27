import { Router } from "express";
import { validationResult } from "express-validator";
import { Product } from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { productCreateRules, productUpdateRules } from "../validators/productValidators.js";
import { ensureReorderIfNeeded } from "../utils/reorder.js";

const router = Router();

// GET /api/products
router.get("/", requireAuth, async (req, res) => {
  const { page = 1, limit = 50, sort = "createdAt" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const items = await Product.find().sort(sort).skip(skip).limit(Number(limit));
  res.json(items);
});

// GET /api/products/low-stock
router.get("/low-stock", requireAuth, async (req, res) => {
  const items = await Product.find({ $expr: { $lte: ["$quantity", "$reorderThreshold"] } }).limit(200);
  res.json(items);
});

// GET /api/products/:id
router.get("/:id", requireAuth, async (req, res) => {
  const doc = await Product.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(doc);
});

// GET /api/products/barcode/:code
router.get("/barcode/:code", requireAuth, async (req, res) => {
  const code = String(req.params.code || "").trim();
  const doc = await Product.findOne({ barcode: code });
  if (!doc) return res.status(404).json({ message: "Barcode not recognized" });
  res.json(doc);
});

// POST /api/products
router.post("/", requireAuth, requireRole("Admin","Manager"), productCreateRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const created = await Product.create(req.body);
    await ensureReorderIfNeeded(created);
    res.status(201).json(created);
  } catch (e) {
    if (e?.code === 11000 && e?.keyPattern?.barcode) {
      return res.status(409).json({ message: "Barcode already exists" });
    }
    throw e;
  }
});

// PUT /api/products/:id
router.put("/:id", requireAuth, requireRole("Admin","Manager"), productUpdateRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Not found" });
    await ensureReorderIfNeeded(updated);
    res.json(updated);
  } catch (e) {
    if (e?.code === 11000 && e?.keyPattern?.barcode) {
      return res.status(409).json({ message: "Barcode already exists" });
    }
    throw e;
  }
});

// DELETE /api/products/:id
router.delete("/:id", requireAuth, requireRole("Admin"), async (req, res) => {
  const doc = await Product.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
});

// POST /api/products/:id/ack (low-stock acknowledgement stub)
router.post("/:id/ack", requireAuth, requireRole("Admin","Manager"), async (req, res) => {
  res.json({ ok: true });
});

export default router;
