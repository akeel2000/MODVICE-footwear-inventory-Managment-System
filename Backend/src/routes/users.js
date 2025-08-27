import { Router } from "express";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { User } from "../models/User.js";
import { userCreateRules, userUpdateRules } from "../validators/userValidators.js";

const router = Router();

router.get("/", requireAuth, requireRole("Admin","Manager"), async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).select("-passwordHash");
  res.json(users);
});

router.post("/", requireAuth, requireRole("Admin","Manager"), userCreateRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { fullName, email, password, role } = req.body;
  const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (exists) return res.status(409).json({ message: "Email already exists" });
  const passwordHash = await bcrypt.hash(password, 10);
  const doc = await User.create({ fullName, email, passwordHash, role });
  res.status(201).json({ id: doc._id });
});

router.put("/:id", requireAuth, requireRole("Admin","Manager"), userUpdateRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const body = { ...req.body };
  if (body.password) {
    body.passwordHash = await bcrypt.hash(body.password, 10);
    delete body.password;
  }
  const doc = await User.findByIdAndUpdate(req.params.id, body, { new: true }).select("-passwordHash");
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(doc);
});

router.delete("/:id", requireAuth, requireRole("Admin"), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
