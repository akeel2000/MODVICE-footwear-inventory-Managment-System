import { ReorderRequest } from "../models/ReorderRequest.js";

export async function ensureReorderIfNeeded(productDoc) {
  const q = Number(productDoc.quantity ?? 0);
  const th = Number(productDoc.reorderThreshold ?? 3);
  if (q > th) return;

  const existing = await ReorderRequest.findOne({ product: productDoc._id, status: "Pending" });
  if (existing) return;

  const qtySuggestion = Math.max(1, (th * 2) - q);
  await ReorderRequest.create({ product: productDoc._id, qtySuggestion });
}
