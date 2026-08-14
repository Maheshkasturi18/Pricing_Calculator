const dectoInt = (n) => Math.round(Number(n || 0) * 100);
const IntToDec = (c) => Math.round(c) / 100;

// preview line Calc
export function previewLine(line) {
  const qty = Number(line.quantity || 0);
  const unitPriceCents = dectoInt(line.unitPrice);
  const subtotalCents = qty * unitPriceCents;

  let discountCents = 0;

  if (line.discountType === "percent") {
    const percentValue = Math.max(0, Math.min(100, Number(line.discountValue || 0)));
    discountCents = Math.round((subtotalCents * percentValue) / 100);
  } else if (line.discountType === "fixed") {
    const fixedValue = dectoInt(line.discountValue || 0);
    discountCents = Math.min(fixedValue, subtotalCents);
  }

  const afterDiscountCents = Math.max(subtotalCents - discountCents, 0);

  const taxCents = Math.round(
    (afterDiscountCents * Number(line.taxPercent || 0)) / 100,
  );

  const lineTotalCents = afterDiscountCents + taxCents;

  return {
    subtotal: IntToDec(subtotalCents),
    discountAmount: IntToDec(discountCents),
    taxAmount: IntToDec(taxCents),
    lineTotal: IntToDec(lineTotalCents),
  };
}

// subtotal calc
export function previewDocument(lineItems) {
  const lines = lineItems.map(previewLine);
  const totalsCents = lines.reduce(
    (acc, l) => {
      acc.subtotalCents += Math.round(l.subtotal * 100);
      acc.totalDiscountCents += Math.round(l.discountAmount * 100);
      acc.totalTaxCents += Math.round(l.taxAmount * 100);
      acc.grandTotalCents += Math.round(l.lineTotal * 100);
      return acc;
    },
    { subtotalCents: 0, totalDiscountCents: 0, totalTaxCents: 0, grandTotalCents: 0 },
  );

  return {
    subtotal: Math.round(totalsCents.subtotalCents) / 100,
    totalDiscount: Math.round(totalsCents.totalDiscountCents) / 100,
    totalTax: Math.round(totalsCents.totalTaxCents) / 100,
    grandTotal: Math.round(totalsCents.grandTotalCents) / 100,
  };
}
