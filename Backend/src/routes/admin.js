import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Sale } from "../models/Sale.js";
import { Config } from "../models/Config.js";
import { ReorderRequest } from "../models/ReorderRequest.js";

const router = Router();

router.get("/backup", requireAuth, requireRole("Admin"), async (_req, res) => {
  const [users, products, sales, configs, reorders] = await Promise.all([
    User.find().select("-passwordHash"),
    Product.find(),
    Sale.find(),
    Config.find(),
    ReorderRequest.find()
  ]);
  res.json({ users, products, sales, configs, reorders });
});

export default router;
