import { ArrowRight, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { greenqApi } from "../api/greenqApi.js";
import EmptyState from "../components/EmptyState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function ScanBatchPage() {
  const { qrToken } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    greenqApi.scanBatch(qrToken)
      .then((data) => {
        if (ignore) return;
        setBatch(data);
        setTimeout(() => navigate(data.targetPath || `/quality/new?batchId=${data.batchId}&fromQr=Y`, { replace: true }), 900);
      })
      .catch((err) => { if (!ignore) setError(err.message || "QR 배치 정보를 찾을 수 없습니다."); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [qrToken, navigate]);

  if (loading) {
    return <div className="panel scan-panel"><QrCode size={40} /><h2>QR 배치 정보를 확인하는 중입니다.</h2><p className="muted-text">잠시 후 실측 입력 화면으로 이동합니다.</p></div>;
  }

  if (error) {
    return <EmptyState title="QR 배치 정보를 찾을 수 없습니다." description={error} action={<button className="primary-button" onClick={() => navigate("/quality/new")}>실측 입력으로 이동</button>} />;
  }

  return (
    <div className="panel scan-panel">
      <QrCode size={42} />
      <p className="eyebrow">Batch QR Scan</p>
      <h2>{batch.batchName}</h2>
      <p>{batch.zoneName} · {batch.cropName}</p>
      <StatusBadge value={batch.batchStatus} />
      <button className="primary-button" onClick={() => navigate(batch.targetPath || `/quality/new?batchId=${batch.batchId}&fromQr=Y`, { replace: true })}>
        실측 입력으로 이동 <ArrowRight size={16} />
      </button>
    </div>
  );
}
