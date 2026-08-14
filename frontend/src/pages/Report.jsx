import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FiSearch } from "react-icons/fi";
import { api } from "../api/client";
import { formatCurrency as money } from "../utils/formatCurrency";
import { getStatusBadgeClass } from "../utils/statusBadge";

const inputClass =
  "border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function Report() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const runReport = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api.get(`/report?from=${from}&to=${to}`);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = (data?.documents || []).map((d) => ({
    name: d.title.length > 12 ? d.title.slice(0, 12) + "…" : d.title,
    grandTotal: d.totals.grandTotal,
  }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">
        Summary report
      </h1>

      <form
        onSubmit={runReport}
        className="flex flex-wrap items-end gap-4 mb-6"
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60 transition-colors cursor-pointer"
        >
          <FiSearch size={15} /> {loading ? "Running…" : "Run report"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {data && (
        <>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-5 py-4 min-w-[140px]">
              <div className="text-xs text-slate-500">Total Documents</div>
              <div className="text-xl font-semibold text-slate-900 mt-1">
                {data.summary.count}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-5 py-4 min-w-[140px]">
              <div className="text-xs text-slate-500">Grand total</div>
              <div className="text-xl font-semibold text-slate-900 mt-1">
                {money(data.summary.grandTotal)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-5 py-4 min-w-[140px]">
              <div className="text-xs text-slate-500">Total tax</div>
              <div className="text-xl font-semibold text-slate-900 mt-1">
                {money(data.summary.totalTax)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-5 py-4 min-w-[140px]">
              <div className="text-xs text-slate-500">Total discount</div>
              <div className="text-xl font-semibold text-slate-900 mt-1">
                {money(data.summary.totalDiscount)}
              </div>
            </div>
          </div>

          {/* chart */}
          {chartData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => money(v)} />
                  <Bar
                    dataKey="grandTotal"
                    fill="#4f46e5"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
            <table className="min-w-max w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Sr No.</th>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Issue date
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Grand total
                  </th>
                </tr>
              </thead>
              <tbody>
                {(data.documents || []).map((d, index) => (
                  <tr key={d._id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-600">{index + 1}</td>
                    <td className="px-4 py-3">{d.title}</td>
                    <td className="px-4 py-3 text-slate-700">{d.customer}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(d.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusBadgeClass(d.status)}`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {money(d.totals.grandTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
