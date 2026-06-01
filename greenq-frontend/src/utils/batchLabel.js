function text(value) {
  return String(value ?? "").trim();
}

export function compactBatchName(batch) {
  const batchName = text(batch?.batchName);
  const zoneName = text(batch?.zoneName);
  if (!batchName || !zoneName) return batchName || "-";
  if (batchName === zoneName) return batchName;
  if (!batchName.startsWith(zoneName)) return batchName;
  return batchName.slice(zoneName.length).replace(/^[\s·\-_/]+/, "").trim() || batchName;
}

export function batchDisplayLabel(batch, { includeCrop = true, includeZone = true } = {}) {
  const parts = [];
  if (includeZone && text(batch?.zoneName)) parts.push(text(batch.zoneName));
  const name = compactBatchName(batch);
  if (name && name !== "-") parts.push(name);
  if (includeCrop && text(batch?.cropName)) parts.push(text(batch.cropName));
  return parts.join(" · ") || "-";
}

export function batchNameWithZone(batch) {
  return batchDisplayLabel(batch, { includeCrop: false, includeZone: true });
}
