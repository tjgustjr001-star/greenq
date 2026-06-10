import { Check, Copy, Download, Printer, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { greenqApi } from "../api/greenqApi.js";
import Modal from "./Modal.jsx";
import StatusBadge from "./StatusBadge.jsx";

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getQrBaseUrl() {
  const envUrl = normalizeBaseUrl(import.meta.env.VITE_PUBLIC_APP_URL);
  const baseUrl = envUrl || normalizeBaseUrl(window.location.origin);

  if (/\/\/(localhost|127\.0\.0\.1)(?::|\/|$)/i.test(baseUrl)) {
    console.warn(
      "[GreenQ QR] 현재 localhost 기반 QR 주소가 생성됩니다. 태블릿 시연 시 관리자 브라우저를 노트북 내부 IP 주소로 접속하거나 VITE_PUBLIC_APP_URL을 설정하세요."
    );
  }

  return baseUrl;
}

function buildQrUrl(qrInfo) {
  const token = qrInfo?.qrToken;
  const scanPath = qrInfo?.scanPath || (token ? `/scan/batch/${token}` : "");
  if (!scanPath) return getQrBaseUrl();
  return `${getQrBaseUrl()}${scanPath.startsWith("/") ? scanPath : `/${scanPath}`}`;
}

function buildTargetPath(qrInfo) {
  return qrInfo?.targetPath || (qrInfo?.batchId ? `/quality/new?batchId=${qrInfo.batchId}&fromQr=Y` : "-");
}

export default function BatchQrModal({ open, batch, onClose, onRegenerated }) {
  const [qrInfo, setQrInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !batch?.batchId) return;
    let ignore = false;
    setLoading(true);
    setError("");
    setCopied(false);
    greenqApi.batchQr(batch.batchId)
      .then((data) => {
        if (!ignore) setQrInfo(data);
      })
      .catch((err) => {
        if (!ignore) setError(err.message || "QR 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [open, batch?.batchId]);

  const qrUrl = useMemo(() => buildQrUrl(qrInfo), [qrInfo]);
  const targetPath = useMemo(() => buildTargetPath(qrInfo), [qrInfo]);
  const isLocalhostQr = /\/\/(localhost|127\.0\.0\.1)(?::|\/|$)/i.test(qrUrl);
  const canvasId = qrInfo?.batchId ? `batch-qr-${qrInfo.batchId}` : "batch-qr";

  const regenerate = async () => {
    if (!batch?.batchId || regenerating) return;
    if (!window.confirm("기존 QR은 더 이상 사용할 수 없게 됩니다. QR 토큰을 재발급할까요?")) return;
    setRegenerating(true);
    setError("");
    try {
      const result = await greenqApi.regenerateBatchQr(batch.batchId);
      const next = await greenqApi.batchQr(batch.batchId);
      setQrInfo(next);
      onRegenerated?.(result);
    } catch (err) {
      setError(err.message || "QR 토큰 재발급에 실패했습니다.");
    } finally {
      setRegenerating(false);
    }
  };

  const copyUrl = async () => {
    if (!qrUrl) return;
    await navigator.clipboard?.writeText(qrUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${qrInfo?.batchName || "greenq-batch"}-qr.png`;
    link.click();
  };

  const printQr = () => {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !qrInfo) return;
    const image = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank", "width=420,height=620");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>GreenQ 배치 QR</title></head>
        <body style="font-family:Arial, sans-serif; padding:24px; text-align:center;">
          <p style="font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:#6b7280;">GreenQ Batch QR</p>
          <h2 style="margin:6px 0 4px;">${qrInfo.batchName}</h2>
          <p style="margin:0 0 16px; color:#4b5563;">${qrInfo.zoneName} · ${qrInfo.cropName}</p>
          <img src="${image}" width="220" height="220" />
          <p style="margin-top:16px; font-size:12px; color:#6b7280; word-break:break-all;">${qrUrl}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Modal
      open={open}
      title="배치 QR 보기"
      description="현장 작업자가 QR을 스캔하면 해당 배치의 실측 입력 화면으로 이동합니다."
      onClose={onClose}
      footer={(
        <>
          <button className="secondary-button" onClick={onClose}>닫기</button>
          <button className="secondary-button" onClick={copyUrl} disabled={!qrInfo}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "복사됨" : "주소 복사"}
          </button>
          <button className="secondary-button" onClick={download} disabled={!qrInfo}><Download size={15} />다운로드</button>
          <button className="secondary-button" onClick={printQr} disabled={!qrInfo}><Printer size={15} />인쇄</button>
          <button className="danger-button" onClick={regenerate} disabled={!qrInfo || regenerating}>
            <RefreshCw size={15} />{regenerating ? "재발급 중" : "QR 재발급"}
          </button>
        </>
      )}
    >
      {loading && <p className="muted-text">QR 정보를 불러오는 중입니다...</p>}
      {error && <div className="form-error">{error}</div>}
      {qrInfo && (
        <div className="qr-modal-body">
          <div className="qr-preview-card">
            <QRCodeCanvas id={canvasId} value={qrUrl} size={210} includeMargin />
            <p className="qr-scan-caption">태블릿 카메라로 스캔</p>
          </div>
          <div className="qr-info-card">
            <p className="eyebrow">Batch QR</p>
            <h3>{qrInfo.batchName}</h3>
            <dl>
              <dt>구역</dt><dd>{qrInfo.zoneName}</dd>
              <dt>작물</dt><dd>{qrInfo.cropName}</dd>
              <dt>상태</dt><dd><StatusBadge value={qrInfo.batchStatus} /></dd>
              <dt>이동 화면</dt><dd>{targetPath}</dd>
            </dl>
            <p className="panel-desc">
              QR은 로그인 권한을 대체하지 않습니다. 스캔 후 로그인한 사용자 권한에 따라 실측 입력 접근 여부가 결정됩니다.
            </p>
            <details className="qr-detail-panel">
              <summary>QR 상세 정보</summary>
              <div className="qr-url-box">
                <span>QR 주소</span>
                <p>{qrUrl}</p>
              </div>
              <div className="qr-url-box subtle">
                <span>QR 토큰</span>
                <p className="mono-text">{qrInfo.qrToken}</p>
              </div>
              {isLocalhostQr && (
                <p className="qr-localhost-warning">
                  localhost로 접속한 상태에서는 QR 주소도 localhost로 생성됩니다. 태블릿 시연 시 관리자 브라우저를 노트북 내부 IP 주소로 접속하세요.
                </p>
              )}
            </details>
          </div>
        </div>
      )}
    </Modal>
  );
}
