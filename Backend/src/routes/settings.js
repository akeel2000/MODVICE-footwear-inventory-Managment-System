import { Router } from "express";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { Config } from "../models/Config.js";
import { User } from "../models/User.js";

const router = Router();

// Default threshold (Admin-only)
router.get("/threshold", requireAuth, async (_req, res) => {
  const cfg = await Config.findOne();
  res.json({ defaultThreshold: cfg?.defaultThreshold ?? 5 });
});

router.put("/threshold", requireAuth, requireRole("Admin"), async (req, res) => {
  const n = Number(req.body?.defaultThreshold ?? 5);
  const cfg = (await Config.findOne()) || (await Config.create({ defaultThreshold: n }));
  cfg.defaultThreshold = n;
  await cfg.save();
  res.json({ ok: true });
});

// Update profile (self)
router.put("/profile", requireAuth, async (req, res) => {
  const { fullName, password } = req.body || {};
  const doc = await User.findById(req.user.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  if (fullName) doc.fullName = fullName;
  if (password) doc.passwordHash = await bcrypt.hash(password, 10);
  await doc.save();
  res.json({ ok: true });
});

// JSON backup
router.get("/backup", requireAuth, requireRole("Admin"), async (_req, res) => {
  res.json({ message: "Use /api/admin/backup for full backup" });
});

export default router;
