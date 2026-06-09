import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { greenqApi } from "../../api/greenqApi.js";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import SimulationControlPanel from "../../components/simulation/SimulationControlPanel.jsx";
import SimulationLogPanel from "../../components/simulation/SimulationLogPanel.jsx";
import SimulationStage from "../../components/simulation/SimulationStage.jsx";
import { asArray } from "../../hooks/useApiData.js";
import {
  judgeSimulationMetrics,
  normalizeToRangeCenter,
  severityRank,
  SIMULATION_DEFAULT_METRICS,
  SIMULATION_METRIC_LABELS,
  SIMULATION_METRICS,
  SIMULATION_RANGES,
} from "../../utils/simulationJudge.js";

function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatLocalDateTime(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 19);
}

function formatLogTime(date = new Date()) {
  return date.toTimeString().slice(0, 5);
}

function createHistory(metrics) {
  return Object.fromEntries(SIMULATION_METRICS.map((metric) => [metric, [metrics[metric]]]));
}

function appendHistory(history, metrics) {
  return Object.fromEntries(
    SIMULATION_METRICS.map((metric) => [metric, [...(history?.[metric] || []), metrics[metric]].slice(-20)])
  );
}

function latestLogByBatch(logs) {
  const map = new Map();
  asArray(logs).forEach((log) => {
    if (!log.batchId) return;
    const current = map.get(String(log.batchId));
    const time = new Date(log.measuredAt).getTime();
    const currentTime = current ? new Date(current.measuredAt).getTime() : -Infinity;
    if (Number.isFinite(time) && time >= currentTime) {
      map.set(String(log.batchId), log);
    }
  });
  return map;
}

function buildTargets(zones, batches, logs) {
  const zoneMap = new Map(asArray(zones).map((zone) => [String(zone.zoneId), zone]));
  const latestMap = latestLogByBatch(logs);

  return asArray(batches)
    .filter((batch) => String(batch.batchStatus || "").toUpperCase() === "GROWING")
    .map((batch, index) => {
      const latest = latestMap.get(String(batch.batchId));
      const zone = zoneMap.get(String(batch.zoneId));
      const metrics = {
        ...SIMULATION_DEFAULT_METRICS,
        temperature: numberOrDefault(latest?.temperature, SIMULATION_DEFAULT_METRICS.temperature),
        humidity: numberOrDefault(latest?.humidity, SIMULATION_DEFAULT_METRICS.humidity),
        ph: numberOrDefault(latest?.ph, SIMULATION_DEFAULT_METRICS.ph),
        ec: numberOrDefault(latest?.ec, SIMULATION_DEFAULT_METRICS.ec),
        co2: numberOrDefault(latest?.co2, SIMULATION_DEFAULT_METRICS.co2),
        lightIntensity: numberOrDefault(latest?.lightIntensity, SIMULATION_DEFAULT_METRICS.lightIntensity),
        waterTemp: numberOrDefault(latest?.waterTemp, SIMULATION_DEFAULT_METRICS.waterTemp),
        vpd: numberOrDefault(latest?.vpd, SIMULATION_DEFAULT_METRICS.vpd),
      };
      const judged = judgeSimulationMetrics(metrics);

      return {
        id: String(batch.batchId || `batch-${index}`),
        batchId: batch.batchId,
        zoneName: batch.zoneName || zone?.zoneName || `구역 ${index + 1}`,
        batchName: batch.batchName || "배치 미지정",
        cropName: batch.cropName || "작물 미지정",
        initialMetrics: metrics,
        metrics,
        history: createHistory(metrics),
        status: judged.status,
        itemStatuses: Object.fromEntries(Object.entries(judged.items).map(([metric, result]) => [metric, result.status])),
      };
    });
}

function varyMetrics(metrics) {
  const next = { ...metrics };
  next.temperature = Number((next.temperature + (Math.random() - 0.48) * 0.7).toFixed(1));
  next.humidity = Number((next.humidity + (Math.random() - 0.5) * 1.8).toFixed(1));
  next.ph = Number((next.ph + (Math.random() - 0.5) * 0.08).toFixed(2));
  next.ec = Number((next.ec + (Math.random() - 0.5) * 0.08).toFixed(2));
  next.co2 = Math.round(next.co2 + (Math.random() - 0.5) * 35);
  next.lightIntensity = Math.round(next.lightIntensity + (Math.random() - 0.5) * 500);
  next.waterTemp = Number((next.waterTemp + (Math.random() - 0.5) * 0.4).toFixed(1));
  next.vpd = Number((next.vpd + (Math.random() - 0.5) * 0.04).toFixed(2));
  return next;
}

