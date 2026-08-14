import { FiTrash2 } from "react-icons/fi";

const inputClass =
  "w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

export default function LineItemRow({ line, index, onChange, onRemove }) {
  const set = (field, value) => onChange(index, { ...line, [field]: value });
  
  // Calculate subtotal
  const subtotal = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);

  // Handle discount value change with validation
  const handleDiscountChange = (value) => {
    let numValue = Number(value);
    
    // Clamp percent discount to 0-100%
    if (line.discountType === "percent") {
      if (numValue < 0) numValue = 0;
      if (numValue > 100) numValue = 100;
    }
    
    // Clamp fixed discount to 0-subtotal
    if (line.discountType === "fixed") {
      if (numValue < 0) numValue = 0;
      if (numValue > subtotal) numValue = subtotal;
    }
    
    set("discountValue", numValue);
  };

  return (
    <tr className="border-t border-slate-100">
      <td className="px-3 py-2">
        <input
          value={line.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Description"
          required
          className={inputClass}
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min="1"
          step="1"
          value={line.quantity}
          onChange={(e) => set("quantity", e.target.value)}
          className={`${inputClass} w-20`}
          required
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={line.unitPrice}
          onChange={(e) => set("unitPrice", e.target.value)}
          className={`${inputClass} w-24`}
          required
        />
      </td>
      <td className="px-3 py-2 text-slate-700 text-sm">
        ₹{subtotal.toFixed(2)}
      </td>
      <td className="px-3 py-2">
        <select
          value={line.discountType}
          onChange={(e) => set("discountType", e.target.value)}
          className={inputClass}
        >
          <option value="none">No discount</option>
          <option value="percent">% off</option>
          <option value="fixed">Fixed ₹</option>
        </select>
      </td>
      <td className="px-3 py-2">
        {line.discountType !== "none" && (
          <input
            type="number"
            min="0"
            max={line.discountType === "percent" ? 100 : subtotal}
            step="0.01"
            value={line.discountValue}
            onChange={(e) => handleDiscountChange(e.target.value)}
            className={`${inputClass} w-24`}
            title={
              line.discountType === "percent"
                ? "Max 100%"
                : `Max ₹${subtotal.toFixed(2)}`
            }
          />
        )}
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={line.taxPercent}
          onChange={(e) => set("taxPercent", e.target.value)}
          className={`${inputClass} w-20`}
        />
      </td>
      <td className="px-3 py-2">
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label="Remove line"
          className="bg-transparent p-1 text-red-400 hover:text-red-600 cursor-pointer"
        >
          <FiTrash2 size={15} />
        </button>
      </td>
    </tr>
  );
}
