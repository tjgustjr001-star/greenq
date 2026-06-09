export function formatNumber(value, maxDigits = 2) {
  if (value === null || value === undefined || value === "") return "-";

  const text = String(value).trim();
  if (!text) return "-";

  const number = Number(text);
  if (!Number.isFinite(number)) return text;
  if (Number.isInteger(number)) return String(number);

  const digits = Math.max(0, Math.min(Number(maxDigits) || 0, 20));
  return number.toFixed(digits).replace(/\.?0+$/, "");
}

export function formatNumberText(value, maxDigits = 2) {
  if (value === null || value === undefined || value === "") return "-";

  return String(value).replace(
    /[-+]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][-+]?\d+)?/g,
    (token) => formatNumber(token, maxDigits)
  );
}

export function formatRange(min, max, maxDigits = 2) {
  const hasMin = min !== null && min !== undefined && min !== "";
  const hasMax = max !== null && max !== undefined && max !== "";

  if (!hasMin && !hasMax) return "-";
  if (!hasMin) return `~ ${formatNumber(max, maxDigits)}`;
  if (!hasMax) return `${formatNumber(min, maxDigits)} ~`;
  return `${formatNumber(min, maxDigits)} ~ ${formatNumber(max, maxDigits)}`;
}
