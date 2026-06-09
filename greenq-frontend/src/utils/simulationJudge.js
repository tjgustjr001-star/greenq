export const SIMULATION_METRICS = ["temperature", "humidity", "ph", "ec"];

export const SIMULATION_METRIC_LABELS = {
  temperature: "온도",
  humidity: "습도",
  ph: "pH",
  ec: "EC",
};

export const SIMULATION_UNITS = {
  temperature: "℃",
  humidity: "%",
  ph: "",
  ec: "",
};

export const SIMULATION_RANGES = {
  temperature: { min: 18, max: 24, failRate: 10 },
  humidity: { min: 60, max: 75, failRate: 12 },
  ph: { min: 5.8, max: 6.5, failRate: 8 },
  ec: { min: 1.2, max: 1.8, failRate: 12 },
};

export const SIMULATION_DEFAULT_METRICS = {
  temperature: 22,
  humidity: 68,
  ph: 6.1,
  ec: 1.5,
  co2: 850,
  lightIntensity: 15000,
  waterTemp: 20,
  vpd: 0.9,
};

export function severityRank(status) {
  if (status === "FAIL") return 3;
  if (status === "CAUTION") return 2;
  if (status === "MISSING") return 1;
  return 0;
}

export function formatMetricValue(value, digit = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  if (Number.isInteger(number)) return String(number);
  return number.toFixed(digit).replace(/\.0$/, "");
}

export function judgeMetric(metric, value) {
  const range = SIMULATION_RANGES[metric];
  const number = Number(value);
  if (!range || !Number.isFinite(number)) {
    return { status: "MISSING", deviationRate: null };
  }

  if (number >= range.min && number <= range.max) {
    return { status: "NORMAL", deviationRate: 0 };
  }

  const base = number < range.min ? range.min : range.max;
  const deviation = Math.abs(number - base);
  const deviationRate = base === 0 ? 0 : (deviation / Math.abs(base)) * 100;
  return {
    status: deviationRate >= range.failRate ? "FAIL" : "CAUTION",
    deviationRate,
  };
}

export function judgeSimulationMetrics(metrics) {
  const items = Object.fromEntries(
    SIMULATION_METRICS.map((metric) => [metric, judgeMetric(metric, metrics?.[metric])])
  );
  const status = Object.values(items).reduce(
    (current, item) => (severityRank(item.status) > severityRank(current) ? item.status : current),
    "NORMAL"
  );
  return { status, items };
}

export function normalizeToRangeCenter(metrics = {}) {
  return {
    ...metrics,
    temperature: 21.8,
    humidity: 68,
    ph: 6.15,
    ec: 1.5,
  };
}
