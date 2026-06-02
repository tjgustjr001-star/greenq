import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import PageHeader from "../../components/PageHeader.jsx";
import { LEAF_COLOR_OPTIONS, GROWTH_STAGE_OPTIONS, growthStageLabelOf } from "../../data/qualityOptions.js";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";
import { batchDisplayLabel, batchNameWithZone } from "../../utils/batchLabel.js";

function getNowForInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

const numericKeys = ["plantHeight", "leafWidth", "leafLength", "freshWeight"];

const numericLabels = {
  plantHeight: "초장(cm)",
  leafWidth: "엽폭(cm)",
  leafLength: "엽장(cm)",
  freshWeight: "생체중(g)",
};

const numericItemCodes = {
  plantHeight: "PLANT_HEIGHT",
  leafWidth: "LEAF_WIDTH",
  leafLength: "LEAF_LENGTH",
  freshWeight: "FRESH_WEIGHT",
};

const inputPlaceholders = {
  plantHeight: "예: 18.5",
  leafWidth: "예: 9.2",
  leafLength: "예: 14.8",
  freshWeight: "예: 95",
};

const createSample = (index) => ({
  sampleNo: index + 1,
  plantHeight: "",
  leafWidth: "",
  leafLength: "",
  freshWeight: "",
  leafColor: "",
  growthStage: "",
  specialNote: "",
});

function average(samples, key) {
  const values = samples
    .map((sample) => String(sample[key] ?? "").trim())
    .filter(Boolean)
    .map(Number)
    .filter((value) => !Number.isNaN(value));

  return values.length
    ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
    : null;
}

function firstFilled(samples, key) {
  return samples.map((sample) => String(sample[key] || "").trim()).find(Boolean) || "";
}

