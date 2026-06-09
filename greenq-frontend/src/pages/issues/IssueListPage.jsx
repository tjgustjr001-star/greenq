import { useNavigate, useSearchParams } from "react-router-dom";

import { greenqApi } from "../../api/greenqApi.js";
import ActionMenu from "../../components/ActionMenu.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { issueStatusLabel, issueStatusShortLabel } from "../../data/displayLabels.js";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";
import { formatNumber, formatNumberText } from "../../utils/numberFormat.js";

function normalizeIssueType(value) {
  return String(value || "").toLowerCase() === "quality" ? "quality" : "env";
}

function getIssueRawId(issue) {
  return issue.rawId || String(issue.issueId || "").replace(/^(ENV|QLT)-/i, "");
}

function formatListDateTime(value) {
  if (!value) return { short: "-", full: "-" };

  const full = String(value);
  const normalized = full.replace("T", " ");
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})[^\d]?(\d{2})?:?(\d{2})?:?(\d{2})?/);
  if (!match) return { short: full, full };

  const [, year, month, day, hour, minute, second] = match;
  if (!hour) return { short: `${year}-${month}-${day}`, full };

  return {
    short: `${year}-${month}-${day}\n${hour}:${minute || "00"}${second ? `:${second}` : ""}`,
    full,
  };
}

function renderIssueStatus(issue) {
  if (issue.issueType !== "quality") return <StatusBadge value={issue.status} />;

  const status = String(issue.status || "").toUpperCase();
  return (
    <StatusBadge
      value={status}
      label={issueStatusShortLabel("quality", status)}
      title={issueStatusLabel("quality", status)}
      className={`quality-status-badge quality-status-${status.toLowerCase()}`}
    />
  );
}

function renderAlertStatus(issue) {
  if (issue.issueType !== "env") return <span className="issue-alert-muted">-</span>;

  const unread = Number(issue.unreadAlertCount ?? issue.alertUnreadCount ?? 0);
  const read = Number(issue.readAlertCount ?? issue.alertReadCount ?? 0);
  const active = Number(issue.activeAlertCount ?? issue.alertActiveCount ?? 0);
  const closed = Number(issue.closedAlertCount ?? issue.alertClosedCount ?? 0);
  const status = String(issue.alertStatus || issue.envAlertStatus || "").toUpperCase();

  if (unread > 0 || status === "UNREAD") {
    return <span className="issue-alert-chip unread">미확인</span>;
  }

  if (read > 0 || status === "READ" || (active > 0 && closed === 0)) {
    return <span className="issue-alert-chip read">확인됨</span>;
  }

  if (closed > 0 || status === "CLOSED") {
    return <span className="issue-alert-chip closed">닫힘</span>;
  }

  return <span className="issue-alert-muted">-</span>;
}

export default function IssueListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentUser = getCurrentUser();
  const isAdmin = (currentUser.role || currentUser.roleCode) === "ADMIN";

  const type = searchParams.get("type") || "all";
  const batchId = searchParams.get("batchId");

  const { data, loading, error, reload } = useApiData(
    () => greenqApi.issues(),
    []
  );

  const issueRows = asArray(data).map((issue) => ({
    ...issue,
    issueType: normalizeIssueType(issue.issueType),
  }));

  const rows = issueRows.filter((issue) => {
    const matchesType = type === "all" || issue.issueType === type;
    const matchesBatch = !batchId || String(issue.batchId || "") === String(batchId);
    return matchesType && matchesBatch;
  });

  const handleTab = (nextType) => {
    setSearchParams(nextType === "all" ? {} : { type: nextType });
  };

  const handleDeleteIssue = async (issue) => {
    if (!window.confirm("부적합 이력을 임시 삭제 처리합니다.")) return;
    await greenqApi.deleteIssue(issue.issueType, getIssueRawId(issue));
    await reload();
  };

  const goToDetail = (issue) => {
    navigate(`/issues/${issue.issueType}/${getIssueRawId(issue)}`);
  };

  const getActionItems = (issue) =>
    [
      {
        label: "상세 보기",
        kind: "detail",
        onClick: () => goToDetail(issue),
      },
      isAdmin && {
        label: "삭제",
        kind: "delete",
        danger: true,
        onClick: () => handleDeleteIssue(issue),
      },
    ].filter(Boolean);

  if (loading) {
    return (
      <div className="panel">
        <p className="muted-text">부적합 이력을 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Nonconformity"
        title="부적합 이력"
        description="환경 부적합과 품질 부적합을 통합 조회합니다."
      />

      {error && <div className="notice-box">{error}</div>}

      <div className="tab-row">
        <button className={type === "all" ? "active" : ""} onClick={() => handleTab("all")}>
          전체
        </button>
        <button className={type === "env" ? "active" : ""} onClick={() => handleTab("env")}>
          환경 부적합
        </button>
        <button className={type === "quality" ? "active" : ""} onClick={() => handleTab("quality")}>
          품질 부적합
        </button>
      </div>

      <div className="panel table-panel issue-list-panel">
        <table className="data-table issue-list-table">
          <colgroup>
            <col className="col-date" />
            <col className="col-type" />
            <col className="col-zone" />
            <col className="col-batch" />
            <col className="col-item" />
            <col className="col-measure" />
            <col className="col-severity" />
            <col className="col-issue-state" />
            <col className="col-alert" />
            <col className="col-action" />
          </colgroup>

          <thead>
            <tr>
              <th>발생일시</th>
              <th>유형</th>
              <th>구역</th>
              <th>배치</th>
              <th>항목</th>
              <th>측정·기준</th>
              <th>심각도</th>
              <th>상태</th>
              <th>알림</th>
              <th>관리</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((issue) => {
              const occurredAt = formatListDateTime(issue.occurredAt);
              const measuredValue = formatNumber(issue.measuredValue);
              const standardRange = formatNumberText(issue.standardRange);

              return (
                <tr key={`${issue.issueType}-${issue.issueId}`}>
                  <td title={occurredAt.full}>
                    <span className="issue-date-cell">{occurredAt.short}</span>
                  </td>
                  <td>{issue.issueType === "env" ? "환경" : "품질"}</td>
                  <td>{issue.zoneName || "-"}</td>
                  <td className="text-left">
                    <button
                      className="link-cell issue-batch-link"
                      title={issue.batchName || "-"}
                      onClick={() => goToDetail(issue)}
                    >
                      <strong>{issue.batchName || "-"}</strong>
                    </button>
                  </td>
                  <td>
                    <strong>{issue.itemName || "-"}</strong>
                  </td>
                  <td>
                    <div className="issue-measure-cell">
                      <strong>{measuredValue}</strong>
                      <span>기준 {standardRange}</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge value={issue.severity} />
                  </td>
                  <td>{renderIssueStatus(issue)}</td>
                  <td>{renderAlertStatus(issue)}</td>
                  <td>
                    <ActionMenu items={getActionItems(issue)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
