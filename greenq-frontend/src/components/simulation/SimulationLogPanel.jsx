import StatusBadge from "../StatusBadge.jsx";

export default function SimulationLogPanel({ logs }) {
  return (
    <div className="panel simulation-log-panel">
      <div className="panel-head compact">
        <h3>이벤트 로그</h3>
        <p>최근 {logs.length}건</p>
      </div>
      {logs.length === 0 ? (
        <p className="muted-text">아직 기록된 이벤트가 없습니다.</p>
      ) : (
        <div className="simulation-log-list">
          {logs.map((log) => (
            <div key={log.id} className="simulation-log-row">
              <span>{log.time}</span>
              <strong>{log.zoneName}</strong>
              <em>{log.itemName}</em>
              <StatusBadge value={log.status} />
              <p>{log.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