function normalizeStandardValue(value) {
  if (value === null || value === undefined || value === "") return null;
  return Number(value).toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function formatRangeHelp(standard) {
  if (!standard) return "배치 선택 후 정상 범위를 확인합니다.";
  const min = normalizeStandardValue(standard.min);
  const max = normalizeStandardValue(standard.max);
  const unit = standard.unit || "";

  if (min && max) return `정상 범위: ${min} ~ ${max}${unit}`;
  if (min) return `정상 기준: ${min}${unit} 이상`;
  if (max) return `정상 기준: ${max}${unit} 이하`;
  return "정상 범위가 설정되지 않았습니다.";
}

function formatTextHelp(standard, formatter = (value) => value) {
  if (!standard) return "배치 선택 후 기준값을 확인합니다.";
  if (!standard.expectedTextValue) return "기대값이 설정되지 않았습니다.";
  return `기대값: ${formatter(standard.expectedTextValue)}`;
}

export default function QualityEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialBatchId = searchParams.get("batchId") || "";
  const fromQr = searchParams.get("fromQr") === "Y";
  const user = getCurrentUser();

  const { data, loading, error } = useApiData(async () => {
    const batches = await greenqApi.batches();
    return { batches };
  }, []);

  const batches = asArray(data?.batches);
  const [form, setForm] = useState({
    batchId: initialBatchId,
    measuredAt: getNowForInput(),
    samples: [createSample(0), createSample(1), createSample(2), createSample(3), createSample(4)],
  });
  const [saving, setSaving] = useState(false);
  const [qualityStandards, setQualityStandards] = useState([]);
  const [standardsLoading, setStandardsLoading] = useState(false);

  useEffect(() => {
    if (!form.batchId && batches[0]) {
      setForm((prev) => ({ ...prev, batchId: String(batches[0].batchId) }));
    }
  }, [batches, form.batchId]);

  const selectedBatch = batches.find((batch) => String(batch.batchId) === String(form.batchId));

  useEffect(() => {
    if (!selectedBatch?.cropId) {
      setQualityStandards([]);
      return;
    }

    let active = true;
    setStandardsLoading(true);

    greenqApi
      .cropStandards(selectedBatch.cropId, "QUALITY")
      .then((result) => {
        if (active) setQualityStandards(asArray(result));
      })
      .catch(() => {
        if (active) setQualityStandards([]);
      })
      .finally(() => {
        if (active) setStandardsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedBatch?.cropId]);

  const standardByCode = useMemo(() => {
    return Object.fromEntries(qualityStandards.map((item) => [item.itemCode, item]));
  }, [qualityStandards]);

  const summary = useMemo(
    () => Object.fromEntries(numericKeys.map((key) => [key, average(form.samples, key)])),
    [form.samples]
  );

  const filledCount = form.samples.filter((sample) => {
    const hasNumber = numericKeys.some((key) => String(sample[key] || "").trim() !== "");
    const hasText = ["leafColor", "growthStage", "specialNote"].some((key) => String(sample[key] || "").trim() !== "");
    return hasNumber || hasText;
  }).length;

  const updateSample = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      samples: prev.samples.map((sample, i) => (i === index ? { ...sample, [key]: value } : sample)),
    }));
  };

  const addSample = () => {
    setForm((prev) => ({ ...prev, samples: [...prev.samples, createSample(prev.samples.length)] }));
  };

  const removeSample = (index) => {
    setForm((prev) => ({
      ...prev,
      samples: prev.samples.filter((_, i) => i !== index).map((sample, i) => ({ ...sample, sampleNo: i + 1 })),
    }));
  };

  const saveMeasurement = async () => {
    if (!form.batchId || saving) return;
    setSaving(true);
    try {
      const payload = {
        batchId: form.batchId,
        measuredBy: user?.userId || user?.id || 2,
        measuredAt: form.measuredAt,
        sampleCount: form.samples.length,
        aggregationMethod: "AVG",
        plantHeight: summary.plantHeight,
        leafWidth: summary.leafWidth,
        leafLength: summary.leafLength,
        freshWeight: summary.freshWeight,
        leafColor: firstFilled(form.samples, "leafColor"),
        growthStage: firstFilled(form.samples, "growthStage"),
        specialNote: form.samples.map((sample) => sample.specialNote).filter(Boolean).join(" / "),
        samples: form.samples,
      };
      const saved = await greenqApi.createMeasurement(payload);
      navigate(`/quality/${saved.measurementId}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="panel">
        <p className="muted-text">배치 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="page quality-entry-page">
      <PageHeader
        eyebrow="Quality Entry"
        title="실측 데이터 입력"
        description="작업자가 배치별 샘플을 입력하면 평균값을 계산하고 품질 평가를 자동 실행합니다."
        actions={
          <>
            <button className="secondary-button" onClick={() => navigate("/quality")}>
              목록으로
            </button>
            <button className="primary-button" onClick={saveMeasurement} disabled={saving || !form.batchId}>
              <Save size={16} />
              {saving ? "저장 중" : "저장 및 평가"}
            </button>
          </>
        }
      />

      {error && <div className="notice-box">{error}</div>}

      {fromQr && selectedBatch && (
        <div className="notice-box qr-entry-notice">
          QR로 선택된 배치입니다. 현장 확인 후 샘플 실측값을 입력하세요.
          <strong>{batchNameWithZone(selectedBatch)}</strong>
        </div>
      )}

      {!fromQr && initialBatchId && selectedBatch && (
        <div className="notice-box qr-entry-notice">
          같은 배치로 새 실측을 입력합니다.
          <strong>{batchNameWithZone(selectedBatch)}</strong>
        </div>
      )}

      <div className="panel quality-entry-panel">
        <div className="quality-entry-top">
          <label>
            배치 선택
            <select value={form.batchId} onChange={(e) => setForm((prev) => ({ ...prev, batchId: e.target.value }))}>
              {batches.map((batch) => (
                <option key={batch.batchId} value={batch.batchId}>
                  {batchDisplayLabel(batch)}
                </option>
              ))}
            </select>
            {fromQr && <span className="field-hint">QR 스캔으로 자동 선택되었습니다. 필요 시 다른 배치로 변경할 수 있습니다.</span>}
          </label>

          <label>
            측정일시
            <input
              type="datetime-local"
              value={form.measuredAt}
              onChange={(e) => setForm((prev) => ({ ...prev, measuredAt: e.target.value }))}
            />
          </label>

          <div className="quality-target-box">
            <span>선택 배치</span>
            <strong>{selectedBatch ? batchNameWithZone(selectedBatch) : "배치를 선택하세요"}</strong>
            <p>{selectedBatch?.cropName || "-"}</p>
          </div>
        </div>

        <div className="quality-summary-strip">
          <div>
            <span>입력 샘플</span>
            <strong>{filledCount}/{form.samples.length}</strong>
          </div>
          {numericKeys.map((key) => (
            <div key={key}>
              <span>{numericLabels[key]}</span>
              <strong>{summary[key] ?? "-"}</strong>
            </div>
          ))}
        </div>

        <div className="panel-head no-border">
          <div>
            <h3>샘플 카드 입력</h3>
            <p className="panel-desc">
              {standardsLoading
                ? "품질 기준을 불러오는 중입니다."
                : "각 항목의 정상 범위와 기대값을 확인하면서 샘플을 입력합니다."}
            </p>
          </div>
          <button className="secondary-button" onClick={addSample}>
            <Plus size={15} />
            샘플 추가
          </button>
        </div>

        <div className="sample-card-list enhanced">
          {form.samples.map((sample, index) => (
            <article className="sample-card enhanced" key={sample.sampleNo}>
              <div className="sample-card-head">
                <div>
                  <strong>샘플 {index + 1}</strong>
                  <p>개체별 원시값</p>
                </div>
                <button className="icon-danger-button" onClick={() => removeSample(index)} disabled={form.samples.length <= 1}>
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="sample-grid enhanced">
                {numericKeys.map((key) => (
                  <label key={key}>
                    {numericLabels[key]}
                    <input
                      inputMode="decimal"
                      value={sample[key]}
                      onChange={(e) => updateSample(index, key, e.target.value)}
                      placeholder={inputPlaceholders[key]}
                    />
                    <span className="field-hint">{formatRangeHelp(standardByCode[numericItemCodes[key]])}</span>
                  </label>
                ))}

                <label>
                  엽색
                  <select value={sample.leafColor} onChange={(e) => updateSample(index, "leafColor", e.target.value)}>
                    {LEAF_COLOR_OPTIONS.map((option) => (
                      <option key={option.value || "empty"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="field-hint">{formatTextHelp(standardByCode.LEAF_COLOR)}</span>
                </label>

                <label>
                  생육단계
                  <select value={sample.growthStage} onChange={(e) => updateSample(index, "growthStage", e.target.value)}>
                    {GROWTH_STAGE_OPTIONS.map((option) => (
                      <option key={option.value || "empty"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="field-hint">{formatTextHelp(standardByCode.GROWTH_STAGE, growthStageLabelOf)}</span>
                </label>

                <label className="sample-note">
                  특이사항
                  <textarea
                    value={sample.specialNote}
                    onChange={(e) => updateSample(index, "specialNote", e.target.value)}
                    placeholder="잎 끝 갈변, 생육 지연 등"
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
