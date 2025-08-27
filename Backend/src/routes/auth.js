import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: String(email || "").toLowerCase().trim() });
  if (!user || !user.active) return res.status(401).json({ message: "Unauthorized" });

  const ok = await bcrypt.compare(password || "", user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Unauthorized" });

  const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.json({
    token,
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
  });
});

export default router;
