const Document = require("../models/Document");
const { createHttpError } = require("../middleware/errorHandler");
const { calculateDocument } = require("../utils/calc");

function buildComputedPayload(rawLineItems) {
  const { lines, totals } = calculateDocument(rawLineItems);
  const lineItems = rawLineItems.map((raw, i) => ({
    description: raw.description,
    quantity: raw.quantity,
    unitPrice: raw.unitPrice,
    discountType: raw.discountType || "none",
    discountValue: raw.discountValue || 0,
    taxPercent: raw.taxPercent || 0,
    subtotal: lines[i].subtotal,
    discountAmount: lines[i].discountAmount,
    afterDiscount: lines[i].afterDiscount,
    taxAmount: lines[i].taxAmount,
    lineTotal: lines[i].lineTotal,
  }));
  return { lineItems, totals };
}

// GET /api/documents?status=draft|finalized
exports.getAllDocuments = async (req, res, next) => {
  try {
    const filter = { user: req.session.userId };
    if (req.query.status) filter.status = req.query.status;
    const docs = await Document.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    next(err);
  }
};

// GET /api/documents/:id
exports.getDocumentById = async (req, res, next) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      user: req.session.userId,
    });
    if (!doc) throw createHttpError(404, "Document not found.", "NOT_FOUND");
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

// POST /api/documents
exports.createDocument = async (req, res, next) => {
  try {
    const { title, customer, issueDate, lineItems } = req.body;
    if (!title || !customer || !issueDate) {
      throw createHttpError(
        422,
        "title, customer, and issueDate are required.",
        "VALIDATION_ERROR",
      );
    }
    const computed = buildComputedPayload(lineItems || []);

    const doc = await Document.create({
      user: req.session.userId,
      title,
      customer,
      issueDate: new Date(issueDate),
      status: "draft",
      lineItems: computed.lineItems,
      totals: computed.totals,
    });

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

// PUT /api/documents/:id  (draft only)
exports.updateDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      user: req.session.userId,
    });
    if (!doc) throw createHttpError(404, "Document not found.", "NOT_FOUND");
    if (doc.status === "finalized") {
      throw createHttpError(
        409,
        "This document is finalized and read-only. Duplicate it into a new draft to make changes.",
        "DOCUMENT_FINALIZED",
      );
    }

    const { title, customer, issueDate, lineItems } = req.body;
    if (title !== undefined) doc.title = title;
    if (customer !== undefined) doc.customer = customer;
    if (issueDate !== undefined) doc.issueDate = new Date(issueDate);

    if (lineItems !== undefined) {
      const computed = buildComputedPayload(lineItems);
      doc.lineItems = computed.lineItems;
      doc.totals = computed.totals;
    }

    await doc.save();
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/documents/:id  (draft only - finalized records are kept for audit purposes)
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      user: req.session.userId,
    });
    if (!doc) throw createHttpError(404, "Document not found.", "NOT_FOUND");
    if (doc.status === "finalized") {
      throw createHttpError(
        409,
        "Finalized documents cannot be deleted.",
        "DOCUMENT_FINALIZED",
      );
    }
    await doc.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// POST /api/documents/:id/finalize
exports.finalizeDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      user: req.session.userId,
    });
    if (!doc) throw createHttpError(404, "Document not found.", "NOT_FOUND");
    if (doc.status === "finalized") {
      throw createHttpError(
        409,
        "Document is already finalized.",
        "DOCUMENT_FINALIZED",
      );
    }
    if (!doc.lineItems.length) {
      throw createHttpError(
        422,
        "Cannot finalize a document with no line items.",
        "VALIDATION_ERROR",
      );
    }

    for (const [i, li] of doc.lineItems.entries()) {
      if (li.quantity <= 0) {
        throw createHttpError(
          422,
          `Line ${i + 1}: quantity must be greater than 0 to finalize.`,
          "VALIDATION_ERROR",
        );
      }
      if (li.unitPrice < 0) {
        throw createHttpError(
          422,
          `Line ${i + 1}: unit price cannot be negative to finalize.`,
          "VALIDATION_ERROR",
        );
      }
    }

    doc.status = "finalized";
    doc.finalizedAt = new Date();
    await doc.save();
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

// POST /api/documents/:id/duplicate
exports.duplicateDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      user: req.session.userId,
    });
    if (!doc) throw createHttpError(404, "Document not found.", "NOT_FOUND");

    let highestCopyIndex = 0;
    const structuredCopy = await Document.find({ copyOf: doc._id })
      .select("copyIndex")
      .sort({ copyIndex: -1 })
      .limit(1);

    if (structuredCopy.length) {
      highestCopyIndex = structuredCopy[0].copyIndex || 0;
    } else {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
      const baseTitle = doc.title.replace(/\s*\(copy\s*\d*\)\s*$/i, "").trim();
      const escaped = escapeRegex(baseTitle);
      const legacyDocs = await Document.find({
        user: req.session.userId,
        title: {
          $regex: `^${escaped}\\s*\\(copy(?:\\s*\\d+)?\\)\\s*$`,
          $options: "i",
        },
      }).select("title");
      const copyNumbers = legacyDocs.map((d) => {
        const m = d.title.match(/\(copy\s*(\d+)\)/i);
        return m ? parseInt(m[1], 10) : 1;
      });
      highestCopyIndex = copyNumbers.length ? Math.max(...copyNumbers) : 0;
    }

    const nextCopyNumber = highestCopyIndex + 1;

    const copy = await Document.create({
      user: req.session.userId,
      title:
        nextCopyNumber === 1
          ? `${doc.title} (copy)`
          : `${doc.title} (copy ${nextCopyNumber})`,
      customer: doc.customer,
      issueDate: new Date(),
      status: "draft",
      lineItems: doc.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        discountType: li.discountType,
        discountValue: li.discountValue,
        taxPercent: li.taxPercent,
        subtotal: li.subtotal,
        discountAmount: li.discountAmount,
        afterDiscount: li.afterDiscount,
        taxAmount: li.taxAmount,
        lineTotal: li.lineTotal,
      })),
      totals: doc.totals,
      copyOf: doc._id,
      copyIndex: nextCopyNumber,
    });

    res.status(201).json(copy);
  } catch (err) {
    next(err);
  }
};
