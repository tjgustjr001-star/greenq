import { canonicalStatusValue, labelOf } from "../data/displayLabels.js";

export default function StatusBadge({ value }) {
  const status = canonicalStatusValue(value || "UNKNOWN");
  return <span className={`status-badge ${String(status).toLowerCase()}`}>{labelOf(status)}</span>;
}
