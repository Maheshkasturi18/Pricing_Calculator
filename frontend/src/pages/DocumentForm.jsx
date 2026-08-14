import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiPlus, FiArrowLeft } from "react-icons/fi";
import { api } from "../api/client";
import LineItemRow from "../components/LineItemRow";
import { previewDocument } from "../utils/previewCalc";
import { formatCurrency as money } from "../utils/formatCurrency";

const emptyLine = () => ({
  description: "",
  quantity: 1,
  unitPrice: "",
  discountType: "none",
  discountValue: 0,
  taxPercent: 0,
});

const inputClass =
  "border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

export default function DocumentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [customer, setCustomer] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [lineItems, setLineItems] = useState([emptyLine()]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const doc = await api.get(`/documents/${id}`);
        if (doc.status === "finalized") {
          navigate(`/documents/${id}`);
          return;
        }
        setTitle(doc.title);
        setCustomer(doc.customer);
        setIssueDate(new Date(doc.issueDate).toISOString().slice(0, 10));
        setLineItems(
          doc.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            discountType: li.discountType,
            discountValue: li.discountValue,
            taxPercent: li.taxPercent,
          })),
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, navigate]);

  const updateLine = (index, updated) => {
    setLineItems((prev) => prev.map((l, i) => (i === index ? updated : l)));
  };

  const removeLine = (index) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addLine = () => setLineItems((prev) => [...prev, emptyLine()]);

  const totals = previewDocument(
    lineItems.map((l) => ({
      ...l,
      quantity: Number(l.quantity) || 0,
      unitPrice: Number(l.unitPrice) || 0,
    })),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        title,
        customer,
        issueDate,
        lineItems: lineItems.map((l) => ({
          ...l,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          discountValue: Number(l.discountValue || 0),
          taxPercent: Number(l.taxPercent || 0),
        })),
      };

      const doc = isEdit
        ? await api.put(`/documents/${id}`, payload)
        : await api.post("/documents", payload);

      navigate(`/documents/${doc._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-slate-500">Loading…</div>
    );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 text-sm font-medium mb-4 cursor-pointer"
      >
        <FiArrowLeft size={16} /> Back to Documents
      </button>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">
        {isEdit ? "Edit document" : "New document"}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Customer
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              required
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Issue date
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
              className={inputClass}
            />
          </label>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
          <table className="min-w-max w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <th className="text-left px-3 py-3 font-medium">Description</th>
                <th className="text-left px-3 py-3 font-medium">Qty</th>
                <th className="text-left px-3 py-3 font-medium">Unit price</th>
                <th className="text-left px-3 py-3 font-medium">Subtotal</th>
                <th className="text-left px-3 py-3 font-medium">Discount</th>
                <th className="text-left px-3 py-3 font-medium">
                  Discount value
                </th>
                <th className="text-left px-3 py-3 font-medium">Tax %</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((line, i) => (
                <LineItemRow
                  key={i}
                  line={line}
                  index={i}
                  onChange={updateLine}
                  onRemove={removeLine}
                />
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addLine}
          className="self-end flex items-center justify-end cursor-pointer gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
        >
          <FiPlus size={15} /> Add line
        </button>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 max-w-xs">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Live preview
          </h3>
          <div className="flex flex-col gap-1.5 text-sm text-slate-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total discount</span>
              <span>{money(totals.totalDiscount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total tax</span>
              <span>{money(totals.totalTax)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-900 text-base pt-2 mt-1 border-t border-slate-100">
              <span>Grand total</span>
              <span>{money(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 cursor-pointer rounded-lg text-sm disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create document"}
          </button>
        </div>
      </form>
    </div>
  );
}
