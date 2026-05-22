import { labelOf } from "../data/displayLabels.js";

export default function StatCard({ label, value, hint, tone = "default" }) {
  const displayValue = typeof value === "string" ? labelOf(value) : value;

  return (
    <div className={`stat-card ${tone}`}>
      <p>{label}</p>
      <strong>{displayValue}</strong>
      {hint && <span>{hint}</span>}
    </div>
  );
}
