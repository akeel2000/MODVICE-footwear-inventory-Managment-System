# MODVICE — MERN Inventory & Sales (Footwear)

> Modern MERN stack app for product inventory, barcode-based sales entry, reports, low-stock alerts, public catalog, and role-based access (Admin / Manager / Staff / Cashier).

![Node](https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-React_19-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## ✨ Features

- **Role-based auth** (JWT): Admin, Manager, Staff, Cashier  
- **Products**: CRUD, sizes, price, stock, threshold, tags, image upload  
- **Barcode**: Camera scanner (ZXing) + hardware HID support + EAN-13 generator  
- **Sales**: Sale / Return / Restock (stock auto-adjust), history with filters & delete+revert  
- **Dashboard**: Totals, trend, low-stock alerts  
- **Reports**: CSV & PDF (products, users, sales with date range)  
- **Public site**: One-page product catalog (filter/sort/cart UI)  
- **Backup**: Download full JSON backup (admin)  
- **Accessibility**: Keyboard focus, ARIA tabs in Sales

---

## 🧭 Monorepo Structure

```
MODVICE/
├─ frontend/                 # Vite + React 19 + Tailwind v4
│  ├─ src/
│  │  ├─ modules/
│  │  │  ├─ auth/           # AuthContext, Login, ProtectedRoute
│  │  │  ├─ dashboard/
│  │  │  ├─ layout/
│  │  │  ├─ products/       # ProductForm, ProductsPage
│  │  │  ├─ sales/          # SalesEntry, SalesHistory, SalesPage
│  │  │  ├─ reports/
│  │  │  ├─ settings/
│  │  │  ├─ public/         # OnePageSite & cards
│  │  │  └─ shared/         # Card, barcode utils/components
│  │  ├─ services/api.js    # Axios client & endpoints
│  │  ├─ App.jsx
│  │  └─ main.jsx
│  ├─ index.html
│  └─ vite.config.js
│
├─ backend/                  # Express + Mongoose + JWT
│  ├─ src/
│  │  ├─ server.js
│  │  ├─ db.js
│  │  ├─ middleware/        # auth, error handlers
│  │  ├─ models/            # User, Product, Sale, Config
│  │  ├─ routes/            # auth, products, sales, users, settings, uploads, public, dashboard
│  │  └─ utils/             # seedAdminAndConfig, helpers
│  ├─ uploads/              # served statically (gitignored)
│  └─ package.json
│
└─ README.md                 # This file
```

---

## ✅ Prerequisites

- **Node.js 18+** (works on 22.x as well)  
- **MongoDB Atlas** (or local MongoDB; Atlas recommended)  
- **Git**

---

## ⚙️ Environment

### Backend — `backend/.env`
```ini
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@modvice.<cluster-id>.mongodb.net/modvice?retryWrites=true&w=majority&appName=modvice
JWT_SECRET=change-me
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
```

> 🔐 Replace `<user>`/`<password>` with your Atlas DB user.  
> ✅ Allow your IP in Atlas Network Access (0.0.0.0/0 for dev).

### Frontend — `frontend/.env` (optional)
```ini
# If omitted, the Vite proxy in vite.config.js sends /api → http://localhost:5000
VITE_API_URL=http://localhost:5000
```

---

## 🚀 Quick Start (Dev)

**1) Backend**
```bash
cd backend
npm install
npm run dev
# First boot auto-seeds:
#   Admin: admin@modvice.com / admin123
#   Config: defaultThreshold=5
```

**2) Frontend**
```bash
cd ../frontend
npm install
npm run dev
# open http://localhost:5173
```

**Login**
```
admin@modvice.com / admin123
```

---

## 🔌 API Overview (prefix `/api`)

**Auth**
- `POST /auth/login` → `{ token, user }`

**Health & Dashboard**
- `GET /health` → `"ok"`
- `GET /dashboard` → `{ totalProducts, totalStock, lowStock }`

**Public**
- `GET /public/products?limit=64`

**Products**
- `GET /products` (auth)
- `GET /products/:id`
- `GET /products/barcode/:code`
- `POST /products` (Admin)
- `PUT /products/:id` (Admin)
- `DELETE /products/:id` (Admin)
- `GET /products/low-stock` (auth)
- `POST /products/:id/ack` (Admin; optional)

**Sales**
- `GET /sales?from=YYYY-MM-DD&to=YYYY-MM-DD&type=Sale|Return|Restock&q=...`
- `GET /sales/:id`
- `GET /sales/product/:productId`
- `POST /sales` → `{ productId, type, qty, unitPrice }`  
  _Type: **Sale** (decrease), **Return** (increase negative amount), **Restock** (increase)_
- `DELETE /sales/:id?revert=1` (Admin; optionally revert stock)

**Users** (Admin)
- `GET /users`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

**Settings** (Admin)
- `PUT /settings/profile` → `{ fullName?, password? }`
- `GET /settings/threshold`
- `PUT /settings/threshold` → `{ defaultThreshold }`
- `GET /settings/backup` (alias: `/admin/backup`) → full JSON export

**Uploads**
- `POST /uploads/image` (multipart) → `{ url }`
- `POST /uploads/images` (multiple) → `{ urls }`
- Static: `/uploads/<filename>`

---

## 👤 Roles & Access

- **Admin**: Full access (users, settings, export, CRUD)  
- **Manager**: CRUD products/sales, view reports (customize as needed)  
- **Staff/Cashier**: Sales entry, read products, view history; no users/settings

_Enforced via backend middleware + UI guards._

---

## 🖼️ Images & Files

- Uploaded images live in `backend/uploads` and are served at `/uploads/...`.  
- Ensure the folder exists and is writable.

---

## 🧪 Scripts

**Backend (`backend/package.json`)**
```json
{
  "dev": "nodemon src/server.js",
  "start": "node src/server.js"
}
```

**Frontend (`frontend/package.json`)**
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

---

## 🛠️ Troubleshooting

- **Mongo `bad auth : authentication failed`**  
  Check `MONGODB_URI` credentials and Atlas IP allow-list.

- **`ECONNREFUSED 127.0.0.1:27017`**  
  You're pointing to local MongoDB. Use Atlas URI or run local Mongo.

- **`Cannot find package 'helmet'`**  
  Install backend deps:
  ```bash
  cd backend
  npm i express cors helmet morgan dotenv mongoose jsonwebtoken bcryptjs multer
  ```

- **CORS blocked**  
  Set `CORS_ORIGIN=http://localhost:5173` and restart backend.

- **Vite plugin not found**  
  Ensure `@vitejs/plugin-react-swc` is installed; then `npm install` again.

---

## 📦 Production Notes

- **Frontend**: `cd frontend && npm run build` → deploy `dist/` (Netlify / Vercel / static host).  
- **Backend**: `cd backend && npm start` (consider `pm2`), set env vars on the server.  
- **Serve SPA from Express** (optional): copy `frontend/dist` → `backend/public` and `app.use(express.static('public'))` with a catch-all route.

---

## 🧾 License

MIT © MODVICE

---

### Default Admin (seeded on first run)

```
Email:    admin@modvice.com
Password: admin123
```

> Change the password in **Settings → New Password** after first login.

---

### .gitignore (recommended)

```
node_modules/
dist/
frontend/dist/
backend/uploads/
.env
frontend/.env
backend/.env
.vscode/
.DS_Store
Thumbs.db
```
