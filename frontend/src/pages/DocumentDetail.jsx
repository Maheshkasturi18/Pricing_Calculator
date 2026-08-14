import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiCheckCircle, FiCopy, FiArrowLeft } from "react-icons/fi";
import { api } from "../api/client";
import { formatCurrency as money } from "../utils/formatCurrency";
import { getStatusBadgeClass } from "../utils/statusBadge";

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    try {
      const data = await api.get(`/documents/${id}`);
      setDoc(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleFinalize = async () => {
    if (!confirm("Finalize this document? It will become read-only.")) return;
    setIsSubmitting(true);
    setError("");
    try {
      const updated = await api.post(`/documents/${id}/finalize`);
      setDoc(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleDuplicate = async () => {
  //   setIsSubmitting(true);
  //   setError("");
  //   try {
  //     const copy = await api.post(`/documents/${id}/duplicate`);
  //     navigate(`/documents/${copy._id}/edit`);
  //   } catch (err) {
  //     setError(err.message);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  if (error && !doc)
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-sm text-red-600">
        {error}
      </div>
    );
  if (!doc)
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
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{doc.title}</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>{doc.customer}</span>
            <span>·</span>
            <span>Issued {new Date(doc.issueDate).toLocaleDateString()}</span>
            <span>·</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusBadgeClass(doc.status)}`}
            >
              {doc.status}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {doc.status === "draft" && (
            <>
              <button
                onClick={handleFinalize}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg disabled:opacity-60 transition-colors cursor-pointer"
              >
                <FiCheckCircle size={14} /> Finalize
              </button>
            </>
          )}
          {/* {doc.status === "finalized" && (
            <button
              onClick={handleDuplicate}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium px-3.5 py-2 rounded-lg disabled:opacity-60 transition-colors cursor-pointer"
            >
              <FiCopy size={14} /> Duplicate into new draft
            </button>
          )} */}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Input table */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Document Details
        </h2>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-max w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Line</th>
                <th className="text-left px-4 py-3 font-medium">Qty</th>
                <th className="text-left px-4 py-3 font-medium">Unit price</th>
                <th className="text-left px-4 py-3 font-medium">Discount</th>
                <th className="text-left px-4 py-3 font-medium">Tax</th>
              </tr>
            </thead>
            <tbody>
              {doc.lineItems.map((li) => (
                <tr key={li._id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{li.description}</td>
                  <td className="px-4 py-3">{li.quantity}</td>
                  <td className="px-4 py-3">{money(li.unitPrice)}</td>
                  <td className="px-4 py-3">
                    {li.discountType === "none"
                      ? "—"
                      : li.discountType === "percent"
                        ? `${li.discountValue}%`
                        : `${money(li.discountValue)} fixed`}
                  </td>
                  <td className="px-4 py-3">{li.taxPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-line expected results */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Per-Line Calculation Breakdown
        </h2>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-max w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Line</th>
                <th className="text-left px-4 py-3 font-medium">Subtotal</th>
                <th className="text-left px-4 py-3 font-medium">
                  Discount amount
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  After discount
                </th>
                <th className="text-left px-4 py-3 font-medium">Tax amount</th>
                <th className="text-left px-4 py-3 font-medium">Line total</th>
              </tr>
            </thead>
            <tbody>
              {doc.lineItems.map((li) => {
                const subtotal = li.quantity * li.unitPrice;
                const afterDiscount = subtotal - li.discountAmount;
                return (
                  <tr key={li._id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{li.description}</td>
                    <td className="px-4 py-3">{money(subtotal)}</td>
                    <td className="px-4 py-3">{money(li.discountAmount)}</td>
                    <td className="px-4 py-3">{money(afterDiscount)}</td>
                    <td className="px-4 py-3">{money(li.taxAmount)}</td>
                    <td className="px-4 py-3 font-medium">
                      {money(li.lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document expected totals */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Document Totals Summary
        </h2>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm max-w-3xl overflow-x-auto">
          <table className="min-w-max w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Field</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">How derived</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3">Subtotal</td>
                <td className="px-4 py-3">{money(doc.totals.subtotal)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {doc.lineItems
                    .map((li) => money(li.quantity * li.unitPrice))
                    .join(" + ")}
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3">Total discount</td>
                <td className="px-4 py-3">{money(doc.totals.totalDiscount)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {doc.lineItems
                    .map((li) => money(li.discountAmount))
                    .join(" + ")}
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3">Total tax</td>
                <td className="px-4 py-3">{money(doc.totals.totalTax)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {doc.lineItems.map((li) => money(li.taxAmount)).join(" + ")}
                </td>
              </tr>
              <tr className="border-t border-slate-100 bg-slate-50">
                <td className="px-4 py-3 font-semibold">Grand total</td>
                <td className="px-4 py-3 font-semibold">
                  {money(doc.totals.grandTotal)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {doc.lineItems.map((li) => money(li.lineTotal)).join(" + ")} ({" "}
                  {money(doc.totals.subtotal)} −{" "}
                  {money(doc.totals.totalDiscount)} +{" "}
                  {money(doc.totals.totalTax)} )
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
