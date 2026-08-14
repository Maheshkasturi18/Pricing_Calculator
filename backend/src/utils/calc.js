const dectoInt = (amount) => Math.round(Number(amount) * 100);
const IntToDec = (cents) => Math.round(cents) / 100;

function createCalcError(message, field) {
  const err = new Error(message);
  err.name = "CalculationError";
  err.field = field;
  return err;
}

function calculateLine(line, index) {
  const qty = Number(line.quantity);
  const unitPrice = Number(line.unitPrice);
  const discountType = line.discountType || "none";
  const discountValue = Number(line.discountValue || 0);
  const taxPercent = Number(line.taxPercent || 0);

  const where = `line ${index + 1}`;

  if (!Number.isFinite(qty) || qty < 1) {
    throw createCalcError(`${where}: quantity must be a number >= 1`, "quantity");
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw createCalcError(`${where}: unitPrice must be a number >= 0`, "unitPrice");
  }
  if (!["none", "percent", "fixed"].includes(discountType)) {
    throw createCalcError(`${where}: discountType must be none, percent, or fixed`, "discountType");
  }
  if (discountType !== "none" && (!Number.isFinite(discountValue) || discountValue < 0)) {
    throw createCalcError(`${where}: discountValue must be a number >= 0`, "discountValue");
  }
  if (discountType === "percent" && discountValue > 100) {
    throw createCalcError(`${where}: percent discount cannot exceed 100`, "discountValue");
  }
  if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
    throw createCalcError(`${where}: taxPercent must be a number between 0 and 100`, "taxPercent");
  }

  const unitPriceCents = dectoInt(unitPrice);
  const subtotalCents = Math.round(qty) * unitPriceCents;

  let discountCents = 0;
  if (discountType === "percent") {
    discountCents = Math.round((subtotalCents * discountValue) / 100);
  } else if (discountType === "fixed") {
    discountCents = dectoInt(discountValue);
    if (discountCents > subtotalCents) {
      throw createCalcError(
        `${where}: fixed discount ($${IntToDec(discountCents).toFixed(2)}) cannot exceed line subtotal ($${IntToDec(subtotalCents).toFixed(2)})`,
        "discountValue"
      );
    }
  }

  const afterDiscountCents = subtotalCents - discountCents;
  const taxCents = Math.round((afterDiscountCents * taxPercent) / 100);
  const lineTotalCents = afterDiscountCents + taxCents;

  return {
    subtotalCents,
    discountCents,
    afterDiscountCents,
    taxCents,
    lineTotalCents,
    subtotal: IntToDec(subtotalCents),
    discountAmount: IntToDec(discountCents),
    afterDiscount: IntToDec(afterDiscountCents),
    taxAmount: IntToDec(taxCents),
    lineTotal: IntToDec(lineTotalCents),
  };
}


function calculateDocument(lineItems) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw createCalcError("A document must have at least one line item", "lineItems");
  }

  const computedLines = lineItems.map((line, i) => calculateLine(line, i));

  const totals = computedLines.reduce(
    (acc, l) => {
      acc.subtotalCents += l.subtotalCents;
      acc.totalDiscountCents += l.discountCents;
      acc.totalTaxCents += l.taxCents;
      acc.grandTotalCents += l.lineTotalCents;
      return acc;
    },
    { subtotalCents: 0, totalDiscountCents: 0, totalTaxCents: 0, grandTotalCents: 0 }
  );

  return {
    lines: computedLines,
    totals: {
      subtotal: IntToDec(totals.subtotalCents),
      totalDiscount: IntToDec(totals.totalDiscountCents),
      totalTax: IntToDec(totals.totalTaxCents),
      grandTotal: IntToDec(totals.grandTotalCents),
    },
  };
}

module.exports = { calculateLine, calculateDocument, createCalcError, dectoInt, IntToDec };
