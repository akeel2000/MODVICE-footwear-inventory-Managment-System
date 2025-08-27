import axios from "axios";

/** Prefer Vite (VITE_API_URL), fallback CRA (REACT_APP_API_URL), else '/api' */
const rawEnv =
  (import.meta?.env?.VITE_API_URL ??
    (typeof process !== "undefined" ? process.env?.REACT_APP_API_URL : "")) || "";

const RAW = (typeof rawEnv === "string" ? rawEnv : "").trim();
const TRIMMED = RAW.replace(/\/+$/, "");
const BASE_URL = TRIMMED ? (/\/api$/i.test(TRIMMED) ? TRIMMED : `${TRIMMED}/api`) : "/api";

// Useful for making absolute asset URLs when BE hosts static uploads
export const API_ROOT = BASE_URL.replace(/\/api$/i, "");

export const assetUrl = (u) => {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const path = u.startsWith("/") ? u : `/${u}`;
  return API_ROOT ? `${API_ROOT}${path}` : path;
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (email, password) => api.post("/auth/login", { email, password });

// Health
export const health = () => api.get("/health");

// Dashboard
export const getDashboard = () => api.get("/dashboard");

// Products
export const listProducts = (params = {}) => api.get("/products", { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const getByBarcode = (code) => api.get(`/products/barcode/${encodeURIComponent(code)}`);
export const createProduct = (body) => api.post("/products", body);
export const updateProduct = (id, body) => api.put(`/products/${id}`, body);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const lowStock = () => api.get("/products/low-stock");
export const ackAlert = (id) => api.post(`/products/${id}/ack`);

// Sales
export const listSales = (params = {}) => api.get("/sales", { params });
export const getSale = (id) => api.get(`/sales/${id}`);
export const listSalesByProduct = (productId) => api.get(`/sales/product/${productId}`);
export const createSale = (body) => api.post("/sales", body);
export const deleteSale = (id, { revert = false } = {}) =>
  api.delete(`/sales/${id}`, { params: { revert: revert ? 1 : 0 } });

// Users
export const listUsers = () => api.get("/users");
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (body) => api.post(`/users`, body);
export const updateUser = (id, body) => api.put(`/users/${id}`, body);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Reports
export const listReports = (params = {}) => api.get("/reports", { params });

// Public
export const listPublicProducts = (limit = 64) => api.get("/public/products", { params: { limit } });

// Uploads
export const uploadImage = (file) => {
  const fd = new FormData();
  fd.append("image", file);
  return api.post("/uploads/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
};
export const uploadImages = (files = []) => {
  const fd = new FormData();
  files.forEach((f) => fd.append("images", f));
  return api.post("/uploads/images", fd, { headers: { "Content-Type": "multipart/form-data" } });
};

// Settings
export const updateProfile = (body) => api.put("/settings/profile", body);
export const updateThreshold = (defaultThreshold) => api.put("/settings/threshold", { defaultThreshold });
export const getThresholdDefault = () => api.get("/settings/threshold");

// Backup
export const getBackup = async () => {
  try {
    return await api.get("/settings/backup");
  } catch (err) {
    if (err?.response?.status === 404) return api.get("/admin/backup");
    throw err;
  }
};

export default api;
