export default function SimulationMetricSparkline({ values = [], min = 0, max = 1, label }) {
  const width = 120;
  const height = 34;
  const padding = 4;
  const numericValues = values.map(Number).filter(Number.isFinite);

  if (numericValues.length === 0) {
    return <div className="simulation-sparkline-empty">-</div>;
  }

  const valueMin = Math.min(min, ...numericValues);
  const valueMax = Math.max(max, ...numericValues);
  const range = valueMax - valueMin || 1;
  const points = numericValues.map((value, index) => {
    const x = numericValues.length === 1 ? width / 2 : padding + (index / (numericValues.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - valueMin) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="simulation-sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label} 변화 추이`}>
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
      <polyline points={points} />
    </svg>
  );
}
