-- GreenQ 식물공장 환경 + 품질관리 시스템
-- MariaDB DDL
-- 기준: 03_자료사전_GreenQ_v1.0.3.xlsx + 2026-05-08 기획 내용
-- 주의: JPA 프로젝트 기준으로 작성한 기본 DDL입니다. 운영 전에는 실제 MariaDB 버전에 맞춰 CHECK/COMMENT/INDEX 정책을 재검토하세요.

CREATE DATABASE IF NOT EXISTS `greenq`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `greenq`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `user_account`;

CREATE TABLE `user_account` (
  `account_status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '계정 상태 / ACTIVE, INACTIVE, LOCKED',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 등록 일시',
  `email` VARCHAR(100) NULL COMMENT '이메일 / 선택 입력',
  `login_id` VARCHAR(50) NOT NULL COMMENT '로그인 ID / 로그인 계정. 중복 불가',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '비밀번호 해시 / BCrypt 등 암호화된 비밀번호',
  `phone` VARCHAR(30) NULL COMMENT '연락처 / 선택 입력',
  `role_code` VARCHAR(20) NOT NULL DEFAULT 'WORKER' COMMENT '권한 코드 / ADMIN, WORKER. Java Enum 권장',
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시 / 수정 일시',
  `user_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '사용자 ID / 사용자 식별자',
  `user_name` VARCHAR(50) NOT NULL COMMENT '사용자명 / 사용자 이름',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_user_account_login_id` (`login_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자/권한 - USER_ACCOUNT';

DROP TABLE IF EXISTS `crop`;

CREATE TABLE `crop` (
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 등록 일시',
  `crop_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '작물 ID / 작물 식별자',
  `crop_name` VARCHAR(100) NOT NULL COMMENT '작물명 / 상추, 바질 등',
  `crop_status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '작물 상태 / ACTIVE, INACTIVE',
  `crop_type` VARCHAR(50) NULL DEFAULT 'LEAFY' COMMENT '작물 유형 / LEAFY, FRUIT, HERB, ETC',
  `delete_yn` CHAR(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부 / Y/N. Y이면 기본 목록 조회에서 제외. 복원 시 N으로 변경',
  `deleted_at` DATETIME NULL COMMENT '삭제일시 / 임시 삭제 처리 일시. 7일 경과 시 영구 삭제 대상. 복원 시 NULL',
  `description` TEXT NULL COMMENT '설명 / 작물 설명',
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시 / 수정 일시',
  `variety_name` VARCHAR(100) NULL COMMENT '품종명 / 청치마 등',
  PRIMARY KEY (`crop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='작물 기준 관리 - CROP';

DROP TABLE IF EXISTS `measurement_item_master`;

CREATE TABLE `measurement_item_master` (
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 등록 일시',
  `default_use_yn` CHAR(1) NOT NULL DEFAULT 'Y' COMMENT '기본 사용 여부 / 작물 기준 생성 시 기본 체크 여부 Y/N',
  `entity_field` VARCHAR(80) NULL COMMENT '엔티티 필드명 / JPA Entity의 필드명 참고값. 판정 로직은 Java Enum/switch로 처리',
  `item_code` VARCHAR(50) NOT NULL COMMENT '항목 코드 / TEMP, HUMIDITY, PH, EC, PLANT_HEIGHT 등. Java Enum과 1:1 매칭 권장',
  `item_group` VARCHAR(50) NULL COMMENT '항목 그룹 / AIR, LIGHT, NUTRIENT, GROWTH, QUALITY_TEXT',
  `item_name` VARCHAR(50) NOT NULL COMMENT '항목명 / 온도, 습도, pH, 초장 등',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '정렬 순서 / 화면 표시 순서',
  `standard_type` VARCHAR(20) NOT NULL COMMENT '기준 유형 / ENV, QUALITY',
  `unit` VARCHAR(30) NULL COMMENT '단위 / ℃, %, ppm, cm, g 등',
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시 / 수정 일시',
  `use_yn` CHAR(1) NOT NULL DEFAULT 'Y' COMMENT '마스터 사용 여부 / 항목 자체 사용 여부 Y/N',
  `value_type` VARCHAR(20) NOT NULL DEFAULT 'NUMBER' COMMENT '값 유형 / NUMBER, TEXT, CATEGORY',
  PRIMARY KEY (`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='작물 기준 관리 - MEASUREMENT_ITEM_MASTER';

DROP TABLE IF EXISTS `standard_set`;

CREATE TABLE `standard_set` (
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 등록 일시',
  `crop_id` BIGINT NOT NULL COMMENT '작물 ID / CROP 참조',
  `delete_yn` CHAR(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부 / Y/N. Y이면 기본 목록 조회에서 제외. 복원 시 N으로 변경',
  `deleted_at` DATETIME NULL COMMENT '삭제일시 / 임시 삭제 처리 일시. 7일 경과 시 영구 삭제 대상. 복원 시 NULL',
  `effective_end_date` DATE NULL COMMENT '적용 종료일 / NULL이면 현재 적용 중',
  `effective_start_date` DATE NOT NULL COMMENT '적용 시작일 / 기준 적용 시작일',
  `standard_name` VARCHAR(100) NULL COMMENT '기준명 / 예: 상추 환경 기준 2026-1',
  `standard_set_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '기준 묶음 ID / 기준 묶음 식별자',
  `standard_status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '기준 상태 / ACTIVE, INACTIVE',
  `standard_type` VARCHAR(20) NOT NULL COMMENT '기준 유형 / ENV, QUALITY',
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시 / 수정 일시',
  PRIMARY KEY (`standard_set_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='작물 기준 관리 - STANDARD_SET';

DROP TABLE IF EXISTS `standard_item`;

CREATE TABLE `standard_item` (
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 등록 일시',
  `delete_yn` CHAR(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부 / Y/N. Y이면 기본 목록 조회에서 제외. 복원 시 N으로 변경',
  `deleted_at` DATETIME NULL COMMENT '삭제일시 / 임시 삭제 처리 일시. 7일 경과 시 영구 삭제 대상. 복원 시 NULL',
  `expected_text_value` VARCHAR(100) NULL COMMENT '기대 문자값 / 엽색/생장단계 등 문자형 기준값',
  `fail_rate` DECIMAL(6,2) NULL DEFAULT 10.00 COMMENT '경고 이탈률 / 기준 이탈 후 FAIL 전환 기준 이탈률(%). 범위 밖 + fail_rate 미만은 CAUTION',
  `item_code` VARCHAR(50) NOT NULL COMMENT '항목 코드 / MEASUREMENT_ITEM_MASTER 참조',
  `item_group` VARCHAR(50) NULL COMMENT '항목 그룹 / AIR, LIGHT, NUTRIENT, GROWTH 등',
  `item_name` VARCHAR(50) NOT NULL COMMENT '항목명 / 기준 등록 당시 항목명 스냅샷',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '정렬 순서 / 화면 표시 순서',
  `standard_item_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '기준 항목 ID / 기준 항목 식별자',
  `standard_max` DECIMAL(10,2) NULL COMMENT '기준 최댓값 / 수치형 정상 범위 최댓값',
  `standard_min` DECIMAL(10,2) NULL COMMENT '기준 최솟값 / 수치형 정상 범위 최솟값',
  `standard_set_id` BIGINT NOT NULL COMMENT '기준 묶음 ID / STANDARD_SET 참조',
  `target_value` DECIMAL(10,2) NULL COMMENT '목표값 / 선택: 목표 중심 기준 필요 시 사용',
  `unit` VARCHAR(30) NULL COMMENT '단위 / ℃, %, ppm, cm, g 등',
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시 / 수정 일시',
  `use_yn` CHAR(1) NOT NULL DEFAULT 'Y' COMMENT '사용 여부 / Y인 항목만 프론트/판정/리포트에 사용. 삭제와 별개로 항목 사용 여부 제어',
  `value_type` VARCHAR(20) NOT NULL DEFAULT 'NUMBER' COMMENT '값 유형 / NUMBER, TEXT, CATEGORY',
  PRIMARY KEY (`standard_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='작물 기준 관리 - STANDARD_ITEM';

DROP TABLE IF EXISTS `zone`;

CREATE TABLE `zone` (
  `area_size` DECIMAL(8,2) NULL COMMENT '면적 / m²',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 등록 일시',
  `delete_yn` CHAR(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부 / Y/N. Y이면 기본 목록 조회에서 제외. 복원 시 N으로 변경',
  `deleted_at` DATETIME NULL COMMENT '삭제일시 / 임시 삭제 처리 일시. 7일 경과 시 영구 삭제 대상. 복원 시 NULL',
  `description` TEXT NULL COMMENT '설명 / 비고',
  `location_desc` VARCHAR(255) NULL COMMENT '위치 설명 / 1층 좌측 등',
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시 / 수정 일시',
  `zone_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '구역 ID / 구역 식별자',
  `zone_name` VARCHAR(100) NOT NULL COMMENT '구역명 / A구역 등',
  `zone_status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '구역 상태 / ACTIVE, INACTIVE, MAINTENANCE',
  PRIMARY KEY (`zone_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='재배 운영 관리 - ZONE';

DROP TABLE IF EXISTS `cultivation_batch`;

CREATE TABLE `cultivation_batch` (
  `actual_end_date` DATE NULL COMMENT '실제 종료일 / 종료일',
  `batch_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '배치 ID / 재배 배치 식별자',
  `batch_name` VARCHAR(100) NOT NULL COMMENT '배치명 / A구역 상추 1차 등',
  `batch_status` VARCHAR(20) NOT NULL DEFAULT 'PLANNED' COMMENT '배치 상태 / PLANNED, GROWING, HARVESTED, CLOSED',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 등록 일시',
  `created_by` BIGINT NOT NULL COMMENT '등록자 ID / USER_ACCOUNT 참조',
  `crop_id` BIGINT NOT NULL COMMENT '작물 ID / CROP 참조',
  `delete_yn` CHAR(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부 / Y/N. Y이면 기본 목록 조회에서 제외. 복원 시 N으로 변경',
  `deleted_at` DATETIME NULL COMMENT '삭제일시 / 임시 삭제 처리 일시. 7일 경과 시 영구 삭제 대상. 복원 시 NULL',
  `env_standard_set_id` BIGINT NOT NULL COMMENT '환경 기준 묶음 ID / 배치에 적용할 환경 STANDARD_SET 참조. 배치 생성 시 고정 권장',
  `expected_end_date` DATE NULL COMMENT '예정 종료일 / 예정일',
  `planted_quantity` INT NULL COMMENT '배치 수량 / 재배 수량',
  `quality_standard_set_id` BIGINT NOT NULL COMMENT '품질 기준 묶음 ID / 배치에 적용할 품질 STANDARD_SET 참조. 배치 생성 시 고정 권장',
  `start_date` DATE NOT NULL COMMENT '재배 시작일 / 시작일',
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시 / 수정 일시',
  `zone_id` BIGINT NOT NULL COMMENT '구역 ID / ZONE 참조',
  PRIMARY KEY (`batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='재배 운영 관리 - CULTIVATION_BATCH';

DROP TABLE IF EXISTS `environment_log`;

CREATE TABLE `environment_log` (
  `batch_id` BIGINT NOT NULL COMMENT '배치 ID / CULTIVATION_BATCH 참조',
  `co2` DECIMAL(8,2) NULL COMMENT 'CO2 / ppm',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 생성 일시',
  `data_source` VARCHAR(20) NOT NULL DEFAULT 'SIMULATOR' COMMENT '데이터 출처 / SENSOR, SIMULATOR, SIMULATOR_TEST, MANUAL. 원본값 수정 불가, 삭제 시 delete_yn=Y 처리',
  `delete_yn` CHAR(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부 / Y/N. Y이면 환경 모니터링 기본 목록 조회에서 제외. 복원 시 N으로 변경',
  `deleted_at` DATETIME NULL COMMENT '삭제일시 / 임시 삭제 처리 일시. 7일 경과 시 영구 삭제 대상. 복원 시 NULL',
  `ec` DECIMAL(5,2) NULL COMMENT 'EC / mS/cm',
  `env_log_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '환경 로그 ID / 환경 데이터 식별자',
  `env_status` VARCHAR(20) NOT NULL DEFAULT 'NORMAL' COMMENT '환경 종합 판정 / NORMAL, CAUTION, FAIL, MISSING. 항목별 판정 중 가장 심각한 상태',
  `humidity` DECIMAL(5,2) NULL COMMENT '습도 / %',
  `light_intensity` DECIMAL(10,2) NULL COMMENT '조도 / lux 또는 PPFD',
  `light_wavelength` VARCHAR(50) NULL COMMENT '광질/파장 / 450nm/660nm 등',
  `measured_at` DATETIME NOT NULL COMMENT '측정일시 / 센서/시뮬레이터 측정 시점',
  `ph` DECIMAL(4,2) NULL COMMENT 'pH / 양액 pH',
  `photoperiod` DECIMAL(5,2) NULL COMMENT '광주기 / 시간',
  `temperature` DECIMAL(5,2) NULL COMMENT '온도 / ℃',
  `vpd` DECIMAL(5,2) NULL COMMENT 'VPD / kPa',
  `water_temp` DECIMAL(5,2) NULL COMMENT '수온 / ℃',
  PRIMARY KEY (`env_log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='환경 데이터 관리 - ENVIRONMENT_LOG';

DROP TABLE IF EXISTS `env_evaluation_item`;

CREATE TABLE `env_evaluation_item` (
  `batch_id` BIGINT NOT NULL COMMENT '배치 ID / CULTIVATION_BATCH 참조. 조회 성능용 중복 FK',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 평가 생성 일시',
  `deviation_rate` DECIMAL(6,2) NULL COMMENT '이탈률 / 기준 경계값 대비 이탈률(%)',
  `deviation_value` DECIMAL(10,2) NULL COMMENT '이탈값 / 기준 범위 밖으로 벗어난 절대값',
  `env_eval_item_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '환경 항목 평가 ID / 환경 항목별 평가 식별자',
  `env_log_id` BIGINT NOT NULL COMMENT '환경 로그 ID / ENVIRONMENT_LOG 참조',
  `eval_status` VARCHAR(20) NOT NULL DEFAULT 'NORMAL' COMMENT '항목 판정 / NORMAL, CAUTION, FAIL, MISSING, SKIPPED',
  `fail_rate` DECIMAL(6,2) NULL COMMENT '경고 이탈률 / 판정 당시 fail_rate 스냅샷',
  `item_code` VARCHAR(50) NOT NULL COMMENT '항목 코드 / TEMP, HUMIDITY, PH 등',
  `item_name` VARCHAR(50) NOT NULL COMMENT '항목명 / 판정 당시 항목명 스냅샷',
  `measured_text_value` VARCHAR(100) NULL COMMENT '측정 문자값 / 문자/범주형 항목 측정값',
  `measured_value` DECIMAL(10,2) NULL COMMENT '측정값 / 수치형 항목 측정값',
  `standard_item_id` BIGINT NULL COMMENT '기준 항목 ID / 판정에 사용한 STANDARD_ITEM 참조',
  `standard_max` DECIMAL(10,2) NULL COMMENT '기준 최댓값 / 판정 당시 기준 최댓값',
  `standard_min` DECIMAL(10,2) NULL COMMENT '기준 최솟값 / 판정 당시 기준 최솟값',
  `unit` VARCHAR(30) NULL COMMENT '단위 / 판정 당시 단위 스냅샷',
  PRIMARY KEY (`env_eval_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='환경 데이터 관리 - ENV_EVALUATION_ITEM';

DROP TABLE IF EXISTS `env_nonconformity`;

CREATE TABLE `env_nonconformity` (
  `batch_id` BIGINT NOT NULL COMMENT '배치 ID / 발생 당시 배치 스냅샷 / CULTIVATION_BATCH 참조',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 생성 일시',
  `crop_id` BIGINT NOT NULL COMMENT '작물 ID / 발생 당시 작물 스냅샷 / CROP 참조',
  `delete_yn` CHAR(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부 / Y/N. Y이면 기본 목록 조회에서 제외. 복원 시 N으로 변경',
  `deleted_at` DATETIME NULL COMMENT '삭제일시 / 임시 삭제 처리 일시. 7일 경과 시 영구 삭제 대상. 복원 시 NULL',
  `deviation_rate` DECIMAL(6,2) NULL COMMENT '이탈률 / 기준 경계값 대비 이탈률(%)',
  `deviation_value` DECIMAL(10,2) NULL COMMENT '이탈값 / 기준 범위 밖으로 벗어난 절대값',
  `env_eval_item_id` BIGINT NULL COMMENT '환경 항목 평가 ID / 최초 이탈 ENV_EVALUATION_ITEM 참조',
  `env_log_id` BIGINT NOT NULL COMMENT '환경 로그 ID / 최초 이탈 ENVIRONMENT_LOG 참조',
  `env_nc_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '환경 부적합 ID / 환경 부적합 식별자',
  `env_nc_status` VARCHAR(20) NOT NULL DEFAULT 'OPEN' COMMENT '환경 부적합 상태 / OPEN, ACKNOWLEDGED, IN_PROGRESS, RESOLVED',
  `guide_message` TEXT NULL COMMENT '조치 가이드 / 환경 제어를 위한 즉시 조치 안내',
  `item_code` VARCHAR(50) NOT NULL COMMENT '이탈 항목 코드 / TEMP, HUMIDITY, PH, EC 등',
  `item_name` VARCHAR(50) NOT NULL COMMENT '이탈 항목명 / 온도, 습도, pH 등',
  `measured_value` DECIMAL(10,2) NULL COMMENT '측정값 / 실제 환경 측정값',
  `occurred_at` DATETIME NOT NULL COMMENT '발생일시 / 이탈 발생 시점',
  `resolved_at` DATETIME NULL COMMENT '해결일시 / 정상 복귀 확인 시점',
  `resolved_env_log_id` BIGINT NULL COMMENT '해결 확인 환경 로그 ID / 정상 복귀를 확인한 ENVIRONMENT_LOG 참조',
  `resolved_note` TEXT NULL COMMENT '해결 메모 / 정상 복귀 확인 또는 수동 종료 사유 메모',
  `resolved_type` VARCHAR(30) NULL COMMENT '해결 유형 / 해결 방식. SIMULATOR_NORMAL, MANUAL_CLOSE. 기본 흐름은 다음 시뮬레이터 NORMAL 판정 시 자동 해결',
  `severity` VARCHAR(20) NOT NULL COMMENT '심각도 / CAUTION, FAIL',
  `standard_max` DECIMAL(10,2) NULL COMMENT '기준 최댓값 / 발생 당시 기준 최댓값',
  `standard_min` DECIMAL(10,2) NULL COMMENT '기준 최솟값 / 발생 당시 기준 최솟값',
  `zone_id` BIGINT NOT NULL COMMENT '구역 ID / 발생 당시 구역 스냅샷 / ZONE 참조',
  PRIMARY KEY (`env_nc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='환경 부적합 관리 - ENV_NONCONFORMITY';

DROP TABLE IF EXISTS `env_alert`;

CREATE TABLE `env_alert` (
  `alert_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '알림 ID / 알림 식별자',
  `alert_level` VARCHAR(20) NOT NULL COMMENT '알림 수준 / CAUTION, FAIL',
  `alert_message` TEXT NOT NULL COMMENT '알림 내용 / 작업자/관리자 확인용 메시지',
  `alert_status` VARCHAR(20) NOT NULL DEFAULT 'UNREAD' COMMENT '알림 상태 / UNREAD, READ, CLOSED',
  `alert_title` VARCHAR(100) NOT NULL COMMENT '알림 제목 / 예: A구역 pH 기준 이탈',
  `batch_id` BIGINT NOT NULL COMMENT '배치 ID / CULTIVATION_BATCH 참조',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 생성 일시',
  `env_nc_id` BIGINT NOT NULL COMMENT '환경 부적합 ID / ENV_NONCONFORMITY 참조',
  `notified_role` VARCHAR(20) NULL DEFAULT 'ALL' COMMENT '알림 대상 권한 / ADMIN, WORKER, ALL',
  `notified_user_id` BIGINT NULL COMMENT '알림 대상 사용자 / 특정 사용자 대상일 때 USER_ACCOUNT 참조',
  `read_at` DATETIME NULL COMMENT '읽은 시각 / 알림 확인 시각',
  `read_by` BIGINT NULL COMMENT '읽은 사용자 / USER_ACCOUNT 참조',
  `zone_id` BIGINT NOT NULL COMMENT '구역 ID / ZONE 참조',
  PRIMARY KEY (`alert_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='환경 부적합 관리 - ENV_ALERT';

DROP TABLE IF EXISTS `env_action_log`;

CREATE TABLE `env_action_log` (
  `action_at` DATETIME NOT NULL COMMENT '조치일시 / 조치 시점',
  `action_by` BIGINT NOT NULL COMMENT '조치자 ID / USER_ACCOUNT 참조',
  `action_content` TEXT NOT NULL COMMENT '조치 내용 / 냉방 조정, 양액 보정 등. 기존 ENVIRONMENT_LOG는 수정하지 않음',
  `action_status_after` VARCHAR(20) NULL COMMENT '조치 후 상태 / 조치 후 상태. ACKNOWLEDGED, IN_PROGRESS. 최종 RESOLVED는 다음 시뮬레이터 NORMAL 판정 시 ENV_NONCONFORMITY에서 처리',
  `action_type` VARCHAR(30) NOT NULL DEFAULT 'CHECKED' COMMENT '조치 유형 / CHECKED, CONTROL_ADJUSTED, NUTRIENT_ADJUSTED, LIGHT_ADJUSTED, ETC',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 등록 일시',
  `env_action_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '환경 조치 ID / 환경 조치 식별자',
  `env_nc_id` BIGINT NOT NULL COMMENT '환경 부적합 ID / ENV_NONCONFORMITY 참조',
  `result_note` TEXT NULL COMMENT '결과 메모 / 다음 시뮬레이터 로그에서 정상 복귀 확인 예정 등',
  PRIMARY KEY (`env_action_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='환경 부적합 관리 - ENV_ACTION_LOG';

DROP TABLE IF EXISTS `growth_measurement`;

CREATE TABLE `growth_measurement` (
  `aggregation_method` VARCHAR(20) NOT NULL DEFAULT 'AVG' COMMENT '집계 방식 / 샘플별 원시값을 대표값으로 환산하는 방식. AVG, REPRESENTATIVE, MANUAL',
  `batch_id` BIGINT NOT NULL COMMENT '배치 ID / CULTIVATION_BATCH 참조',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 등록 일시',
  `delete_yn` CHAR(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부 / Y/N. Y이면 기본 목록 조회에서 제외. 복원 시 N으로 변경',
  `deleted_at` DATETIME NULL COMMENT '삭제일시 / 임시 삭제 처리 일시. 7일 경과 시 영구 삭제 대상. 복원 시 NULL',
  `fresh_weight` DECIMAL(8,2) NULL COMMENT '생체중 / g / 샘플별 원시값의 평균값 캐시',
  `growth_stage` VARCHAR(50) NULL COMMENT '생장단계 / 대표 생장단계. 샘플별 원시값은 GROWTH_MEASUREMENT_SAMPLE에 저장',
  `leaf_color` VARCHAR(50) NULL COMMENT '엽색 / 대표 엽색 또는 최빈값. 샘플별 원시값은 GROWTH_MEASUREMENT_SAMPLE에 저장',
  `leaf_length` DECIMAL(6,2) NULL COMMENT '엽장 / cm / 샘플별 원시값의 평균값 캐시',
  `leaf_width` DECIMAL(6,2) NULL COMMENT '엽폭 / cm / 샘플별 원시값의 평균값 캐시',
  `measured_at` DATETIME NOT NULL COMMENT '측정일시 / 실측 시점',
  `measured_by` BIGINT NOT NULL COMMENT '측정자 ID / USER_ACCOUNT 참조',
  `measurement_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '실측 ID / 실측 데이터 식별자',
  `plant_height` DECIMAL(6,2) NULL COMMENT '초장 / cm / 샘플별 원시값의 평균값 캐시',
  `quality_status` VARCHAR(20) NULL COMMENT '품질 판정 캐시 / NORMAL, CAUTION, FAIL, MISSING / 최신 QUALITY_EVALUATION 결과 요약',
  `sample_count` INT NULL DEFAULT 5 COMMENT '샘플 수 / 측정 샘플 개수. GROWTH_MEASUREMENT_SAMPLE 저장 건수와 일치',
  `special_note` TEXT NULL COMMENT '특이사항 / 실측 묶음 메모. 샘플별 특이사항은 GROWTH_MEASUREMENT_SAMPLE에 저장',
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시 / 수정 일시',
  PRIMARY KEY (`measurement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='실측/품질 관리 - GROWTH_MEASUREMENT';

DROP TABLE IF EXISTS `growth_measurement_sample`;

CREATE TABLE `growth_measurement_sample` (
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 등록 일시',
  `fresh_weight` DECIMAL(8,2) NULL COMMENT '생체중 / 샘플 개체별 생체중 g',
  `growth_stage` VARCHAR(50) NULL COMMENT '생장단계 / 샘플 개체별 생장단계. GERMINATION, GROWING, HARVEST 등',
  `leaf_color` VARCHAR(50) NULL COMMENT '엽색 / 샘플 개체별 엽색. 진녹색, 연녹색, 황화 등',
  `leaf_length` DECIMAL(6,2) NULL COMMENT '엽장 / 샘플 개체별 엽장 cm',
  `leaf_width` DECIMAL(6,2) NULL COMMENT '엽폭 / 샘플 개체별 엽폭 cm',
  `measurement_id` BIGINT NOT NULL COMMENT '실측 ID / GROWTH_MEASUREMENT 참조',
  `plant_height` DECIMAL(6,2) NULL COMMENT '초장 / 샘플 개체별 초장 cm',
  `sample_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '샘플 ID / 샘플 식별자',
  `sample_no` INT NOT NULL COMMENT '샘플 번호 / 한 실측 묶음 내 샘플 순번. 1, 2, 3...',
  `special_note` TEXT NULL COMMENT '특이사항 / 샘플 개체별 특이사항 메모',
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시 / 수정 일시',
  PRIMARY KEY (`sample_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='실측/품질 관리 - GROWTH_MEASUREMENT_SAMPLE';

DROP TABLE IF EXISTS `quality_evaluation`;

CREATE TABLE `quality_evaluation` (
  `batch_id` BIGINT NOT NULL COMMENT '배치 ID / 발생 당시 배치 스냅샷 / CULTIVATION_BATCH 참조',
  `caution_item_count` INT NOT NULL DEFAULT 0 COMMENT '주의 항목 수 / CAUTION 항목 수',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 생성 일시',
  `crop_id` BIGINT NOT NULL COMMENT '작물 ID / 발생 당시 작물 스냅샷 / CROP 참조',
  `evaluated_at` DATETIME NOT NULL COMMENT '평가일시 / 실측값 판정 시점',
  `fail_item_count` INT NOT NULL DEFAULT 0 COMMENT '경고 항목 수 / FAIL 항목 수',
  `measurement_id` BIGINT NOT NULL COMMENT '실측 ID / GROWTH_MEASUREMENT 참조',
  `missing_item_count` INT NOT NULL DEFAULT 0 COMMENT '누락 항목 수 / MISSING 항목 수',
  `normal_item_count` INT NOT NULL DEFAULT 0 COMMENT '정상 항목 수 / NORMAL 항목 수',
  `overall_status` VARCHAR(20) NOT NULL DEFAULT 'NORMAL' COMMENT '종합 품질 판정 / NORMAL, CAUTION, FAIL, MISSING. 화면 표시는 정상/주의/경고/누락으로 변환',
  `quality_eval_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '품질 평가 ID / 품질 평가 식별자',
  `report_reflected_yn` CHAR(1) NOT NULL DEFAULT 'N' COMMENT '리포트 반영 여부 / Y, N',
  `sample_count` INT NULL COMMENT '샘플 수 / 평가에 사용한 샘플 수',
  `standard_set_id` BIGINT NULL COMMENT '품질 기준 묶음 ID / 판정에 사용한 STANDARD_SET 참조',
  `summary_message` TEXT NULL COMMENT '평가 요약 / 품질 결과 요약 문구',
  PRIMARY KEY (`quality_eval_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='실측/품질 관리 - QUALITY_EVALUATION';

DROP TABLE IF EXISTS `quality_evaluation_item`;

CREATE TABLE `quality_evaluation_item` (
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 평가 생성 일시',
  `deviation_rate` DECIMAL(6,2) NULL COMMENT '이탈률 / 기준 경계값 대비 이탈률(%)',
  `deviation_value` DECIMAL(10,2) NULL COMMENT '이탈값 / 기준 범위 밖으로 벗어난 절대값',
  `eval_status` VARCHAR(20) NOT NULL DEFAULT 'NORMAL' COMMENT '항목 판정 / NORMAL, CAUTION, FAIL, MISSING, SKIPPED',
  `expected_text_value` VARCHAR(100) NULL COMMENT '기대 문자값 / 판정 당시 문자형 기준값',
  `fail_rate` DECIMAL(6,2) NULL COMMENT '경고 이탈률 / 판정 당시 fail_rate 스냅샷',
  `item_code` VARCHAR(50) NOT NULL COMMENT '항목 코드 / PLANT_HEIGHT, LEAF_WIDTH, FRESH_WEIGHT 등',
  `item_name` VARCHAR(50) NOT NULL COMMENT '항목명 / 판정 당시 항목명 스냅샷',
  `measured_text_value` VARCHAR(100) NULL COMMENT '측정 문자값 / 엽색/생장단계 등 문자형 측정값',
  `measured_value` DECIMAL(10,2) NULL COMMENT '측정값 / 수치형 품질 측정값',
  `measurement_id` BIGINT NOT NULL COMMENT '실측 ID / GROWTH_MEASUREMENT 참조',
  `quality_eval_id` BIGINT NOT NULL COMMENT '품질 평가 ID / QUALITY_EVALUATION 참조',
  `quality_eval_item_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '품질 항목 평가 ID / 품질 항목별 평가 식별자',
  `standard_item_id` BIGINT NULL COMMENT '기준 항목 ID / 판정에 사용한 STANDARD_ITEM 참조',
  `standard_max` DECIMAL(10,2) NULL COMMENT '기준 최댓값 / 판정 당시 품질 기준 최댓값',
  `standard_min` DECIMAL(10,2) NULL COMMENT '기준 최솟값 / 판정 당시 품질 기준 최솟값',
  `unit` VARCHAR(30) NULL COMMENT '단위 / 판정 당시 단위 스냅샷',
  PRIMARY KEY (`quality_eval_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='실측/품질 관리 - QUALITY_EVALUATION_ITEM';

DROP TABLE IF EXISTS `quality_nonconformity`;

CREATE TABLE `quality_nonconformity` (
  `analysis_message` TEXT NULL COMMENT '분석 메시지 / 품질 저하 원인 추정/해석',
  `batch_id` BIGINT NOT NULL COMMENT '배치 ID / 발생 당시 배치 스냅샷 / CULTIVATION_BATCH 참조',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 생성 일시',
  `crop_id` BIGINT NOT NULL COMMENT '작물 ID / 발생 당시 작물 스냅샷 / CROP 참조',
  `delete_yn` CHAR(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부 / Y/N. Y이면 기본 목록 조회에서 제외. 복원 시 N으로 변경',
  `deleted_at` DATETIME NULL COMMENT '삭제일시 / 임시 삭제 처리 일시. 7일 경과 시 영구 삭제 대상. 복원 시 NULL',
  `deviation_rate` DECIMAL(6,2) NULL COMMENT '이탈률 / 기준 경계값 대비 이탈률(%)',
  `deviation_value` DECIMAL(10,2) NULL COMMENT '이탈값 / 기준 범위 밖으로 벗어난 절대값',
  `item_code` VARCHAR(50) NOT NULL COMMENT '이탈 항목 코드 / PLANT_HEIGHT, LEAF_WIDTH, FRESH_WEIGHT 등',
  `item_name` VARCHAR(50) NOT NULL COMMENT '이탈 항목명 / 초장, 엽폭, 생체중 등',
  `measured_value` DECIMAL(10,2) NULL COMMENT '측정값 / 작업자 실측값/샘플 평균값 또는 대표값',
  `measurement_id` BIGINT NOT NULL COMMENT '실측 ID / GROWTH_MEASUREMENT 참조',
  `occurred_at` DATETIME NOT NULL COMMENT '발생일시 / 품질 평가 시점',
  `quality_eval_id` BIGINT NOT NULL COMMENT '품질 평가 ID / QUALITY_EVALUATION 참조',
  `quality_eval_item_id` BIGINT NULL COMMENT '품질 항목 평가 ID / QUALITY_EVALUATION_ITEM 참조',
  `quality_nc_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '품질 부적합 ID / 품질 부적합 식별자',
  `quality_nc_status` VARCHAR(20) NOT NULL DEFAULT 'RECORDED' COMMENT '품질 부적합 상태 / RECORDED, REVIEWED, REFLECTED',
  `recommended_next_action` TEXT NULL COMMENT '후속 권장사항 / 다음 재배 조건 점검/개선 권장',
  `report_include_yn` CHAR(1) NOT NULL DEFAULT 'Y' COMMENT '리포트 포함 여부 / Y, N',
  `severity` VARCHAR(20) NOT NULL COMMENT '심각도 / CAUTION, FAIL',
  `standard_max` DECIMAL(10,2) NULL COMMENT '기준 최댓값 / 발생 당시 품질 기준 최댓값',
  `standard_min` DECIMAL(10,2) NULL COMMENT '기준 최솟값 / 발생 당시 품질 기준 최솟값',
  PRIMARY KEY (`quality_nc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='실측/품질 관리 - QUALITY_NONCONFORMITY';

DROP TABLE IF EXISTS `quality_review_log`;

CREATE TABLE `quality_review_log` (
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시 / 등록 일시',
  `quality_eval_id` BIGINT NOT NULL COMMENT '품질 평가 ID / QUALITY_EVALUATION 참조',
  `quality_review_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '품질 검토 ID / 품질 검토 식별자',
  `review_at` DATETIME NOT NULL COMMENT '검토일시 / 검토 시점',
  `review_content` TEXT NULL COMMENT '검토 내용 / 품질 결과 확인/원인 분석 메모',
  `reviewed_by` BIGINT NOT NULL COMMENT '검토자 ID / USER_ACCOUNT 참조',
  PRIMARY KEY (`quality_review_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='실측/품질 관리 - QUALITY_REVIEW_LOG';

DROP TABLE IF EXISTS `report`;

CREATE TABLE `report` (
  `batch_id` BIGINT NULL COMMENT '배치 ID / 배치 리포트일 때 Not Null, 이외 Null',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발급일시 / 발급 시점',
  `created_by` BIGINT NOT NULL COMMENT '발급자 ID / USER_ACCOUNT 참조',
  `crop_id` BIGINT NULL COMMENT '작물 ID / 작물 리포트일 때 Not Null, 이외 Null',
  `delete_yn` CHAR(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부 / Y/N. Y이면 기본 목록 조회에서 제외. 복원 시 N으로 변경',
  `deleted_at` DATETIME NULL COMMENT '삭제일시 / 임시 삭제 처리 일시. 7일 경과 시 영구 삭제 대상. 복원 시 NULL',
  `end_date` DATE NOT NULL COMMENT '조회 종료일 / 리포트 기간 종료',
  `env_nc_summary` TEXT NULL COMMENT '환경 부적합 요약 / ENV_NONCONFORMITY 및 ENV_ACTION_LOG 요약',
  `env_summary` TEXT NULL COMMENT '환경 요약 / 환경 로그/환경 상태 요약 JSON 또는 텍스트',
  `generated_condition_json` TEXT NULL COMMENT '발급 조건 JSON / 발급 당시 필터/기준 조건 스냅샷. 화면 기본 목록에는 표시하지 않지만 재발급/감사용으로 보관',
  `guide_summary` TEXT NULL COMMENT '가이드 요약 / 다음 재배/환경/품질 개선 가이드',
  `quality_nc_summary` TEXT NULL COMMENT '품질 부적합 요약 / QUALITY_NONCONFORMITY 및 QUALITY_REVIEW_LOG 요약',
  `quality_summary` TEXT NULL COMMENT '품질 요약 / 실측/품질 평가 요약 JSON 또는 텍스트',
  `report_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '리포트 ID / 리포트 식별자',
  `report_scope` VARCHAR(20) NOT NULL DEFAULT 'BATCH' COMMENT '리포트 범위 / BATCH, ZONE, CROP, ALL',
  `report_status` VARCHAR(20) NOT NULL DEFAULT 'GENERATED' COMMENT '리포트 상태 / GENERATED, REGENERATED. 리포트 원본 수정 불가, 필요 시 재발급',
  `report_title` VARCHAR(150) NOT NULL COMMENT '리포트명 / 목록에 표시할 리포트 제목. 예: A구역 상추 일일 리포트',
  `report_type` VARCHAR(20) NOT NULL COMMENT '리포트 유형 / DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY',
  `report_version` INT NOT NULL DEFAULT 1 COMMENT '리포트 버전 / 같은 조건 재발급 시 버전 관리',
  `start_date` DATE NOT NULL COMMENT '조회 시작일 / 리포트 기간 시작',
  `zone_id` BIGINT NULL COMMENT '구역 ID / 구역 리포트일 때 Not Null, 이외 Null',
  PRIMARY KEY (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='리포트 관리 - REPORT';


-- Indexes

CREATE INDEX `idx_standard_set_crop_id` ON `standard_set` (`crop_id`);

CREATE INDEX `idx_standard_set_delete_yn` ON `standard_set` (`delete_yn`);

CREATE INDEX `idx_standard_set_created_at` ON `standard_set` (`created_at`);

CREATE INDEX `idx_standard_set_updated_at` ON `standard_set` (`updated_at`);

CREATE INDEX `idx_standard_set_crop_id_standard_type_standard_status` ON `standard_set` (`crop_id`, `standard_type`, `standard_status`);

CREATE INDEX `idx_standard_item_item_code` ON `standard_item` (`item_code`);

CREATE INDEX `idx_standard_item_standard_set_id` ON `standard_item` (`standard_set_id`);

CREATE INDEX `idx_standard_item_delete_yn` ON `standard_item` (`delete_yn`);

CREATE INDEX `idx_standard_item_created_at` ON `standard_item` (`created_at`);

CREATE INDEX `idx_standard_item_updated_at` ON `standard_item` (`updated_at`);

CREATE INDEX `idx_standard_item_standard_set_id_item_code` ON `standard_item` (`standard_set_id`, `item_code`);

CREATE INDEX `idx_cultivation_batch_created_by` ON `cultivation_batch` (`created_by`);

CREATE INDEX `idx_cultivation_batch_crop_id` ON `cultivation_batch` (`crop_id`);

CREATE INDEX `idx_cultivation_batch_env_standard_set_id` ON `cultivation_batch` (`env_standard_set_id`);

CREATE INDEX `idx_cultivation_batch_quality_standard_set_id` ON `cultivation_batch` (`quality_standard_set_id`);

CREATE INDEX `idx_cultivation_batch_zone_id` ON `cultivation_batch` (`zone_id`);

CREATE INDEX `idx_cultivation_batch_delete_yn` ON `cultivation_batch` (`delete_yn`);

CREATE INDEX `idx_cultivation_batch_created_at` ON `cultivation_batch` (`created_at`);

CREATE INDEX `idx_cultivation_batch_updated_at` ON `cultivation_batch` (`updated_at`);

CREATE INDEX `idx_cultivation_batch_start_date` ON `cultivation_batch` (`start_date`);

CREATE INDEX `idx_cultivation_batch_batch_status` ON `cultivation_batch` (`batch_status`);

CREATE INDEX `idx_cultivation_batch_zone_id_batch_status` ON `cultivation_batch` (`zone_id`, `batch_status`);

CREATE INDEX `idx_environment_log_batch_id` ON `environment_log` (`batch_id`);

CREATE INDEX `idx_environment_log_delete_yn` ON `environment_log` (`delete_yn`);

CREATE INDEX `idx_environment_log_created_at` ON `environment_log` (`created_at`);

CREATE INDEX `idx_environment_log_measured_at` ON `environment_log` (`measured_at`);

CREATE INDEX `idx_environment_log_env_status` ON `environment_log` (`env_status`);

CREATE INDEX `idx_environment_log_batch_id_measured_at` ON `environment_log` (`batch_id`, `measured_at`);

CREATE INDEX `idx_env_evaluation_item_batch_id` ON `env_evaluation_item` (`batch_id`);

CREATE INDEX `idx_env_evaluation_item_env_log_id` ON `env_evaluation_item` (`env_log_id`);

CREATE INDEX `idx_env_evaluation_item_standard_item_id` ON `env_evaluation_item` (`standard_item_id`);

CREATE INDEX `idx_env_evaluation_item_created_at` ON `env_evaluation_item` (`created_at`);

CREATE INDEX `idx_env_evaluation_item_item_code` ON `env_evaluation_item` (`item_code`);

CREATE INDEX `idx_env_evaluation_item_env_log_id_eval_status` ON `env_evaluation_item` (`env_log_id`, `eval_status`);

CREATE INDEX `idx_env_nonconformity_batch_id` ON `env_nonconformity` (`batch_id`);

CREATE INDEX `idx_env_nonconformity_crop_id` ON `env_nonconformity` (`crop_id`);

CREATE INDEX `idx_env_nonconformity_env_eval_item_id` ON `env_nonconformity` (`env_eval_item_id`);

CREATE INDEX `idx_env_nonconformity_env_log_id` ON `env_nonconformity` (`env_log_id`);

CREATE INDEX `idx_env_nonconformity_resolved_env_log_id` ON `env_nonconformity` (`resolved_env_log_id`);

CREATE INDEX `idx_env_nonconformity_zone_id` ON `env_nonconformity` (`zone_id`);

CREATE INDEX `idx_env_nonconformity_delete_yn` ON `env_nonconformity` (`delete_yn`);

CREATE INDEX `idx_env_nonconformity_created_at` ON `env_nonconformity` (`created_at`);

CREATE INDEX `idx_env_nonconformity_occurred_at` ON `env_nonconformity` (`occurred_at`);

CREATE INDEX `idx_env_nonconformity_env_nc_status` ON `env_nonconformity` (`env_nc_status`);

CREATE INDEX `idx_env_nonconformity_item_code` ON `env_nonconformity` (`item_code`);

CREATE INDEX `idx_env_nonconformity_batch_id_env_nc_status_occurred_at` ON `env_nonconformity` (`batch_id`, `env_nc_status`, `occurred_at`);

CREATE INDEX `idx_env_alert_batch_id` ON `env_alert` (`batch_id`);

CREATE INDEX `idx_env_alert_env_nc_id` ON `env_alert` (`env_nc_id`);

CREATE INDEX `idx_env_alert_notified_user_id` ON `env_alert` (`notified_user_id`);

CREATE INDEX `idx_env_alert_read_by` ON `env_alert` (`read_by`);

CREATE INDEX `idx_env_alert_zone_id` ON `env_alert` (`zone_id`);

CREATE INDEX `idx_env_alert_created_at` ON `env_alert` (`created_at`);

CREATE INDEX `idx_env_alert_alert_status` ON `env_alert` (`alert_status`);

CREATE INDEX `idx_env_action_log_action_by` ON `env_action_log` (`action_by`);

CREATE INDEX `idx_env_action_log_env_nc_id` ON `env_action_log` (`env_nc_id`);

CREATE INDEX `idx_env_action_log_created_at` ON `env_action_log` (`created_at`);

CREATE INDEX `idx_env_action_log_env_nc_id_action_at` ON `env_action_log` (`env_nc_id`, `action_at`);

CREATE INDEX `idx_growth_measurement_batch_id` ON `growth_measurement` (`batch_id`);

CREATE INDEX `idx_growth_measurement_measured_by` ON `growth_measurement` (`measured_by`);

CREATE INDEX `idx_growth_measurement_delete_yn` ON `growth_measurement` (`delete_yn`);

CREATE INDEX `idx_growth_measurement_created_at` ON `growth_measurement` (`created_at`);

CREATE INDEX `idx_growth_measurement_updated_at` ON `growth_measurement` (`updated_at`);

CREATE INDEX `idx_growth_measurement_measured_at` ON `growth_measurement` (`measured_at`);

CREATE INDEX `idx_growth_measurement_quality_status` ON `growth_measurement` (`quality_status`);

CREATE INDEX `idx_growth_measurement_batch_id_measured_at` ON `growth_measurement` (`batch_id`, `measured_at`);

CREATE INDEX `idx_growth_measurement_sample_measurement_id` ON `growth_measurement_sample` (`measurement_id`);

CREATE INDEX `idx_growth_measurement_sample_created_at` ON `growth_measurement_sample` (`created_at`);

CREATE INDEX `idx_growth_measurement_sample_updated_at` ON `growth_measurement_sample` (`updated_at`);

CREATE INDEX `idx_growth_measurement_sample_measurement_id_sample_no` ON `growth_measurement_sample` (`measurement_id`, `sample_no`);

CREATE INDEX `idx_quality_evaluation_batch_id` ON `quality_evaluation` (`batch_id`);

CREATE INDEX `idx_quality_evaluation_crop_id` ON `quality_evaluation` (`crop_id`);

CREATE INDEX `idx_quality_evaluation_measurement_id` ON `quality_evaluation` (`measurement_id`);

CREATE INDEX `idx_quality_evaluation_standard_set_id` ON `quality_evaluation` (`standard_set_id`);

CREATE INDEX `idx_quality_evaluation_created_at` ON `quality_evaluation` (`created_at`);

CREATE INDEX `idx_quality_evaluation_evaluated_at` ON `quality_evaluation` (`evaluated_at`);

CREATE INDEX `idx_quality_evaluation_overall_status` ON `quality_evaluation` (`overall_status`);

CREATE INDEX `idx_quality_evaluation_measurement_id_overall_status` ON `quality_evaluation` (`measurement_id`, `overall_status`);

CREATE INDEX `idx_quality_evaluation_item_measurement_id` ON `quality_evaluation_item` (`measurement_id`);

CREATE INDEX `idx_quality_evaluation_item_quality_eval_id` ON `quality_evaluation_item` (`quality_eval_id`);

CREATE INDEX `idx_quality_evaluation_item_standard_item_id` ON `quality_evaluation_item` (`standard_item_id`);

CREATE INDEX `idx_quality_evaluation_item_created_at` ON `quality_evaluation_item` (`created_at`);

CREATE INDEX `idx_quality_evaluation_item_item_code` ON `quality_evaluation_item` (`item_code`);

CREATE INDEX `idx_quality_evaluation_item_quality_eval_id_eval_status` ON `quality_evaluation_item` (`quality_eval_id`, `eval_status`);

CREATE INDEX `idx_quality_nonconformity_batch_id` ON `quality_nonconformity` (`batch_id`);

CREATE INDEX `idx_quality_nonconformity_crop_id` ON `quality_nonconformity` (`crop_id`);

CREATE INDEX `idx_quality_nonconformity_measurement_id` ON `quality_nonconformity` (`measurement_id`);

CREATE INDEX `idx_quality_nonconformity_quality_eval_id` ON `quality_nonconformity` (`quality_eval_id`);

CREATE INDEX `idx_quality_nonconformity_quality_eval_item_id` ON `quality_nonconformity` (`quality_eval_item_id`);

CREATE INDEX `idx_quality_nonconformity_delete_yn` ON `quality_nonconformity` (`delete_yn`);

CREATE INDEX `idx_quality_nonconformity_created_at` ON `quality_nonconformity` (`created_at`);

CREATE INDEX `idx_quality_nonconformity_occurred_at` ON `quality_nonconformity` (`occurred_at`);

CREATE INDEX `idx_quality_nonconformity_quality_nc_status` ON `quality_nonconformity` (`quality_nc_status`);

CREATE INDEX `idx_quality_nonconformity_item_code` ON `quality_nonconformity` (`item_code`);

CREATE INDEX `idx_quality_nonconformity_quality_eval_id_quality_nc_status` ON `quality_nonconformity` (`quality_eval_id`, `quality_nc_status`);

CREATE INDEX `idx_quality_review_log_quality_eval_id` ON `quality_review_log` (`quality_eval_id`);

CREATE INDEX `idx_quality_review_log_reviewed_by` ON `quality_review_log` (`reviewed_by`);

CREATE INDEX `idx_quality_review_log_created_at` ON `quality_review_log` (`created_at`);

CREATE INDEX `idx_report_batch_id` ON `report` (`batch_id`);

CREATE INDEX `idx_report_created_by` ON `report` (`created_by`);

CREATE INDEX `idx_report_crop_id` ON `report` (`crop_id`);

CREATE INDEX `idx_report_zone_id` ON `report` (`zone_id`);

CREATE INDEX `idx_report_delete_yn` ON `report` (`delete_yn`);

CREATE INDEX `idx_report_created_at` ON `report` (`created_at`);

CREATE INDEX `idx_report_start_date` ON `report` (`start_date`);

CREATE INDEX `idx_report_end_date` ON `report` (`end_date`);

CREATE INDEX `idx_report_report_type` ON `report` (`report_type`);

CREATE INDEX `idx_report_report_scope` ON `report` (`report_scope`);

CREATE INDEX `idx_report_report_status` ON `report` (`report_status`);

CREATE INDEX `idx_report_report_type_start_date_end_date` ON `report` (`report_type`, `start_date`, `end_date`);

CREATE INDEX `idx_user_account_created_at` ON `user_account` (`created_at`);

CREATE INDEX `idx_user_account_updated_at` ON `user_account` (`updated_at`);

CREATE INDEX `idx_crop_delete_yn` ON `crop` (`delete_yn`);

CREATE INDEX `idx_crop_created_at` ON `crop` (`created_at`);

CREATE INDEX `idx_crop_updated_at` ON `crop` (`updated_at`);

CREATE INDEX `idx_measurement_item_master_created_at` ON `measurement_item_master` (`created_at`);

CREATE INDEX `idx_measurement_item_master_updated_at` ON `measurement_item_master` (`updated_at`);

CREATE INDEX `idx_zone_delete_yn` ON `zone` (`delete_yn`);

CREATE INDEX `idx_zone_created_at` ON `zone` (`created_at`);

CREATE INDEX `idx_zone_updated_at` ON `zone` (`updated_at`);


-- Foreign Keys

ALTER TABLE `standard_set`
  ADD CONSTRAINT `fk_standard_set_crop_id` FOREIGN KEY (`crop_id`) REFERENCES `crop` (`crop_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `standard_item`
  ADD CONSTRAINT `fk_standard_item_item_code` FOREIGN KEY (`item_code`) REFERENCES `measurement_item_master` (`item_code`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `standard_item`
  ADD CONSTRAINT `fk_standard_item_standard_set_id` FOREIGN KEY (`standard_set_id`) REFERENCES `standard_set` (`standard_set_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `cultivation_batch`
  ADD CONSTRAINT `fk_cultivation_batch_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_account` (`user_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `cultivation_batch`
  ADD CONSTRAINT `fk_cultivation_batch_crop_id` FOREIGN KEY (`crop_id`) REFERENCES `crop` (`crop_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `cultivation_batch`
  ADD CONSTRAINT `fk_cultivation_batch_env_standard_set_id` FOREIGN KEY (`env_standard_set_id`) REFERENCES `standard_set` (`standard_set_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `cultivation_batch`
  ADD CONSTRAINT `fk_cultivation_batch_quality_standard_set_id` FOREIGN KEY (`quality_standard_set_id`) REFERENCES `standard_set` (`standard_set_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `cultivation_batch`
  ADD CONSTRAINT `fk_cultivation_batch_zone_id` FOREIGN KEY (`zone_id`) REFERENCES `zone` (`zone_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `environment_log`
  ADD CONSTRAINT `fk_environment_log_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `cultivation_batch` (`batch_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_evaluation_item`
  ADD CONSTRAINT `fk_env_evaluation_item_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `cultivation_batch` (`batch_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_evaluation_item`
  ADD CONSTRAINT `fk_env_evaluation_item_env_log_id` FOREIGN KEY (`env_log_id`) REFERENCES `environment_log` (`env_log_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_evaluation_item`
  ADD CONSTRAINT `fk_env_evaluation_item_standard_item_id` FOREIGN KEY (`standard_item_id`) REFERENCES `standard_item` (`standard_item_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_nonconformity`
  ADD CONSTRAINT `fk_env_nonconformity_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `cultivation_batch` (`batch_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_nonconformity`
  ADD CONSTRAINT `fk_env_nonconformity_crop_id` FOREIGN KEY (`crop_id`) REFERENCES `crop` (`crop_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_nonconformity`
  ADD CONSTRAINT `fk_env_nonconformity_env_eval_item_id` FOREIGN KEY (`env_eval_item_id`) REFERENCES `env_evaluation_item` (`env_eval_item_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_nonconformity`
  ADD CONSTRAINT `fk_env_nonconformity_env_log_id` FOREIGN KEY (`env_log_id`) REFERENCES `environment_log` (`env_log_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_nonconformity`
  ADD CONSTRAINT `fk_env_nonconformity_resolved_env_log_id` FOREIGN KEY (`resolved_env_log_id`) REFERENCES `environment_log` (`env_log_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_nonconformity`
  ADD CONSTRAINT `fk_env_nonconformity_zone_id` FOREIGN KEY (`zone_id`) REFERENCES `zone` (`zone_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_alert`
  ADD CONSTRAINT `fk_env_alert_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `cultivation_batch` (`batch_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_alert`
  ADD CONSTRAINT `fk_env_alert_env_nc_id` FOREIGN KEY (`env_nc_id`) REFERENCES `env_nonconformity` (`env_nc_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_alert`
  ADD CONSTRAINT `fk_env_alert_notified_user_id` FOREIGN KEY (`notified_user_id`) REFERENCES `user_account` (`user_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_alert`
  ADD CONSTRAINT `fk_env_alert_read_by` FOREIGN KEY (`read_by`) REFERENCES `user_account` (`user_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_alert`
  ADD CONSTRAINT `fk_env_alert_zone_id` FOREIGN KEY (`zone_id`) REFERENCES `zone` (`zone_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_action_log`
  ADD CONSTRAINT `fk_env_action_log_action_by` FOREIGN KEY (`action_by`) REFERENCES `user_account` (`user_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `env_action_log`
  ADD CONSTRAINT `fk_env_action_log_env_nc_id` FOREIGN KEY (`env_nc_id`) REFERENCES `env_nonconformity` (`env_nc_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `growth_measurement`
  ADD CONSTRAINT `fk_growth_measurement_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `cultivation_batch` (`batch_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `growth_measurement`
  ADD CONSTRAINT `fk_growth_measurement_measured_by` FOREIGN KEY (`measured_by`) REFERENCES `user_account` (`user_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `growth_measurement_sample`
  ADD CONSTRAINT `fk_growth_measurement_sample_measurement_id` FOREIGN KEY (`measurement_id`) REFERENCES `growth_measurement` (`measurement_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `quality_evaluation`
  ADD CONSTRAINT `fk_quality_evaluation_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `cultivation_batch` (`batch_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `quality_evaluation`
  ADD CONSTRAINT `fk_quality_evaluation_crop_id` FOREIGN KEY (`crop_id`) REFERENCES `crop` (`crop_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `quality_evaluation`
  ADD CONSTRAINT `fk_quality_evaluation_measurement_id` FOREIGN KEY (`measurement_id`) REFERENCES `growth_measurement` (`measurement_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `quality_evaluation`
  ADD CONSTRAINT `fk_quality_evaluation_standard_set_id` FOREIGN KEY (`standard_set_id`) REFERENCES `standard_set` (`standard_set_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `quality_evaluation_item`
  ADD CONSTRAINT `fk_quality_evaluation_item_measurement_id` FOREIGN KEY (`measurement_id`) REFERENCES `growth_measurement` (`measurement_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `quality_evaluation_item`
  ADD CONSTRAINT `fk_quality_evaluation_item_quality_eval_id` FOREIGN KEY (`quality_eval_id`) REFERENCES `quality_evaluation` (`quality_eval_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `quality_evaluation_item`
  ADD CONSTRAINT `fk_quality_evaluation_item_standard_item_id` FOREIGN KEY (`standard_item_id`) REFERENCES `standard_item` (`standard_item_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `quality_nonconformity`
  ADD CONSTRAINT `fk_quality_nonconformity_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `cultivation_batch` (`batch_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `quality_nonconformity`
  ADD CONSTRAINT `fk_quality_nonconformity_crop_id` FOREIGN KEY (`crop_id`) REFERENCES `crop` (`crop_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `quality_nonconformity`
  ADD CONSTRAINT `fk_quality_nonconformity_measurement_id` FOREIGN KEY (`measurement_id`) REFERENCES `growth_measurement` (`measurement_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `quality_nonconformity`
  ADD CONSTRAINT `fk_quality_nonconformity_quality_eval_id` FOREIGN KEY (`quality_eval_id`) REFERENCES `quality_evaluation` (`quality_eval_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `quality_nonconformity`
  ADD CONSTRAINT `fk_quality_nonconformity_quality_eval_item_id` FOREIGN KEY (`quality_eval_item_id`) REFERENCES `quality_evaluation_item` (`quality_eval_item_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `quality_review_log`
  ADD CONSTRAINT `fk_quality_review_log_quality_eval_id` FOREIGN KEY (`quality_eval_id`) REFERENCES `quality_evaluation` (`quality_eval_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `quality_review_log`
  ADD CONSTRAINT `fk_quality_review_log_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `user_account` (`user_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `report`
  ADD CONSTRAINT `fk_report_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `cultivation_batch` (`batch_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `report`
  ADD CONSTRAINT `fk_report_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_account` (`user_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `report`
  ADD CONSTRAINT `fk_report_crop_id` FOREIGN KEY (`crop_id`) REFERENCES `crop` (`crop_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `report`
  ADD CONSTRAINT `fk_report_zone_id` FOREIGN KEY (`zone_id`) REFERENCES `zone` (`zone_id`)
  ON UPDATE CASCADE ON DELETE RESTRICT;


SET FOREIGN_KEY_CHECKS = 1;


-- Optional seed: measurement item master

INSERT INTO `measurement_item_master`
(`item_code`, `item_name`, `item_group`, `standard_type`, `unit`, `value_type`, `entity_field`, `sort_order`)
VALUES
('TEMP', '온도', 'AIR', 'ENV', '℃', 'NUMBER', 'temperature', 1),
('HUMIDITY', '습도', 'AIR', 'ENV', '%', 'NUMBER', 'humidity', 2),
('CO2', 'CO2', 'AIR', 'ENV', 'ppm', 'NUMBER', 'co2', 3),
('VPD', 'VPD', 'AIR', 'ENV', 'kPa', 'NUMBER', 'vpd', 4),
('LIGHT_INTENSITY', '조도', 'LIGHT', 'ENV', 'lux/PPFD', 'NUMBER', 'lightIntensity', 5),
('PHOTOPERIOD', '광주기', 'LIGHT', 'ENV', 'hour', 'NUMBER', 'photoperiod', 6),
('LIGHT_WAVELENGTH', '광질/파장', 'LIGHT', 'ENV', 'nm', 'NUMBER', 'lightWavelength', 7),
('PH', 'pH', 'NUTRIENT', 'ENV', 'pH', 'NUMBER', 'ph', 8),
('WATER_TEMP', '수온', 'NUTRIENT', 'ENV', '℃', 'NUMBER', 'waterTemp', 9),
('EC', 'EC', 'NUTRIENT', 'ENV', 'mS/cm', 'NUMBER', 'ec', 10),
('PLANT_HEIGHT', '초장', 'GROWTH', 'QUALITY', 'cm', 'NUMBER', 'plantHeight', 101),
('LEAF_WIDTH', '엽폭', 'GROWTH', 'QUALITY', 'cm', 'NUMBER', 'leafWidth', 102),
('LEAF_LENGTH', '엽장', 'GROWTH', 'QUALITY', 'cm', 'NUMBER', 'leafLength', 103),
('FRESH_WEIGHT', '생체중', 'GROWTH', 'QUALITY', 'g', 'NUMBER', 'freshWeight', 104),
('LEAF_COLOR', '엽색', 'QUALITY_TEXT', 'QUALITY', NULL, 'TEXT', 'leafColor', 105),
('GROWTH_STAGE', '생장단계', 'QUALITY_TEXT', 'QUALITY', NULL, 'TEXT', 'growthStage', 106)
ON DUPLICATE KEY UPDATE
  `item_name` = VALUES(`item_name`),
  `item_group` = VALUES(`item_group`),
  `standard_type` = VALUES(`standard_type`),
  `unit` = VALUES(`unit`),
  `value_type` = VALUES(`value_type`),
  `entity_field` = VALUES(`entity_field`),
  `sort_order` = VALUES(`sort_order`),
  `updated_at` = CURRENT_TIMESTAMP;
