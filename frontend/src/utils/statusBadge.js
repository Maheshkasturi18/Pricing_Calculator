export const getStatusBadgeClass = (status) =>
  status === "finalized"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-amber-100 text-amber-800";
