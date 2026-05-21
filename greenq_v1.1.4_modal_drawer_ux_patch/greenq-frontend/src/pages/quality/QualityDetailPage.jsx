import { useNavigate, useParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { useApiData } from "../../hooks/useApiData.js";

export default function QualityDetailPage() {
  const { measurementId } = useParams();
  const navigate = useNavigate();
  const { data: measurement, loading, error } = useApiData(() => greenqApi.measurement(measurementId), [measurementId]);
  const deleteMeasurement = async () => { if (!window.confirm("실측 데이터를 DB에서 임시 삭제 처리합니다.")) return; await greenqApi.deleteMeasurement(measurementId); navigate("/quality"); };
  if (loading) return <div className="panel"><p className="muted-text">실측 상세를 DB에서 불러오는 중입니다...</p></div>;
  if (error || !measurement) return <EmptyState title="실측 데이터를 찾을 수 없습니다." description={error || "잘못된 실측 ID입니다."} action={<button className="primary-button" onClick={() => navigate("/quality")}>실측 목록으로</button>} />;
  return <div className="page"><PageHeader eyebrow="Quality Detail" title={`${measurement.batchName} 실측 상세`} description="DB에 저장된 실측 원본과 품질 평가 항목을 확인합니다." actions={<><button className="secondary-button" onClick={() => navigate("/quality")}>목록으로</button><button className="danger-button" onClick={deleteMeasurement}>삭제</button></>} /><div className="panel detail-hero"><div><p className="eyebrow">{measurement.batchName}</p><h3>{measurement.measuredAt}</h3><p>샘플 {measurement.sampleCount}건 · {measurement.specialNote || "특이사항 없음"}</p></div><StatusBadge value={measurement.qualityStatus} /></div><section className="content-grid two"><div className="panel"><div className="panel-head"><h3>평균 실측값</h3></div><dl><dt>초장</dt><dd>{measurement.plantHeight ?? "-"}cm</dd><dt>엽폭</dt><dd>{measurement.leafWidth ?? "-"}cm</dd><dt>엽장</dt><dd>{measurement.leafLength ?? "-"}cm</dd><dt>생체중</dt><dd>{measurement.freshWeight ?? "-"}g</dd><dt>엽색</dt><dd>{measurement.leafColor || "-"}</dd><dt>생육단계</dt><dd>{measurement.growthStage || "-"}</dd></dl></div><div className="panel"><div className="panel-head"><h3>품질 판정 항목</h3></div><table><thead><tr><th>항목</th><th>측정값</th><th>기준</th><th>상태</th></tr></thead><tbody>{(measurement.items || []).map((item) => <tr key={item.qualityEvalItemId || item.itemCode}><td>{item.itemName}</td><td>{item.measuredValue ?? item.measuredTextValue}</td><td>{item.standard}</td><td><StatusBadge value={item.status || item.evalStatus} /></td></tr>)}</tbody></table></div></section><div className="panel"><div className="panel-head"><h3>샘플 원본</h3></div><table><thead><tr><th>No</th><th>초장</th><th>엽폭</th><th>엽장</th><th>생체중</th><th>엽색</th><th>생육단계</th><th>메모</th></tr></thead><tbody>{(measurement.samples || []).map((sample) => <tr key={sample.sampleNo}><td>{sample.sampleNo}</td><td>{sample.plantHeight}</td><td>{sample.leafWidth}</td><td>{sample.leafLength}</td><td>{sample.freshWeight}</td><td>{sample.leafColor}</td><td>{sample.growthStage}</td><td>{sample.specialNote || sample.note}</td></tr>)}</tbody></table></div></div>;
}