function applyJudgement(target, metrics) {
  const judged = judgeSimulationMetrics(metrics);
  return {
    ...target,
    metrics,
    history: appendHistory(target.history, metrics),
    status: judged.status,
    itemStatuses: Object.fromEntries(Object.entries(judged.items).map(([metric, result]) => [metric, result.status])),
  };
}

function abnormalMetrics(metrics) {
  const metric = SIMULATION_METRICS[Math.floor(Math.random() * SIMULATION_METRICS.length)];
  const range = SIMULATION_RANGES[metric];
  const direction = Math.random() > 0.5 ? 1 : -1;
  const next = { ...metrics };
  const gap = metric === "ph" || metric === "ec" ? 0.35 : metric === "humidity" ? 12 : 5;
  next[metric] = Number((direction > 0 ? range.max + gap : range.min - gap).toFixed(metric === "ph" || metric === "ec" ? 2 : 1));
  return { metric, metrics: next };
}

export default function SimulationPage() {
  const [targets, setTargets] = useState([]);
  const [initialTargets, setInitialTargets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [savingTargetId, setSavingTargetId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const logIdRef = useRef(1);

  const appendLogs = useCallback((entries) => {
    const list = Array.isArray(entries) ? entries : [entries];
    const stamped = list.map((entry) => ({ id: logIdRef.current++, time: formatLogTime(), ...entry }));
    setLogs((prev) => [...stamped, ...prev].slice(0, 20));
  }, []);

  const loadSimulationData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [zones, batches, environmentLogs] = await Promise.all([
        greenqApi.zones(),
        greenqApi.batches(),
        greenqApi.environmentLogs({ hours: 24 }),
      ]);
      const nextTargets = buildTargets(zones, batches, environmentLogs);
      setTargets(nextTargets);
      setInitialTargets(nextTargets.map((target) => ({ ...target, metrics: { ...target.metrics }, initialMetrics: { ...target.initialMetrics }, history: createHistory(target.metrics) })));
    } catch (err) {
      setError(err?.message || "시뮬레이션 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSimulationData();
  }, [loadSimulationData]);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      const eventEntries = [];
      setTargets((prev) => prev.map((target) => {
        const next = applyJudgement(target, varyMetrics(target.metrics));
        SIMULATION_METRICS.forEach((metric) => {
          const before = target.itemStatuses?.[metric] || "NORMAL";
          const after = next.itemStatuses?.[metric] || "NORMAL";
          if (severityRank(after) >= severityRank("CAUTION") && after !== before) {
            eventEntries.push({
              zoneName: target.zoneName,
              itemName: SIMULATION_METRIC_LABELS[metric],
              status: after,
              message: `${SIMULATION_METRIC_LABELS[metric]} ${after === "FAIL" ? "경고" : "주의"} 발생: ${next.metrics[metric]}로 기준 범위를 벗어났습니다.`,
            });
          }
        });
        return next;
      }));
      if (eventEntries.length) appendLogs(eventEntries);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [appendLogs, running]);

  const counts = useMemo(() => targets.reduce((acc, target) => {
    acc[target.status] = (acc[target.status] || 0) + 1;
    return acc;
  }, {}), [targets]);

  const start = () => {
    setRunning(true);
    appendLogs({ zoneName: "전체", itemName: "시뮬레이션", status: "NORMAL", message: "환경 시뮬레이션이 시작되었습니다." });
  };

  const stop = () => {
    setRunning(false);
    appendLogs({ zoneName: "전체", itemName: "시뮬레이션", status: "NORMAL", message: "환경 시뮬레이션이 정지되었습니다." });
  };

  const reset = () => {
    setRunning(false);
    setTargets(initialTargets.map((target) => ({ ...target, metrics: { ...target.initialMetrics }, history: createHistory(target.initialMetrics) })));
    appendLogs({ zoneName: "전체", itemName: "초기화", status: "NORMAL", message: "최초 환경값으로 초기화되었습니다." });
  };

  const randomAbnormal = () => {
    if (!targets.length) return;
    const count = Math.max(1, Math.ceil(Math.random() * Math.min(2, targets.length)));
    const picked = new Set();
    while (picked.size < count) picked.add(Math.floor(Math.random() * targets.length));
    const eventEntries = [];
    setTargets((prev) => prev.map((target, index) => {
      if (!picked.has(index)) return target;
      const abnormal = abnormalMetrics(target.metrics);
      const next = applyJudgement(target, abnormal.metrics);
      eventEntries.push({
        zoneName: target.zoneName,
        itemName: SIMULATION_METRIC_LABELS[abnormal.metric],
        status: next.itemStatuses[abnormal.metric],
        message: `${SIMULATION_METRIC_LABELS[abnormal.metric]} 이상이 발생했습니다. 현재값 ${next.metrics[abnormal.metric]}`,
      });
      return next;
    }));
    appendLogs(eventEntries);
  };

  const normalizeAll = () => {
    setTargets((prev) => prev.map((target) => applyJudgement(target, normalizeToRangeCenter(target.metrics))));
    appendLogs({ zoneName: "전체", itemName: "정상화", status: "NORMAL", message: "전체 구역 정상화가 실행되었습니다." });
  };

  const saveTarget = async (target) => {
    if (!target?.batchId) return;
    setSavingTargetId(target.id);
    try {
      await greenqApi.createEnvironmentLog({
        batchId: target.batchId,
        measuredAt: formatLocalDateTime(),
        temperature: target.metrics.temperature,
        humidity: target.metrics.humidity,
        co2: target.metrics.co2,
        vpd: target.metrics.vpd,
        lightIntensity: target.metrics.lightIntensity,
        photoperiod: 16,
        lightWavelength: "WHITE",
        ph: target.metrics.ph,
        waterTemp: target.metrics.waterTemp,
        ec: target.metrics.ec,
        dataSource: "WEB_SIMULATOR",
        envStatus: target.status,
      });
      await greenqApi.environmentLogs({ hours: 24 });
      window.dispatchEvent(new CustomEvent("greenq:env-alerts-refresh"));
      appendLogs({ zoneName: target.zoneName, itemName: "저장", status: target.status, message: "현재 환경 상태가 저장되었습니다." });
    } catch (err) {
      appendLogs({ zoneName: target.zoneName, itemName: "저장", status: "FAIL", message: err?.message || "저장에 실패했습니다." });
    } finally {
      setSavingTargetId(null);
    }
  };

  const saveAll = async () => {
    setSavingAll(true);
    try {
      for (const target of targets) {
        if (target.batchId) {
          await saveTarget(target);
        }
      }
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="page simulation-page">
      <PageHeader
        eyebrow="Simulation"
        title="환경 시뮬레이션"
        description="온도, 습도, pH, EC 변화에 따른 구역별 작물 상태를 시각적으로 확인합니다."
      />

      {error && <div className="notice-box danger">{error}</div>}

      <section className="stat-grid four compact simulation-summary-grid">
        <StatCard label="시뮬레이션 대상" value={targets.length} hint="운영중 배치" />
        <StatCard label="정상" value={counts.NORMAL || 0} hint="기준 범위" />
        <StatCard label="주의" value={counts.CAUTION || 0} hint="확인 필요" tone="orange" />
        <StatCard label="경고" value={counts.FAIL || 0} hint="즉시 점검" tone="red" />
      </section>

      {loading ? (
        <div className="panel"><p className="muted-text">시뮬레이션 데이터를 불러오는 중입니다...</p></div>
      ) : error ? (
        <EmptyState title="시뮬레이션 데이터를 불러오지 못했습니다." description={error} action={<button className="primary-button" onClick={loadSimulationData}>다시 시도</button>} />
      ) : (
        <>
          <section className="simulation-workspace">
            <SimulationStage targets={targets} onSaveTarget={saveTarget} savingTargetId={savingTargetId} />
            <SimulationControlPanel
              running={running}
              disabled={!targets.length}
              onStart={start}
              onStop={stop}
              onReset={reset}
              onRandomAbnormal={randomAbnormal}
              onNormalize={normalizeAll}
              onSaveAll={saveAll}
              saving={savingAll}
            />
          </section>
          <SimulationLogPanel logs={logs} />
        </>
      )}
    </div>
  );
}
