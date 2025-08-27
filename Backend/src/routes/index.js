import { Router } from 'express';
import auth from './auth.js';
import users from './users.js';
import products from './products.js';
import sales from './sales.js';
import publicRoutes from './public.js';
import settings from './settings.js';
import dashboard from './dashboard.js';
import admin from './admin.js';
import exportRoutes from './export.js';
import uploads from './uploads.js';

const router = Router();
router.get('/health', (_req, res) => res.json({ ok: true }));

router.use('/auth', auth);
router.use('/users', users);
router.use('/products', products);
router.use('/sales', sales);
router.use('/public', publicRoutes);
router.use('/settings', settings);
router.use('/dashboard', dashboard);
router.use('/admin', admin);
router.use('/export', exportRoutes);
router.use('/uploads', uploads);

export default router;
