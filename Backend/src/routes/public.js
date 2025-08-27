import { Router } from "express";
import { Product } from "../models/Product.js";

const router = Router();

router.get("/products", async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 64), 200);
  const items = await Product.find().sort({ createdAt: -1 }).limit(limit);
  res.json(items);
});

export default router;
