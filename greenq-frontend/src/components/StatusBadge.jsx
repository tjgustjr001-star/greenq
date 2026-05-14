import { labelOf } from "../data/displayLabels.js";

export default function StatusBadge({ value }) {
  const status = value || "UNKNOWN";
  return <span className={`status-badge ${String(status).toLowerCase()}`}>{labelOf(status)}</span>;
}
