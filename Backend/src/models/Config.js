import mongoose from "mongoose";
const ConfigSchema = new mongoose.Schema({
  defaultThreshold: { type: Number, default: 5 }
});
export const Config = mongoose.model("Config", ConfigSchema);
