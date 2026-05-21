// 기존 localStorage 동기화 계층은 DB 직접 조회 방식으로 전환되면서 사용하지 않습니다.
export async function syncGreenqData() {
  return true;
}

export function clearGreenqRuntimeCache() {
  // no-op: 업무 데이터 캐시는 localStorage에 저장하지 않습니다.
}
