# 부적합 이력 관리 업데이트 v6

## 환경 부적합 해결 기준

환경 부적합은 단순히 작업자가 조치 메모를 등록했다고 바로 해결 처리하지 않는다.

다음 조건을 만족하면 해결 처리한다.

```text
1. 시뮬레이터가 다음 환경 데이터를 생성한다.
2. 해당 배치/구역의 환경 데이터가 기준값과 비교된다.
3. 종합 환경 판정이 NORMAL이다.
4. 이전 OPEN 또는 IN_PROGRESS 상태의 환경 부적합을 RESOLVED 처리한다.
5. resolved_env_log_id에 정상 판정을 받은 환경 로그 ID를 저장한다.
6. resolved_at에 해결 시각을 저장한다.
```

## 작업자 조치와 자동 해결의 차이

작업자 조치:

```text
ENV_ACTION_LOG에 조치 내용을 기록한다.
부적합 상태는 ACKNOWLEDGED 또는 IN_PROGRESS가 될 수 있다.
```

시뮬레이터 NORMAL 판정:

```text
ENV_NONCONFORMITY 상태를 RESOLVED로 변경한다.
정상 복귀가 확인된 환경 로그를 resolved_env_log_id로 연결한다.
```

## 백엔드 처리 위치

추천 처리 위치:

```text
EnvironmentSimulationService
  ↓
EnvironmentEvaluationService
  ↓
EnvNonconformityService.resolveIfNormal(...)
```

시뮬레이터 데이터 생성 API 또는 스케줄러가 환경 로그를 생성한 뒤, 평가 결과가 NORMAL이면 미해결 환경 부적합을 찾아 해결 처리한다.
