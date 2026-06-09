import { canonicalStatusValue, labelOf } from "../data/displayLabels.js";

export default function StatusBadge({ value, label, title, className = "" }) {
  const status = canonicalStatusValue(value || "UNKNOWN");
  const classes = ["status-badge", String(status).toLowerCase(), className].filter(Boolean).join(" ");
  return <span className={classes} title={title}>{label ?? labelOf(status)}</span>;
}
