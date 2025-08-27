import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const dir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dir),
  filename: (_req, file, cb) => {
    const safe = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safe);
  }
});
const upload = multer({ storage });

// POST /api/uploads/image
router.post("/image", upload.single("image"), (req, res) => {
  res.json({ url: `/uploads/${req.file.filename}` });
});

// POST /api/uploads/images
router.post("/images", upload.array("images", 6), (req, res) => {
  res.json({ urls: req.files.map(f => `/uploads/${f.filename}`) });
});

export default router;
