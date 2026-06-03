import { AlertTriangle } from "lucide-react";
import Modal from "./Modal.jsx";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  loading = false,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      size="sm"
      onClose={loading ? undefined : onCancel}
      footer={
        <>
          <button type="button" className="secondary-button" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "danger-button" : "primary-button"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "처리 중..." : confirmLabel}
          </button>
        </>
      }
    >
      <div className={`confirm-dialog-body ${danger ? "danger" : ""}`}>
        <span className="confirm-dialog-icon">
          <AlertTriangle size={20} />
        </span>
        <p>이 작업은 저장된 데이터 상태를 변경합니다. 계속 진행할지 확인해 주세요.</p>
      </div>
    </Modal>
  );
}
