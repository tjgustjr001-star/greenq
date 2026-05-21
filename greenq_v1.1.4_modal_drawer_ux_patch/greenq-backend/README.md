# GreenQ Backend

React `greenq-frontend-v21`과 연동하기 위한 Spring Boot + JPA + MariaDB 백엔드 프로젝트입니다.

## 개발 환경

- Java 17
- Spring Boot 3.5.13
- Gradle
- MariaDB
- DB 이름: `greenq`
- DB 사용자: `testuser`
- DB 비밀번호: `KaKAS2kO`
- 서버 포트: `8081`

## 실행 순서

### 1. MariaDB 데이터베이스/테이블/더미 데이터 생성

`src/main/resources/db` 폴더 안의 SQL을 순서대로 실행합니다.

```sql
-- 1번
source greenq_schema_v1_0_3.sql;

-- 2번
source greenq_dummy_data_v1_0_3.sql;
```

또는 HeidiSQL / DBeaver / IntelliJ Database 창에서 파일을 열어 순서대로 실행합니다.

### 2. DB 포트 확인

`src/main/resources/application.properties` 기본값은 `localhost:3307`입니다.

MariaDB가 기본 포트라면 아래처럼 바꿉니다.

```properties
spring.datasource.url=jdbc:mariadb://localhost:3306/greenq?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=Asia/Seoul
```

### 3. IntelliJ에서 실행

1. IntelliJ IDEA 실행
2. `Open`으로 `greenq-backend` 폴더 선택
3. Gradle Import 완료 대기
4. `GreenqBackendApplication` 실행
5. 브라우저 또는 Postman에서 확인

```text
GET http://localhost:8081/api/health
```

## 로그인 테스트 계정

더미 데이터 기준 비밀번호는 모두 `password`입니다.

| loginId | password | role |
|---|---|---|
| admin | password | ADMIN |
| worker01 | password | WORKER |
| worker02 | password | WORKER |

로그인 API:

```http
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
  "loginId": "admin",
  "password": "password"
}
```

## 주요 API

| 기능 | Method | URL |
|---|---:|---|
| 상태 확인 | GET | `/api/health` |
| 로그인 | POST | `/api/auth/login` |
| 대시보드 | GET | `/api/dashboard` |
| 사용자 목록 | GET | `/api/users` |
| 측정 항목 마스터 | GET | `/api/measurement-items` |
| 작물 목록 | GET | `/api/crops` |
| 작물 상세 | GET | `/api/crops/{cropId}` |
| 작물 등록 | POST | `/api/crops` |
| 작물 수정 | PUT | `/api/crops/{cropId}` |
| 작물 임시 삭제 | DELETE | `/api/crops/{cropId}` |
| 구역 목록 | GET | `/api/zones` |
| 구역 상세 | GET | `/api/zones/{zoneId}` |
| 구역 등록 | POST | `/api/zones` |
| 구역 수정 | PUT | `/api/zones/{zoneId}` |
| 구역 임시 삭제 | DELETE | `/api/zones/{zoneId}` |
| 배치 목록 | GET | `/api/batches` |
| 배치 상세 | GET | `/api/batches/{batchId}` |
| 배치 등록 | POST | `/api/batches` |
| 배치 수정 | PUT | `/api/batches/{batchId}` |
| 배치 임시 삭제 | DELETE | `/api/batches/{batchId}` |
| 환경 로그 목록 | GET | `/api/environment-logs` |
| 환경 로그 상세 | GET | `/api/environment-logs/{envLogId}` |
| 부적합 통합 목록 | GET | `/api/issues` |
| 부적합 상세 | GET | `/api/issues/{issueId}` |
| 환경 조치 이력 | GET | `/api/issues/env/{envNcId}/actions` |
| 환경 조치 등록 | POST | `/api/issues/env/{envNcId}/actions` |
| 실측 목록 | GET | `/api/measurements` |
| 실측 상세 | GET | `/api/measurements/{measurementId}` |
| 실측 등록 | POST | `/api/measurements` |
| 리포트 목록 | GET | `/api/reports` |
| 리포트 상세 | GET | `/api/reports/{reportId}` |
| 리포트 생성 | POST | `/api/reports` |

## 현재 구현 범위

이 백엔드는 프론트 연동 1차용입니다.

- 기존 더미 SQL의 실제 DB 데이터 조회 가능
- React mockData 필드명과 비슷한 camelCase 응답 제공
- 목록/상세 조회 중심 구현
- 작물/구역/배치 기본 등록·수정·임시삭제 제공
- 환경 부적합 조치 이력 등록 제공
- 실측/리포트 등록 기본 제공
- JWT/세션 인증은 아직 붙이지 않고, 로그인 응답만 제공합니다.

추후 프론트의 `mockData.js`, `localData.js`를 API 호출로 교체하면 됩니다.

## v1.1 수정 사항

- 로그인 시 `loginId` 앞뒤 공백을 제거합니다.
- BCrypt 해시 검증 실패 시에도 개발용 기본 계정(`admin`, `worker01`, `worker02`)은 `password`로 로그인할 수 있도록 안전장치를 추가했습니다.
- 기존 DB 더미 해시가 꼬였거나 평문 더미가 섞여 있어도 프론트 연동 테스트가 가능하도록 보완했습니다.
