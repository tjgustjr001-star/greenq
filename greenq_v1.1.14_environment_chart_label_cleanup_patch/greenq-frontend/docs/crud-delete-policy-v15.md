# GreenQ CRUD / 삭제 정책 / 자료사전 업데이트 v15

## 1. 운영 데이터 누적 방지 원칙

실제 서비스에서는 작물, 구역, 배치, 실측, 부적합 이력, 리포트 데이터가 계속 누적된다.
따라서 각 업무 화면은 조회뿐 아니라 요구사항에 맞는 생성, 수정, 삭제 흐름을 가져야 한다.

다만 모든 데이터를 자유롭게 수정하면 업무 이력이 깨질 수 있으므로 다음 기준을 적용한다.

---

## 2. 수정 가능 / 의도적 수정 제한 기준

| 데이터 | 생성 | 수정 | 삭제 | 비고 |
|---|---:|---:|---:|---|
| 작물 | 가능 | 가능 | 임시 삭제 | 기준값/배치에 영향 가능 |
| 기준 항목 설정 | 가능 | 가능 | 항목 미사용 처리 | 삭제보다 use_yn 변경 권장 |
| 구역 | 가능 | 가능 | 임시 삭제 | 배치와 연결될 수 있음 |
| 배치 | 가능 | 가능 | 임시 삭제 | 환경/실측/리포트와 연결됨 |
| 환경 로그 | 시뮬레이터 생성 | 수정 제한 | 즉시 영구 삭제 가능 | 잘못 생성된 시뮬레이터 로그는 삭제 가능 |
| 실측 | 가능 | 제한적 수정 또는 재등록 | 임시 삭제 | 품질 판정 근거 |
| 부적합 이력 | 자동 생성/기록 | 상태/조치 이력 수정 | 임시 삭제 | 감사/추적성 중요 |
| 리포트 | 가능 | 수정 제한 | 임시 삭제 | 스냅샷 성격 |

수정 기능을 의도적으로 제한할 데이터:

```text
환경 로그 원본값
판정 당시 기준 스냅샷
리포트 발급 후 스냅샷 원본
부적합 발생 당시 측정값/기준값
```

이 데이터는 수정 대신 재생성, 재발급, 조치 기록 추가 방식으로 관리한다.

---

## 3. 삭제 정책

### 3.1 임시 삭제 / 휴지통 / 복원 / 영구 삭제

중요 데이터는 삭제 시 바로 제거하지 않고 휴지통으로 이동한다.

대상:

```text
CROP
ZONE
CULTIVATION_BATCH
GROWTH_MEASUREMENT
ENV_NONCONFORMITY
QUALITY_NONCONFORMITY
REPORT
```

정책:

```text
1. 최초 삭제 시 delete_yn = 'Y'
2. deleted_at 저장
3. 리스트 조회에서는 delete_yn = 'N'만 조회
4. 휴지통 화면에서 7일간 보관
5. 7일 이내 복원 가능
6. 7일 경과 시 영구 삭제 가능
```

### 3.2 즉시 영구 삭제

삭제해도 업무 이력에 치명적이지 않은 데이터는 경고 후 즉시 삭제할 수 있다.

대상 예시:

```text
잘못 생성된 시뮬레이터 환경 로그
사용자 입력 중 임시 행
```

단, 실제 운영에서는 환경 로그도 감사 대상이 될 수 있으므로 운영 정책에 따라 임시 삭제로 바꿀 수 있다.

---

## 4. 자료사전 공통 컬럼 추가 권장

아래 컬럼은 주요 업무 테이블에 공통 추가를 권장한다.

| 업무 카테고리 | 테이블명 | 컬럼명 | 한글명 | 도메인/설명 | 타입 | 키 | NullAble | 기본값 |
|---|---|---|---|---|---|---|---|---|
| 공통 | 주요 업무 테이블 | delete_yn | 삭제 여부 | Y/N, 리스트 조회 제외 여부 | CHAR(1) |  | N | N |
| 공통 | 주요 업무 테이블 | deleted_at | 삭제 일시 | 임시 삭제 처리 일시 | DATETIME |  | Y |  |
| 공통 | 주요 업무 테이블 | deleted_by | 삭제자 | 삭제 처리 사용자 ID | BIGINT | FK | Y |  |
| 공통 | 주요 업무 테이블 | delete_reason | 삭제 사유 | 사용자가 입력한 삭제 사유 | VARCHAR(500) |  | Y |  |
| 공통 | 주요 업무 테이블 | restored_at | 복원 일시 | 휴지통에서 복원한 일시 | DATETIME |  | Y |  |
| 공통 | 주요 업무 테이블 | restored_by | 복원자 | 복원 처리 사용자 ID | BIGINT | FK | Y |  |
| 공통 | 주요 업무 테이블 | created_at | 생성일시 | 데이터 생성 일시 | DATETIME |  | N | CURRENT_TIMESTAMP |
| 공통 | 주요 업무 테이블 | updated_at | 수정일시 | 데이터 수정 일시 | DATETIME |  | Y | ON UPDATE CURRENT_TIMESTAMP |

적용 권장 테이블:

```text
CROP
STANDARD_SET
STANDARD_ITEM
ZONE
CULTIVATION_BATCH
GROWTH_MEASUREMENT
GROWTH_MEASUREMENT_SAMPLE
ENV_NONCONFORMITY
QUALITY_NONCONFORMITY
REPORT
```

---

## 5. 휴지통 조회 SQL 개념

휴지통을 별도 테이블로 만들 수도 있고, 각 테이블의 delete_yn을 조회해 통합 화면을 구성할 수도 있다.

단순 구현:

```sql
SELECT 'CROP' AS entity_type, crop_id AS entity_id, crop_name AS display_name, deleted_at
FROM crop
WHERE delete_yn = 'Y'

UNION ALL

SELECT 'ZONE' AS entity_type, zone_id AS entity_id, zone_name AS display_name, deleted_at
FROM zone
WHERE delete_yn = 'Y';
```

확장 구현:

```text
TRASH_ITEM 테이블을 별도로 두고 entity_type, entity_id, deleted_at, purge_after_at을 관리
```

개인 프로젝트에서는 공통 컬럼 방식이 더 단순하다.

---

## 6. 백엔드 구현 메모

삭제 API 예시:

```text
DELETE /api/crops/{cropId}
→ delete_yn = 'Y', deleted_at 저장

POST /api/trash/{entityType}/{entityId}/restore
→ delete_yn = 'N', restored_at 저장

DELETE /api/trash/{entityType}/{entityId}/permanent
→ 실제 DELETE 실행
```

7일 경과 영구 삭제:

```text
@Scheduled(cron = "0 0 3 * * *")
TrashPurgeScheduler.purgeExpired()
```

조회 API는 기본적으로 delete_yn = 'N' 조건을 적용한다.
