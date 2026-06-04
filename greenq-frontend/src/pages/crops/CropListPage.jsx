import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import ActionMenu from "../../components/ActionMenu.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Modal from "../../components/Modal.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { cropTypeLabels } from "../../data/displayLabels.js";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

const initialForm = {
  cropId: null,
  cropName: "",
  varietyName: "",
  cropType: "LEAFY",
  cropStatus: "ACTIVE",
  description: "",
  standardPresetCode: "NONE",
};
const toForm = (crop) => ({
  cropId: crop.cropId,
  cropName: crop.cropName || "",
  varietyName: crop.varietyName || "",
  cropType: crop.cropType || "LEAFY",
  cropStatus: crop.cropStatus || "ACTIVE",
  description: crop.description || "",
  standardPresetCode: "NONE",
});

export default function CropListPage() {
  const navigate = useNavigate();
  const isAdmin = (getCurrentUser().role || getCurrentUser().roleCode) === "ADMIN";
  const { data, loading, error, reload } = useApiData(() => greenqApi.crops(), []);
  const cropRows = asArray(data);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formError, setFormError] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [pageNoticeDanger, setPageNoticeDanger] = useState(false);
  const isEdit = Boolean(form.cropId);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const clearPageNotice = () => { setPageNotice(""); setPageNoticeDanger(false); };
  const startCreate = () => { setForm(initialForm); setFormError(""); clearPageNotice(); setModalOpen(true); };
  const startEdit = (crop) => { setForm(toForm(crop)); setFormError(""); clearPageNotice(); setModalOpen(true); };
  const closeModal = () => {
    if (saving) return;
    setForm(initialForm);
    setFormError("");
    setModalOpen(false);
  };

  const saveCrop = async () => {
    if (saving) return;
    if (!form.cropName.trim()) {
      setFormError("작물명을 입력해 주세요.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        cropName: form.cropName.trim(),
        varietyName: form.varietyName.trim(),
        description: form.description.trim(),
        standardPresetCode: isEdit ? "NONE" : form.standardPresetCode,
      };
      const result = isEdit
        ? await greenqApi.updateCrop(form.cropId, payload)
        : await greenqApi.createCrop(payload);
      const presetMessage = result?.standardPreset?.message;
      setPageNoticeDanger(false);
      setPageNotice(presetMessage || (isEdit ? "작물 정보가 수정되었습니다." : "작물이 등록되었습니다."));
      closeModal();
      await reload();
    } catch (err) {
      setFormError(err?.message || "작물 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCrop = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    clearPageNotice();
    try {
      await greenqApi.deleteCrop(deleteTarget.cropId);
      setDeleteTarget(null);
      setPageNoticeDanger(false);
      setPageNotice("작물이 임시 삭제되었습니다. 삭제 데이터 관리에서 복구할 수 있습니다.");
      await reload();
    } catch (err) {
      setPageNoticeDanger(true);
      setPageNotice(err?.message || "작물 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="panel"><p className="muted-text">작물 데이터를 불러오는 중입니다...</p></div>;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Crop & Standard"
        title="작물/기준 관리"
        description="작물 목록을 확인하고 작물별 기준 관리로 이동합니다."
        actions={isAdmin ? <button className="primary-button" onClick={startCreate}><Plus size={16} />작물 등록</button> : null}
      />
      {!isAdmin && <div className="notice-box">작업자는 작물과 기준값을 조회할 수 있습니다.</div>}
      {pageNotice && <div className={`notice-box ${pageNoticeDanger ? "danger" : "success-box"}`}>{pageNotice}</div>}
      {error && <div className="notice-box">{error}</div>}

      <Modal
        open={isAdmin && modalOpen}
        title={isEdit ? "작물 수정" : "작물 등록"}
        description="단순 작물 정보는 목록 화면 흐름을 유지하기 위해 모달에서 등록합니다."
        onClose={closeModal}
        footer={<><button className="secondary-button" onClick={closeModal} disabled={saving}>취소</button><button className="primary-button" onClick={saveCrop} disabled={saving}>{saving ? "저장 중..." : isEdit ? "수정 저장" : "등록"}</button></>}
      >
        {formError && <div className="notice-box form-error-box">{formError}</div>}
        <div className="form-grid modal-form-grid">
          <label>작물명<input value={form.cropName} onChange={(e) => updateForm("cropName", e.target.value)} placeholder="예: 상추" /></label>
          <label>품종명<input value={form.varietyName} onChange={(e) => updateForm("varietyName", e.target.value)} placeholder="예: 청치마" /></label>
          <label>작물 유형<select value={form.cropType} onChange={(e) => updateForm("cropType", e.target.value)}><option value="LEAFY">엽채류</option><option value="FRUIT">과채류</option><option value="HERB">허브류</option><option value="ETC">기타</option></select></label>
          <label>상태<select value={form.cropStatus} onChange={(e) => updateForm("cropStatus", e.target.value)}><option value="ACTIVE">활성</option><option value="INACTIVE">비활성</option></select></label>
          <label className="wide-field">설명<input value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="작물 설명" /></label>
          {!isEdit && (
            <label className="wide-field">기준값 샘플
              <select value={form.standardPresetCode} onChange={(e) => updateForm("standardPresetCode", e.target.value)}>
                <option value="NONE">적용 안 함</option>
                <option value="LETTUCE_SAMPLE">상추 샘플 기준 적용</option>
              </select>
              <span className="field-help">샘플을 선택하면 작물 등록 후 환경 기준과 품질 기준이 자동 생성됩니다. 생성된 기준은 작물 상세 화면에서 수정할 수 있습니다.</span>
            </label>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="작물 임시 삭제"
        description={`${deleteTarget?.cropName || "선택한 작물"}을 삭제 데이터 관리로 이동합니다.`}
        confirmLabel="임시 삭제"
        danger
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteCrop}
      />

      <div className="panel"><table><thead><tr><th>작물명</th><th>품종명</th><th>유형</th><th>환경 기준</th><th>품질 기준</th><th>상태</th><th>관리</th></tr></thead><tbody>{cropRows.map((crop) => <tr key={crop.cropId}><td><button className="link-cell" onClick={() => navigate(`/crops/${crop.cropId}`)}><strong>{crop.cropName}</strong></button></td><td>{crop.varietyName || "-"}</td><td>{cropTypeLabels[crop.cropType] || crop.cropType}</td><td>{crop.envStandards?.length || 0}개</td><td>{crop.qualityStandards?.length || 0}개</td><td><StatusBadge value={crop.cropStatus} /></td><td><ActionMenu items={[{ label: "상세 보기", kind: "detail", onClick: () => navigate(`/crops/${crop.cropId}`) }, isAdmin && { label: "수정", kind: "edit", onClick: () => startEdit(crop) }, isAdmin && { label: "삭제", kind: "delete", danger: true, onClick: () => setDeleteTarget(crop) }]} /></td></tr>)}</tbody></table></div>
    </div>
  );
}
