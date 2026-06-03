import { useState } from "react";
import { greenqApi } from "../../api/greenqApi.js";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

export default function DeletedDataPage() {
  const isAdmin = (getCurrentUser().role || getCurrentUser().roleCode) === "ADMIN";
  const [actionError, setActionError] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const { data, loading, error, reload } = useApiData(() => greenqApi.deletedData(), []);
  const rows = asArray(data);

  const restore = async (item) => {
    setActionError("");
    try {
      await greenqApi.restoreDeletedData(item.entityName, item.idValue);
      await reload();
    } catch (err) {
      setActionError(err.message || "복원 처리에 실패했습니다.");
    }
  };

  const remove = async () => {
    if (!removeTarget || removing) return;
    setRemoving(true);
    setActionError("");
    try {
      await greenqApi.permanentDeleteDeletedData(removeTarget.entityName, removeTarget.idValue);
      setRemoveTarget(null);
      await reload();
    } catch (err) {
      setActionError(err.message || "영구 삭제 처리에 실패했습니다.");
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return <div className="panel"><p className="muted-text">삭제 데이터를 DB에서 불러오는 중입니다...</p></div>;
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Deleted Data"
        title="삭제 데이터 관리"
        description="localStorage 휴지통이 아니라 DB의 delete_yn='Y' 데이터를 조회합니다."
      />

      {!isAdmin && <div className="notice-box">삭제 데이터 관리는 관리자 전용 기능입니다.</div>}
      {error && <div className="notice-box">{error}</div>}
      {actionError && <div className="notice-box danger">{actionError}</div>}

      {!isAdmin ? null : rows.length === 0 ? (
        <EmptyState title="삭제 데이터가 없습니다." description="현재 DB에 임시 삭제된 데이터가 없습니다." />
      ) : (
        <div className="panel">
          <table>
            <thead>
              <tr><th>구분</th><th>데이터</th><th>삭제일시</th><th>관리</th></tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={`${item.entityName}-${item.idValue}`}>
                  <td><strong>{item.entityLabel}</strong></td>
                  <td>{item.displayName}</td>
                  <td>{item.deletedAt || "-"}</td>
                  <td>
                    <div className="inline-actions center">
                      <button className="small-button" onClick={() => restore(item)}>복원</button>
                      <button className="small-button danger" onClick={() => setRemoveTarget(item)}>영구 삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="영구 삭제"
        description={`${removeTarget?.displayName || "선택한 데이터"}를 완전히 삭제합니다. 이 작업은 복원할 수 없습니다.`}
        confirmLabel="영구 삭제"
        danger
        loading={removing}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={remove}
      />
    </div>
  );
}
