import { Router } from "express";
import { validationResult } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { saleCreateRules } from "../validators/saleValidators.js";
import { Product } from "../models/Product.js";
import { Sale } from "../models/Sale.js";
import { ensureReorderIfNeeded } from "../utils/reorder.js";

const router = Router();

// GET /api/sales  (filters: from,to,type,q)
router.get("/", requireAuth, async (req, res) => {
  const { from, to, type, q } = req.query;
  const find = {};
  if (type) find.type = type;
  if (from || to) {
    find.date = {};
    if (from) find.date.$gte = String(from);
    if (to) find.date.$lte = String(to);
  }
  if (q) {
    find.$or = [
      { productName: { $regex: q, $options: "i" } },
      { brand: { $regex: q, $options: "i" } },
      { barcode: { $regex: q, $options: "i" } }
    ];
  }
  const rows = await Sale.find(find).sort({ createdAt: -1 }).limit(1000);
  res.json(rows);
});

// POST /api/sales
router.post("/", requireAuth, saleCreateRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { productId, type, qty, unitPrice } = req.body;
  const p = await Product.findById(productId);
  if (!p) return res.status(404).json({ message: "Product not found" });

  const qNum = Number(qty);
  const price = Number(unitPrice);
  let delta = 0;
  if (type === "Sale") delta = -qNum;
  if (type === "Return") delta = +qNum;
  if (type === "Restock") delta = +qNum;

  // stock check
  if (type === "Sale" && p.quantity + delta < 0) {
    return res.status(400).json({ message: "Insufficient stock" });
  }

  p.quantity += delta;
  await p.save();

  const amount = (type === "Sale" ? +1 : type === "Return" ? -1 : +1) * (qNum * price);

  const today = new Date();
  const dateStr = today.toISOString().slice(0,10);

  const row = await Sale.create({
    date: dateStr,
    product: p._id,
    productName: p.name,
    brand: p.brand,
    barcode: p.barcode,
    type,
    qty: qNum,
    unitPrice: price,
    amount,
    image: p.image || ""
  });

  await ensureReorderIfNeeded(p);
  res.status(201).json({ ok: true, product: p, sale: row });
});

// DELETE /api/sales/:id?revert=1
router.delete("/:id", requireAuth, requireRole("Admin","Manager"), async (req, res) => {
  const { revert } = req.query;
  const row = await Sale.findById(req.params.id);
  if (!row) return res.status(404).json({ message: "Not found" });

  if (String(revert) === "1") {
    const p = await Product.findById(row.product);
    if (p) {
      // revert the stock change made earlier
      if (row.type === "Sale") p.quantity += row.qty;
      if (row.type === "Return") p.quantity -= row.qty;
      if (row.type === "Restock") p.quantity -= row.qty;
      await p.save();
      await ensureReorderIfNeeded(p);
    }
  }

  await row.deleteOne();
  res.json({ ok: true });
});

export default router;
