// models/Upload.js

const mongoose = require("mongoose");

const UploadSchema = new mongoose.Schema({
  // Use a custom string ID for user-facing upload IDs (e.g., u_123)
  uploadId: { type: String, required: true, unique: true },

  createdAt: { type: Date, default: Date.now, expires: "1d" }, // Data can expire quickly

  // Store metadata
  country: { type: String, trim: true },
  erp: { type: String, trim: true },
  sourceFormat: { type: String, enum: ["csv", "json"], required: true },

  // The first 200 rows of parsed data for analysis
  data: { type: mongoose.Schema.Types.Mixed, required: true },

  rowsParsed: { type: Number, required: true },
});

const Upload = mongoose.model("Upload", UploadSchema);
module.exports = Upload;
