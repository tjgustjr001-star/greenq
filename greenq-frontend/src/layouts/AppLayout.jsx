import { Activity, AlertTriangle, BarChart3, Bell, ClipboardCheck, Home, Layers3, Leaf, LogOut, Map, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { greenqApi } from "../api/greenqApi.js";
import { alertStatusLabel, issueStatusLabel, labelOf } from "../data/displayLabels.js";
import { clearCurrentUser, defaultPathForRole, getCurrentUser } from "../utils/auth.js";

const menus = [
  { label: "대시보드", path: "/dashboard", match: "/dashboard", icon: Home, roles: ["ADMIN"] },
  { label: "작업자 홈", path: "/worker", match: "/worker", icon: ClipboardCheck, roles: ["WORKER"] },
  { label: "작물/기준 관리", path: "/crops", match: "/crops", icon: Leaf, roles: ["ADMIN"] },
  { label: "구역/배치 관리", path: "/zones", match: "/zones", icon: Map, roles: ["ADMIN"] },
  { label: "환경 모니터링", path: "/environment", match: "/environment", icon: Activity, roles: ["ADMIN", "WORKER"] },
  { label: "실측/품질 관리", path: "/quality", match: "/quality", icon: ClipboardCheck, roles: ["ADMIN", "WORKER"] },
  { label: "부적합 이력", path: "/issues", match: "/issues", icon: AlertTriangle, roles: ["ADMIN", "WORKER"] },
  { label: "리포트", path: "/reports", match: "/reports", icon: BarChart3, roles: ["ADMIN"] },
  { label: "사용자 관리", path: "/users", match: "/users", icon: Users, roles: ["ADMIN"] },
  { label: "삭제 데이터 관리", path: "/deleted-data", match: "/deleted-data", icon: Trash2, roles: ["ADMIN"] },
];

function normalizeIssueType(type) {
  return String(type || "").toLowerCase() === "quality" ? "quality" : "env";
}

function currentUserId(user) {
  return user?.userId || user?.id || null;
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const role = user.role || user.roleCode || "WORKER";
  const roleLabel = labelOf(role);
  const userName = user.name || user.userName || "사용자";
  const showRoleChip = userName !== roleLabel;
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const refreshAlerts = useCallback(() => {
    return greenqApi.envAlerts({ status: "UNREAD" })
      .then((rows) => setAlerts(rows || []))
      .catch(() => setAlerts([]));
  }, []);

  useEffect(() => {
    refreshAlerts();
  }, [refreshAlerts, location.pathname]);

  useEffect(() => {
    const timer = window.setInterval(refreshAlerts, 10000);
    window.addEventListener("greenq:env-alerts-refresh", refreshAlerts);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("greenq:env-alerts-refresh", refreshAlerts);
    };
  }, [refreshAlerts]);

  const handleLogout = () => {
    clearCurrentUser();
    setNotificationOpen(false);
    navigate("/login", { replace: true });
  };

  const openAlert = async (alert) => {
    try {
      if (alert.alertId) {
        await greenqApi.markEnvAlertRead(alert.alertId, { userId: currentUserId(user) });
      }
    } finally {
      setNotificationOpen(false);
      const rawId = alert.rawId || alert.envNcId || String(alert.issueId).replace(/^(ENV|QLT)-/i, "");
      navigate(`/issues/${normalizeIssueType(alert.issueType)}/${rawId}`);
      await refreshAlerts();
      window.dispatchEvent(new CustomEvent("greenq:env-alerts-refresh"));
    }
  };

  const hideAlert = async (event, alert) => {
    event.stopPropagation();
    if (!alert.alertId) return;
    await greenqApi.closeEnvAlert(alert.alertId, { userId: currentUserId(user) });
    await refreshAlerts();
    window.dispatchEvent(new CustomEvent("greenq:env-alerts-refresh"));
  };

  const visibleMenus = menus.filter((menu) => (menu.roles || []).includes(role));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" type="button" onClick={() => navigate(defaultPathForRole(role))}>
          <div className="brand-mark">GQ</div><div><h1>GreenQ</h1><p>품질관리 시스템</p></div>
        </button>
        <nav className="side-nav">
          {visibleMenus.map((menu) => {
            const Icon = menu.icon;
            const active = location.pathname.startsWith(menu.match);
            return <Link key={menu.path} to={menu.path} className={`nav-item ${active ? "active" : ""}`} title={menu.label}><Icon size={18} /><span>{menu.label}</span></Link>;
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="mini-card"><Layers3 size={18} /><div><strong>GreenQ</strong><p>환경·품질 통합 관리</p></div></div>
          <button type="button" className="logout-button" onClick={handleLogout}><LogOut size={17} /><span>로그아웃</span></button>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div><p className="eyebrow">현재 로그인</p><strong>{userName}</strong>{showRoleChip && <span className={`role-chip ${role === "ADMIN" ? "admin" : "worker"}`}>{roleLabel}</span>}</div>
          <div className="topbar-actions">
            <button type="button" className={`notification-button ${notificationOpen ? "active" : ""}`} onClick={() => setNotificationOpen((prev) => !prev)} title="환경 알림">
              <Bell size={18} /><span>알림</span>{alerts.length > 0 && <em>{alerts.length}</em>}
            </button>
            {notificationOpen && (
              <div className="notification-preview open">
                <div className="notification-preview-head"><strong>환경 알림</strong><button type="button" onClick={() => navigate("/issues?type=env")}>전체 보기</button></div>
                {alerts.length === 0 ? <p className="notification-empty">확인할 환경 부적합 알림이 없습니다.</p> : alerts.slice(0, 4).map((alert) => (
                  <button key={`alert-${alert.alertId}`} type="button" className="notification-preview-item" onClick={() => openAlert(alert)}>
                    <span>{alert.zoneName} · {alert.itemName}</span>
                    <small>{labelOf(alert.alertLevel || alert.severity)} / {issueStatusLabel("env", alert.status)} / {alertStatusLabel(alert.alertStatus)}</small>
                    <small>{alert.alertMessage}</small>
                    <em role="button" tabIndex={-1} onClick={(event) => hideAlert(event, alert)}>알림 제외</em>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </section>
    </div>
  );
}
