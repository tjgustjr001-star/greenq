import { Play, RotateCcw, Save, Shuffle, Square, Wand2 } from "lucide-react";

export default function SimulationControlPanel({
  running,
  disabled,
  onStart,
  onStop,
  onReset,
  onRandomAbnormal,
  onNormalize,
  onSaveAll,
  saving,
}) {
  return (
    <aside className="panel simulation-control-panel">
      <div className="panel-head compact">
        <h3>제어 패널</h3>
        <p>{running ? "시뮬레이션 실행 중" : "대기 중"}</p>
      </div>
      <div className="simulation-control-actions">
        <button type="button" className="primary-button" onClick={onStart} disabled={disabled || running}><Play size={16} />시작</button>
        <button type="button" className="secondary-button" onClick={onStop} disabled={disabled || !running}><Square size={16} />정지</button>
        <button type="button" className="secondary-button" onClick={onReset} disabled={disabled}><RotateCcw size={16} />초기화</button>
        <button type="button" className="secondary-button" onClick={onRandomAbnormal} disabled={disabled}><Shuffle size={16} />랜덤 이상 발생</button>
        <button type="button" className="secondary-button" onClick={onNormalize} disabled={disabled}><Wand2 size={16} />정상화</button>
        <button type="button" className="primary-button" onClick={onSaveAll} disabled={disabled || saving}><Save size={16} />{saving ? "저장 중" : "현재 상태 저장"}</button>
      </div>
    </aside>
  );
}
