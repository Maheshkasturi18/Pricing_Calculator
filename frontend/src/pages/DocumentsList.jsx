import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiFileText,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCopy,
} from "react-icons/fi";
import { api } from "../api/client";
import { formatCurrency as money } from "../utils/formatCurrency";
import { getStatusBadgeClass } from "../utils/statusBadge";

function ActionButtons({ doc, onDelete, onDuplicate }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => navigate(`/documents/${doc._id}`)}
        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
        title="View"
      >
        <FiEye size={16} />
      </button>
      {doc.status === "draft" && (
        <>
          <button
            onClick={() => navigate(`/documents/${doc._id}/edit`)}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
            title="Edit"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(doc)}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
            title="Delete"
          >
            <FiTrash2 size={16} />
          </button>
        </>
      )}
      {doc.status === "finalized" && (
        <button
          onClick={() => onDuplicate(doc)}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
          title="Duplicate"
        >
          <FiCopy size={16} />
        </button>
      )}
    </div>
  );
}

export default function DocumentsList() {
  const [docs, setDocs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const path = statusFilter
        ? `/documents?status=${statusFilter}`
        : "/documents";
      const data = await api.get(path);
      setDocs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleDelete = async (doc) => {
    if (!confirm(`Are you sure you want to delete this document.`)) return;
    try {
      await api.del(`/documents/${doc._id}`);
      setDocs((prev) => prev.filter((d) => d._id !== doc._id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDuplicate = async (doc) => {
    try {
      const copy = await api.post(`/documents/${doc._id}/duplicate`);
      setDocs((prev) => [copy, ...prev]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
        <Link
          to="/documents/new"
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg no-underline transition-colors"
        >
          <FiPlus size={16} /> New document
        </Link>
      </div>

      <div className="mb-4">
        <label className="text-sm text-slate-600 flex items-center justify-end gap-2">
          Status:
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="finalized">Finalized</option>
          </select>
        </label>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 text-slate-400 py-16 border border-dashed border-slate-300 rounded-xl">
          <FiFileText size={28} />
          <p className="text-sm">No documents yet. Create your first one.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-max w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Sr No.</th>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Issue date</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Grand total</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, index) => (
                <tr
                  key={d._id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-slate-600">{index + 1}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/documents/${d._id}`}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {d.title}
                    </Link>
                  </td>
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
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    {money(d.totals?.grandTotal)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ActionButtons
                      doc={d}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
