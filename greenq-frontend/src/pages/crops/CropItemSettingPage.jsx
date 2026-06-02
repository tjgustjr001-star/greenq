import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

const groupLabel = { AIR: "공기환경", LIGHT: "광환경", NUTRIENT: "양액환경", GROWTH: "생육/품질", QUALITY_TEXT: "품질 문자값" };

export default function CropItemSettingPage() {
  const { cropId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAdmin = (getCurrentUser().role || getCurrentUser().roleCode) === "ADMIN";
  const type = searchParams.get("type") || "ENV";
  const { data, loading, error, reload } = useApiData(async () => {
    const [crop, masters, standards] = await Promise.all([greenqApi.crop(cropId), greenqApi.measurementItems(), greenqApi.cropStandards(cropId, type)]);
    return { crop, masters, standards };
  }, [cropId, type]);
  const [rows, setRows] = useState([]);
  const [savedAt, setSavedAt] = useState("");

  const masterRows = useMemo(() => asArray(data?.masters).filter((item) => item.standardType === type), [data, type]);

  useEffect(() => {
    const standards = asArray(data?.standards);
    setRows(masterRows.map((master) => {
      const saved = standards.find((item) => item.itemCode === master.itemCode);
      return {
        ...master,
        standardItemId: saved?.standardItemId,
        standardSetId: saved?.standardSetId,
        useYn: saved?.useYn || master.defaultUseYn || "N",
        min: saved?.min ?? "",
        max: saved?.max ?? "",
        failRate: saved?.failRate ?? "",
      };
    }));
  }, [data, masterRows]);

  const updateRow = (itemCode, key, value) => setRows((prev) => prev.map((row) => row.itemCode === itemCode ? { ...row, [key]: value } : row));

  const save = async () => {
    await greenqApi.saveCropStandards(cropId, type, { items: rows });
    setSavedAt(new Date().toLocaleString());
    await reload();
  };

  if (loading) return <div className="panel"><p className="muted-text">기준값을 불러오는 중입니다...</p></div>;
  if (error || !data?.crop) return <EmptyState title="작물을 찾을 수 없습니다." description={error || "잘못된 작물 ID입니다."} action={<button className="primary-button" onClick={() => navigate("/crops")}>작물 목록으로</button>} />;

  return <div className="page"><PageHeader eyebrow="Measurement Item Setting" title={`${data.crop.cropName} 측정 항목 설정`} description="품질과 환경 측정 항목 사용 여부와 기준값을 설정합니다." actions={<><button className="secondary-button" onClick={() => navigate(`/crops/${cropId}`)}>기준값 화면으로</button>{isAdmin && <button className="primary-button" onClick={save}>항목 설정 저장</button>}</>} />{!isAdmin && <div className="notice-box">작업자는 측정 항목 설정을 조회만 할 수 있습니다.</div>}<div className="tab-row"><button className={type === "ENV" ? "active" : ""} onClick={() => setSearchParams({ type: "ENV" })}>환경 항목</button><button className={type === "QUALITY" ? "active" : ""} onClick={() => setSearchParams({ type: "QUALITY" })}>품질 항목</button></div><div className="panel"><div className="panel-head"><div><h3>{type === "ENV" ? "환경 측정 항목" : "품질 측정 항목"}</h3><p className="panel-desc">체크된 항목만 데이터로 사용됩니다.</p></div><StatusBadge value={type} /></div><table><thead><tr><th>사용</th><th>그룹</th><th>항목명</th><th>값 유형</th><th>단위</th><th>기준 최소</th><th>기준 최대</th><th>경고 이탈률</th></tr></thead><tbody>{rows.map((row) => <tr key={row.itemCode}><td><input className="checkbox-input" type="checkbox" checked={row.useYn === "Y"} disabled={!isAdmin} onChange={(e) => updateRow(row.itemCode, "useYn", e.target.checked ? "Y" : "N")} /></td><td>{groupLabel[row.itemGroup] || row.itemGroup}</td><td><strong>{row.itemName}</strong><small className="table-sub">{row.itemCode}</small></td><td>{row.valueType}</td><td>{row.unit}</td><td><input className="mini-input" value={row.min ?? ""} disabled={!isAdmin || row.valueType !== "NUMBER"} onChange={(e) => updateRow(row.itemCode, "min", e.target.value)} /></td><td><input className="mini-input" value={row.max ?? ""} disabled={!isAdmin || row.valueType !== "NUMBER"} onChange={(e) => updateRow(row.itemCode, "max", e.target.value)} /></td><td><input className="mini-input" value={row.failRate ?? ""} disabled={!isAdmin || row.valueType !== "NUMBER"} onChange={(e) => updateRow(row.itemCode, "failRate", e.target.value)} /></td></tr>)}</tbody></table></div>{savedAt && <div className="notice-box">측정 항목 설정이 저장되었습니다. 저장 시각: {savedAt}</div>}</div>;
}
