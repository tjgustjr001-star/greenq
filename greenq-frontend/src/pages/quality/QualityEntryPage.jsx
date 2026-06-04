import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import PageHeader from "../../components/PageHeader.jsx";
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

const numericPlaceholders = {
  plantHeight: "정상 예: 14~22",
  leafWidth: "정상 예: 7~12",
  leafLength: "정상 예: 10~18",
  freshWeight: "정상 예: 80~140",
};

const leafColorOptions = ["진녹색", "녹색", "연녹색", "황녹색", "갈변", "기타"];
const growthStageOptions = [
  { value: "GERMINATION", label: "발아기" },
  { value: "GROWING", label: "생육기" },
  { value: "HARVEST", label: "수확기" },
];

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
  const values = samples.map((s) => Number(s[key])).filter((v) => !Number.isNaN(v));
  return values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : null;
}

function firstFilled(samples, key) {
  return samples.map((s) => String(s[key] || "").trim()).find(Boolean) || "";
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

  useEffect(() => {
    if (!form.batchId && batches[0]) {
      setForm((prev) => ({ ...prev, batchId: String(batches[0].batchId) }));
    }
  }, [batches, form.batchId]);

  const selectedBatch = batches.find((batch) => String(batch.batchId) === String(form.batchId));
  const summary = useMemo(() => Object.fromEntries(numericKeys.map((key) => [key, average(form.samples, key)])), [form.samples]);
  const filledCount = form.samples.filter((sample) => numericKeys.some((key) => String(sample[key] || "").trim() !== "")).length;

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
        specialNote: form.samples.map((s) => s.specialNote).filter(Boolean).join(" / "),
        samples: form.samples,
      };
      const saved = await greenqApi.createMeasurement(payload);
      navigate(`/quality/${saved.measurementId}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="panel"><p className="muted-text">배치 정보를 DB에서 불러오는 중입니다...</p></div>;

  return (
    <div className="page quality-entry-page">
      <PageHeader
        eyebrow="Quality Entry"
        title="실측 데이터 입력"
        description="작업자가 배치별 샘플을 입력하면 평균값을 계산하고 품질 평가를 자동 실행합니다."
        actions={<><button className="secondary-button" onClick={() => navigate("/quality")}>목록으로</button><button className="primary-button" onClick={saveMeasurement} disabled={saving || !form.batchId}><Save size={16} />{saving ? "저장 중" : "저장 및 평가"}</button></>}
      />
      {error && <div className="notice-box">{error}</div>}

      {fromQr && selectedBatch && <div className="notice-box qr-entry-notice">QR로 선택된 배치입니다. 현장 확인 후 샘플 실측값을 입력하세요. <strong>{batchNameWithZone(selectedBatch)}</strong></div>}
      {!fromQr && initialBatchId && selectedBatch && <div className="notice-box qr-entry-notice">같은 배치로 새 실측을 입력합니다. <strong>{batchNameWithZone(selectedBatch)}</strong></div>}

      <div className="panel quality-entry-panel">
        <div className="quality-entry-top">
          <label>배치 선택<select value={form.batchId} onChange={(e) => setForm((p) => ({ ...p, batchId: e.target.value }))}>{batches.map((batch) => <option key={batch.batchId} value={batch.batchId}>{batchDisplayLabel(batch)}</option>)}</select>{fromQr && <span className="field-hint">QR 스캔으로 자동 선택되었습니다. 필요 시 다른 배치로 변경할 수 있습니다.</span>}</label>
          <label>측정일시<input type="datetime-local" value={form.measuredAt} onChange={(e) => setForm((p) => ({ ...p, measuredAt: e.target.value }))} /></label>
          <div className="quality-target-box"><span>선택 배치</span><strong>{selectedBatch ? batchNameWithZone(selectedBatch) : "배치를 선택하세요"}</strong><p>{selectedBatch?.cropName || "-"}</p></div>
        </div>

        <div className="quality-summary-strip">
          <div><span>입력 샘플</span><strong>{filledCount}/{form.samples.length}</strong></div>
          {numericKeys.map((key) => <div key={key}><span>{numericLabels[key]}</span><strong>{summary[key] ?? "-"}</strong></div>)}
        </div>

        <div className="panel-head no-border"><div><h3>샘플 카드 입력</h3><p className="panel-desc">PC에서는 카드 단위로 빠르게 입력하고, 태블릿에서도 표보다 덜 답답하게 입력할 수 있도록 구성했습니다.</p></div><button className="secondary-button" onClick={addSample}><Plus size={15} />샘플 추가</button></div>
        <div className="sample-card-list enhanced">
          {form.samples.map((sample, index) => (
            <article className="sample-card enhanced" key={sample.sampleNo}>
              <div className="sample-card-head"><div><strong>샘플 {index + 1}</strong><p>개체별 원시값</p></div><button className="icon-danger-button" onClick={() => removeSample(index)} disabled={form.samples.length <= 1}><Trash2 size={15} /></button></div>
              <div className="sample-grid enhanced">
                {numericKeys.map((key) => <label key={key}>{numericLabels[key]}<input inputMode="decimal" value={sample[key]} onChange={(e) => updateSample(index, key, e.target.value)} placeholder={numericPlaceholders[key]} /></label>)}
                <label>엽색<select value={sample.leafColor} onChange={(e) => updateSample(index, "leafColor", e.target.value)}><option value="">선택</option>{leafColorOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                <label>생육단계<select value={sample.growthStage} onChange={(e) => updateSample(index, "growthStage", e.target.value)}><option value="">선택</option>{growthStageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                <label className="sample-note">특이사항<textarea value={sample.specialNote} onChange={(e) => updateSample(index, "specialNote", e.target.value)} placeholder="잎 끝 갈변, 생육 지연 등" /></label>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
