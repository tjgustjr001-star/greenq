import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import ActionMenu from "../../components/ActionMenu.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { asArray, useApiData } from "../../hooks/useApiData.js";

function getNowForInput() { const now = new Date(); const offset = now.getTimezoneOffset() * 60000; return new Date(now.getTime() - offset).toISOString().slice(0, 16); }
const createSample = (index) => ({ sampleNo: index + 1, plantHeight: "", leafWidth: "", leafLength: "", freshWeight: "", leafColor: "", growthStage: "", specialNote: "" });

export default function QualityPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get("batchId");
  const { data, loading, error, reload } = useApiData(async () => {
    const [batches, measurements] = await Promise.all([greenqApi.batches(), greenqApi.measurements()]);
    return { batches, measurements };
  }, []);
  const batches = asArray(data?.batches);
  const measurements = useMemo(() => asArray(data?.measurements).filter((m) => !batchId || String(m.batchId) === String(batchId)), [data, batchId]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ batchId: batchId || "", measuredAt: getNowForInput(), samples: [createSample(0), createSample(1), createSample(2), createSample(3), createSample(4)] });

  useEffect(() => { if (!form.batchId && batches[0]) setForm((prev) => ({ ...prev, batchId: String(batches[0].batchId) })); }, [batches, form.batchId]);
  const updateSample = (index, key, value) => setForm((prev) => ({ ...prev, samples: prev.samples.map((sample, i) => i === index ? { ...sample, [key]: value } : sample) }));
  const addSample = () => setForm((prev) => ({ ...prev, samples: [...prev.samples, createSample(prev.samples.length)] }));
  const removeSample = (index) => setForm((prev) => ({ ...prev, samples: prev.samples.filter((_, i) => i !== index).map((sample, i) => ({ ...sample, sampleNo: i + 1 })) }));
  const average = (key) => { const values = form.samples.map((s) => Number(s[key])).filter((v) => !Number.isNaN(v)); return values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : null; };
  const saveMeasurement = async () => { if (!form.batchId) return; await greenqApi.createMeasurement({ batchId: form.batchId, measuredAt: form.measuredAt, sampleCount: form.samples.length, plantHeight: average("plantHeight"), leafWidth: average("leafWidth"), leafLength: average("leafLength"), freshWeight: average("freshWeight"), leafColor: form.samples[0]?.leafColor || "", growthStage: form.samples[0]?.growthStage || "", specialNote: form.samples.map((s) => s.specialNote).filter(Boolean).join(" / "), samples: form.samples }); setShowForm(false); setForm({ batchId: batchId || String(batches[0]?.batchId || ""), measuredAt: getNowForInput(), samples: [createSample(0), createSample(1), createSample(2), createSample(3), createSample(4)] }); await reload(); };
  const deleteMeasurement = async (m) => { if (!window.confirm("실측 데이터를 DB에서 임시 삭제 처리합니다.")) return; await greenqApi.deleteMeasurement(m.measurementId); await reload(); };

  if (loading) return <div className="panel"><p className="muted-text">실측 데이터를 DB에서 불러오는 중입니다...</p></div>;

  return <div className="page"><PageHeader eyebrow="Quality" title="실측/품질 관리" description="DB에 저장된 실측 데이터를 조회하고 작업자 입력 데이터를 저장합니다." actions={<button className="primary-button" onClick={() => setShowForm((p) => !p)}><Plus size={16} />{showForm ? "입력 닫기" : "실측 입력"}</button>} />{error && <div className="notice-box">{error}</div>}{batchId && <div className="notice-box">현재 batchId={batchId} 기준으로 필터가 적용되었습니다.</div>}{showForm && <div className="panel fake-form"><h3>실측 데이터 입력</h3><div className="form-grid"><label>배치<select value={form.batchId} onChange={(e) => setForm((p) => ({ ...p, batchId: e.target.value }))}>{batches.map((batch) => <option key={batch.batchId} value={batch.batchId}>{batch.zoneName} · {batch.batchName}</option>)}</select></label><label>측정일시<input type="datetime-local" value={form.measuredAt} onChange={(e) => setForm((p) => ({ ...p, measuredAt: e.target.value }))} /></label></div><div className="panel-head"><h3>샘플 입력</h3><button className="secondary-button" onClick={addSample}><Plus size={15} /> 샘플 추가</button></div><table><thead><tr><th>샘플</th><th>초장(cm)</th><th>엽폭(cm)</th><th>엽장(cm)</th><th>생체중(g)</th><th>엽색</th><th>생육단계</th><th>메모</th><th>삭제</th></tr></thead><tbody>{form.samples.map((sample, index) => <tr key={sample.sampleNo}><td>{index + 1}</td>{["plantHeight", "leafWidth", "leafLength", "freshWeight", "leafColor", "growthStage", "specialNote"].map((key) => <td key={key}><input className="mini-input" value={sample[key] || ""} onChange={(e) => updateSample(index, key, e.target.value)} /></td>)}<td><button className="icon-button" onClick={() => removeSample(index)} disabled={form.samples.length <= 1}><Trash2 size={15} /></button></td></tr>)}</tbody></table><div className="form-footer-actions"><button className="secondary-button" onClick={() => setShowForm(false)}>취소</button><button className="primary-button" onClick={saveMeasurement}>DB 저장</button></div></div>}<div className="panel"><div className="panel-head"><h3>실측 데이터 조회</h3></div><table><thead><tr><th>측정일시</th><th>배치</th><th>샘플</th><th>초장 평균</th><th>엽폭 평균</th><th>엽장 평균</th><th>생체중 평균</th><th>품질 상태</th><th>관리</th></tr></thead><tbody>{measurements.map((m) => <tr key={m.measurementId}><td>{m.measuredAt}</td><td><button className="link-cell" onClick={() => navigate(`/quality/${m.measurementId}`)}><strong>{m.batchName}</strong></button></td><td>{m.sampleCount}</td><td>{m.plantHeight ?? "-"}</td><td>{m.leafWidth ?? "-"}</td><td>{m.leafLength ?? "-"}</td><td>{m.freshWeight ?? "-"}</td><td><StatusBadge value={m.qualityStatus} /></td><td><ActionMenu items={[{ label: "상세 보기", kind: "detail", onClick: () => navigate(`/quality/${m.measurementId}`) }, { label: "삭제", kind: "delete", danger: true, onClick: () => deleteMeasurement(m) }]} /></td></tr>)}</tbody></table></div></div>;
}
