import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, default: "", trim: true },
    barcode: { type: String, unique: true, sparse: true, trim: true },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    reorderThreshold: { type: Number, default: 3 },
    image: { type: String, default: "" },
    tags: [{ type: String }],
    type: { type: String, default: "sneaker" },
    color: { type: String, default: "black" },
    material: { type: String, default: "" },
    rating: { type: Number, default: 4 },
    reviews: { type: Number, default: 0 }
  },
  { timestamps: true }
);

ProductSchema.index({ name: 1, brand: 1 });
ProductSchema.index({ barcode: 1 }, { unique: true, sparse: true });

export const Product = mongoose.model("Product", ProductSchema);
