import mongoose from "mongoose";

const SaleSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },           // YYYY-MM-DD
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: String,
    brand: String,
    barcode: String,
    type: { type: String, enum: ["Sale","Return","Restock"], required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true },         // computed
    image: String
  },
  { timestamps: true }
);

export const Sale = mongoose.model("Sale", SaleSchema);
