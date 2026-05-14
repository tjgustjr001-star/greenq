import { useState } from "react";
import StatusBadge from "./StatusBadge.jsx";

export default function StatusSelect({
  value,
  options,
  onChange,
  disabled = false,
  label = "상태 변경",
  compact = false,
}) {
  const [open, setOpen] = useState(false);

  if (disabled) {
    return <StatusBadge value={value} />;
  }

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div className={`status-select ${compact ? "compact" : ""}`}>
      <button
        type="button"
        className={`status-select-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={label}
      >
        <StatusBadge value={value} />
      </button>

      {open && (
        <div className="status-select-menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === value ? "selected" : ""}
              onClick={() => handleSelect(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <small>현재</small>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
