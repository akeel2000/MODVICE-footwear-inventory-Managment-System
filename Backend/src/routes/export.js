import { Router } from 'express';
const router = Router();
const EMPTY_PDF = Buffer.from('%PDF-1.4\n%âãÏÓ\n', 'binary');

router.get('/products.pdf', (_req, res) => { res.type('pdf').send(EMPTY_PDF); });
router.get('/sales.pdf', (_req, res) => { res.type('pdf').send(EMPTY_PDF); });
router.get('/users.pdf', (_req, res) => { res.type('pdf').send(EMPTY_PDF); });

export default router;
