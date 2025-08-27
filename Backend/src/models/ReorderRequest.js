import mongoose from "mongoose";

const ReorderRequestSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    status: { type: String, enum: ["Pending","Created","Cancelled"], default: "Pending" },
    qtySuggestion: { type: Number, default: 0 }
  },
  { timestamps: true }
);

ReorderRequestSchema.index({ product: 1, status: 1 });

export const ReorderRequest = mongoose.model("ReorderRequest", ReorderRequestSchema);
