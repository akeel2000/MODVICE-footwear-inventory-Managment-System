import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Product } from "../models/Product.js";
import { Sale } from "../models/Sale.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const [prodCount, lowCount] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ $expr: { $lte: ["$quantity", "$reorderThreshold"] } })
  ]);
  const salesToday = await Sale.aggregate([
    { $match: { date: new Date().toISOString().slice(0,10) } },
    { $group: { _id: null, total: { $sum: "$amount" }, qty: { $sum: "$qty" } } }
  ]);
  res.json({
    products: prodCount,
    lowStock: lowCount,
    salesToday: salesToday[0]?.total ?? 0,
    qtyToday: salesToday[0]?.qty ?? 0
  });
});

export default router;
