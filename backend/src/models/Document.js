const mongoose = require("mongoose");

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    discountType: {
      type: String,
      enum: ["none", "percent", "fixed"],
      default: "none",
    },
    discountValue: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    subtotal: Number,
    discountAmount: Number,
    afterDiscount: Number,
    taxAmount: Number,
    lineTotal: Number,
  },
  { _id: true },
);

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    customer: { type: String, required: true, trim: true },
    issueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "finalized"],
      default: "draft",
      index: true,
    },
    lineItems: { type: [lineItemSchema], validate: (v) => v.length > 0 },

    totals: {
      subtotal: { type: Number, default: 0 },
      totalDiscount: { type: Number, default: 0 },
      totalTax: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
    },

    // copy metadata for efficient duplication tracking
    copyOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
      index: true,
    },
    copyIndex: { type: Number, default: 0 },

    finalizedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Compound index used by the summary report (per-user, date-range scan)
documentSchema.index({ user: 1, issueDate: 1 });

module.exports = mongoose.model("Document", documentSchema);
