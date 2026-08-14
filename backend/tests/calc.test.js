const {
  calculateDocument,
  calculateLine,
  createCalcError,
} = require("../src/utils/calc");

describe("calculateDocument - assignment worked example", () => {
  const lineItems = [
    {
      line: "Widget A",
      quantity: 2,
      unitPrice: 100.0,
      discountType: "percent",
      discountValue: 10,
      taxPercent: 5,
    },
    {
      line: "Widget B",
      quantity: 1,
      unitPrice: 50.0,
      discountType: "none",
      discountValue: 0,
      taxPercent: 5,
    },
    {
      line: "Service fee",
      quantity: 1,
      unitPrice: 200.0,
      discountType: "fixed",
      discountValue: 20,
      taxPercent: 0,
    },
  ];

  const result = calculateDocument(lineItems);

  test("Widget A line total is 189.00", () => {
    expect(result.lines[0].subtotal).toBe(200.0);
    expect(result.lines[0].discountAmount).toBe(20.0);
    expect(result.lines[0].taxAmount).toBe(9.0);
    expect(result.lines[0].lineTotal).toBe(189.0);
  });

  test("Widget B line total is 52.50", () => {
    expect(result.lines[1].lineTotal).toBe(52.5);
  });

  test("Service fee line total is 180.00", () => {
    expect(result.lines[2].discountAmount).toBe(20.0);
    expect(result.lines[2].lineTotal).toBe(180.0);
  });

  test("document totals match the brief exactly", () => {
    expect(result.totals.subtotal).toBe(450.0);
    expect(result.totals.totalDiscount).toBe(40.0);
    expect(result.totals.totalTax).toBe(11.5);
    expect(result.totals.grandTotal).toBe(421.5);
  });
});

describe("calculateLine - validation rules", () => {
  test("rejects quantity < 1", () => {
    expect(() => calculateLine({ quantity: 0, unitPrice: 10 }, 0)).toThrow(
      /quantity must be a number >= 1/,
    );
  });

  test("rejects negative unit price", () => {
    expect(() => calculateLine({ quantity: 1, unitPrice: -5 }, 0)).toThrow(
      /unitPrice must be a number >= 0/,
    );
  });

  test("rejects percent discount over 100", () => {
    expect(() =>
      calculateLine(
        {
          quantity: 1,
          unitPrice: 10,
          discountType: "percent",
          discountValue: 150,
        },
        0,
      ),
    ).toThrow(/percent discount cannot exceed 100/);
  });

  test("rejects fixed discount greater than line subtotal", () => {
    expect(() =>
      calculateLine(
        {
          quantity: 1,
          unitPrice: 10,
          discountType: "fixed",
          discountValue: 50,
        },
        0,
      ),
    ).toThrow(/cannot exceed line subtotal/);
  });

  test("rejects tax percent outside 0-100", () => {
    expect(() =>
      calculateLine({ quantity: 1, unitPrice: 10, taxPercent: 150 }, 0),
    ).toThrow(/taxPercent must be a number between 0 and 100/);
  });

  test("floating point stress case stays exact to the cent", () => {
    const line = calculateLine(
      {
        quantity: 3,
        unitPrice: 19.99,
        discountType: "percent",
        discountValue: 15,
        taxPercent: 8.25,
      },
      0,
    );
    expect(Number.isInteger(Math.round(line.lineTotal * 100))).toBe(true);
  });
});

describe("calculateDocument - structural validation", () => {
  test("rejects empty line item array", () => {
    expect(() => calculateDocument([])).toThrow(
      /must have at least one line item/,
    );
  });
});
