const mongoose = require("mongoose");
const Document = require("../models/Document");
const { createHttpError } = require("../middleware/errorHandler");

// GET /api/report?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      throw createHttpError(422, "from and to query params (YYYY-MM-DD) are required.", "VALIDATION_ERROR");
    }
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // inclusive end of day

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw createHttpError(422, "from/to must be valid dates.", "VALIDATION_ERROR");
    }

    const match = {
      user: new mongoose.Types.ObjectId(req.session.userId),
      issueDate: { $gte: fromDate, $lte: toDate },
    };

    const [summary] = await Document.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          grandTotal: { $sum: "$totals.grandTotal" },
          totalTax: { $sum: "$totals.totalTax" },
          totalDiscount: { $sum: "$totals.totalDiscount" },
        },
      },
    ]);

    // Per-document breakdown, used to drive the chart on the frontend.
    const documents = await Document.find(match)
      .select("title customer issueDate status totals")
      .sort({ issueDate: 1 });

    res.json({
      range: { from, to },
      summary: summary
        ? {
            count: summary.count,
            grandTotal: Math.round(summary.grandTotal * 100) / 100,
            totalTax: Math.round(summary.totalTax * 100) / 100,
            totalDiscount: Math.round(summary.totalDiscount * 100) / 100,
          }
        : { count: 0, grandTotal: 0, totalTax: 0, totalDiscount: 0 },
      documents,
    });
  } catch (err) {
    next(err);
  }
};
