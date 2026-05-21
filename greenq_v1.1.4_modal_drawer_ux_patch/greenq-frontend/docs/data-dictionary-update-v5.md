# 자료사전 업데이트 제안 v5

## 변경 사유

기존 기획은 `GROWTH_MEASUREMENT`에 샘플 5개의 평균값 또는 대표값만 저장하는 단순 구조였다.

하지만 프론트 2차 고도화에서 `+` 버튼으로 샘플 수를 늘리고, 각 샘플의 초장/엽폭/엽장/생체중/엽색/생장단계/특이사항을 각각 저장하는 흐름으로 변경되었다.

따라서 샘플별 원시 데이터를 보존하기 위한 하위 테이블이 필요하다.

---

## 신규 테이블

| 업무 카테고리 | 테이블명 | 컬럼명 | 한글명 | 도메인/설명 | 타입 | 키 | NullAble | 기본값 |
|---|---|---|---|---|---|---|---|---|
| 실측/품질 관리 | GROWTH_MEASUREMENT_SAMPLE | sample_id | 샘플 ID | 샘플 식별자 | BIGINT | PK | N | AUTO_INCREMENT |
| 실측/품질 관리 | GROWTH_MEASUREMENT_SAMPLE | measurement_id | 실측 ID | GROWTH_MEASUREMENT 참조 | BIGINT | FK | N |  |
| 실측/품질 관리 | GROWTH_MEASUREMENT_SAMPLE | sample_no | 샘플 번호 | 1, 2, 3... | INT |  | N |  |
| 실측/품질 관리 | GROWTH_MEASUREMENT_SAMPLE | plant_height | 초장 | cm | DECIMAL(6,2) |  | Y |  |
| 실측/품질 관리 | GROWTH_MEASUREMENT_SAMPLE | leaf_width | 엽폭 | cm | DECIMAL(6,2) |  | Y |  |
| 실측/품질 관리 | GROWTH_MEASUREMENT_SAMPLE | leaf_length | 엽장 | cm | DECIMAL(6,2) |  | Y |  |
| 실측/품질 관리 | GROWTH_MEASUREMENT_SAMPLE | fresh_weight | 생체중 | g | DECIMAL(8,2) |  | Y |  |
| 실측/품질 관리 | GROWTH_MEASUREMENT_SAMPLE | leaf_color | 엽색 | 진녹색, 연녹색, 황화 등 | VARCHAR(50) |  | Y |  |
| 실측/품질 관리 | GROWTH_MEASUREMENT_SAMPLE | growth_stage | 생장단계 | GERMINATION, GROWING, HARVEST 등 | VARCHAR(50) |  | Y |  |
| 실측/품질 관리 | GROWTH_MEASUREMENT_SAMPLE | special_note | 특이사항 | 샘플별 메모 | TEXT |  | Y |  |
| 실측/품질 관리 | GROWTH_MEASUREMENT_SAMPLE | created_at | 생성일시 | 등록 일시 | DATETIME |  | N | CURRENT_TIMESTAMP |
| 실측/품질 관리 | GROWTH_MEASUREMENT_SAMPLE | updated_at | 수정일시 | 수정 일시 | DATETIME |  | Y | ON UPDATE CURRENT_TIMESTAMP |

---

## 기존 테이블 유지 방향

`GROWTH_MEASUREMENT`는 삭제하지 않는다.

이 테이블은 샘플 묶음의 헤더이면서, 화면 목록/판정/리포트에 사용할 평균값 또는 대표값 캐시를 가진다.

예시:

- sample_count: 샘플 개수
- plant_height: 샘플 평균 초장
- leaf_width: 샘플 평균 엽폭
- leaf_length: 샘플 평균 엽장
- fresh_weight: 샘플 평균 생체중
- leaf_color: 대표 엽색 또는 최빈값
- growth_stage: 대표 생장단계
- quality_status: 품질 판정 요약

---

## JPA 관계 권장

```java
@Entity
public class GrowthMeasurement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long measurementId;

    @OneToMany(mappedBy = "measurement", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GrowthMeasurementSample> samples = new ArrayList<>();
}
```

다만 초반 구현에서는 양방향 매핑이 부담되면 `GrowthMeasurementSample`에 `measurementId`만 두고 Repository로 조회해도 된다.

---

## 처리 흐름

```text
실측 등록
  ↓
GROWTH_MEASUREMENT 생성
  ↓
GROWTH_MEASUREMENT_SAMPLE N건 저장
  ↓
샘플별 값으로 평균/대표값 계산
  ↓
GROWTH_MEASUREMENT 평균/대표값 업데이트
  ↓
품질 기준과 비교
  ↓
QUALITY_EVALUATION / QUALITY_EVALUATION_ITEM 생성
  ↓
필요 시 QUALITY_NONCONFORMITY 생성
```
