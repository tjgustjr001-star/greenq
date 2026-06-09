import EmptyState from "../EmptyState.jsx";
import SimulationZoneCard from "./SimulationZoneCard.jsx";

export default function SimulationStage({ targets, onSaveTarget, savingTargetId }) {
  if (!targets.length) {
    return (
      <div className="panel simulation-stage">
        <EmptyState title="시뮬레이션 가능한 운영중 배치가 없습니다." description="GROWING 상태의 배치가 등록되면 환경 시뮬레이션을 실행할 수 있습니다." />
      </div>
    );
  }

  return (
    <div className="panel simulation-stage">
      <div className="simulation-stage-grid">
        {targets.map((target) => (
          <SimulationZoneCard
            key={target.id}
            target={target}
            onSave={onSaveTarget}
            saving={savingTargetId === target.id}
          />
        ))}
      </div>
    </div>
  );
}
