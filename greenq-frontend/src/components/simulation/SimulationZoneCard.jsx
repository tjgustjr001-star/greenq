import StatusBadge from "../StatusBadge.jsx";
import SimulationMetricSparkline from "./SimulationMetricSparkline.jsx";
import {
  formatMetricValue,
  SIMULATION_METRIC_LABELS,
  SIMULATION_METRICS,
  SIMULATION_RANGES,
  SIMULATION_UNITS,
} from "../../utils/simulationJudge.js";

export default function SimulationZoneCard({ target, onSave, saving }) {
  const plantStatus = String(target.status || "MISSING").toLowerCase();

  return (
    <article className={`simulation-zone-card ${plantStatus}`}>
      <div className="simulation-zone-head">
        <div>
          <h3>{target.zoneName}</h3>
          <p>{target.batchName} / {target.cropName}</p>
        </div>
        <StatusBadge value={target.status} />
      </div>

      <div className="simulation-plant-wrap">
        <div className={`simulation-plant ${plantStatus}`}>
          <span className="simulation-leaf simulation-leaf-left" />
          <span className="simulation-leaf simulation-leaf-right" />
          <span className="simulation-leaf simulation-leaf-front" />
          <span className="simulation-stem" />
          <span className="simulation-pot" />
        </div>
      </div>

      <div className="simulation-metric-grid">
        {SIMULATION_METRICS.map((metric) => (
          <div key={metric} className={`simulation-metric ${target.itemStatuses?.[metric]?.toLowerCase() || "normal"}`}>
            <span>{SIMULATION_METRIC_LABELS[metric]}</span>
            <strong>{formatMetricValue(target.metrics[metric])}{SIMULATION_UNITS[metric]}</strong>
            <SimulationMetricSparkline
              label={SIMULATION_METRIC_LABELS[metric]}
              values={target.history?.[metric] || []}
              min={SIMULATION_RANGES[metric].min}
              max={SIMULATION_RANGES[metric].max}
            />
          </div>
        ))}
      </div>

      <button type="button" className="secondary-button simulation-card-save" onClick={() => onSave(target)} disabled={!target.batchId || saving}>
        {saving ? "저장 중" : "현재 상태 저장"}
      </button>
    </article>
  );
}
