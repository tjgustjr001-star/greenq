-- GreenQ 임시 더미 데이터
-- 기준: greenq_schema_v1_0_3.sql 실행 이후 사용
-- 용도: React 화면/API 개발용 샘플 데이터
-- 주의: 아래 스크립트는 데모 데이터를 다시 넣기 위해 주요 업무 테이블을 비웁니다.

USE `greenq`;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `report`;
TRUNCATE TABLE `quality_review_log`;
TRUNCATE TABLE `quality_nonconformity`;
TRUNCATE TABLE `quality_evaluation_item`;
TRUNCATE TABLE `quality_evaluation`;
TRUNCATE TABLE `growth_measurement_sample`;
TRUNCATE TABLE `growth_measurement`;
TRUNCATE TABLE `env_action_log`;
TRUNCATE TABLE `env_alert`;
TRUNCATE TABLE `env_nonconformity`;
TRUNCATE TABLE `env_evaluation_item`;
TRUNCATE TABLE `environment_log`;
TRUNCATE TABLE `cultivation_batch`;
TRUNCATE TABLE `zone`;
TRUNCATE TABLE `standard_item`;
TRUNCATE TABLE `standard_set`;
TRUNCATE TABLE `crop`;
TRUNCATE TABLE `user_account`;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- 1. 사용자
-- 기본 비밀번호 예시: password
-- BCrypt hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- =========================================================

INSERT INTO `user_account`
(`user_id`, `login_id`, `password_hash`, `user_name`, `role_code`, `email`, `phone`, `account_status`, `created_at`)
VALUES
(1, 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '관리자', 'ADMIN', 'admin@greenq.local', '010-1000-0001', 'ACTIVE', '2026-05-01 09:00:00'),
(2, 'worker01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '작업자 김민수', 'WORKER', 'worker01@greenq.local', '010-2000-0001', 'ACTIVE', '2026-05-01 09:05:00'),
(3, 'worker02', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '작업자 이서연', 'WORKER', 'worker02@greenq.local', '010-2000-0002', 'ACTIVE', '2026-05-01 09:10:00');

-- =========================================================
-- 2. 작물
-- =========================================================

INSERT INTO `crop`
(`crop_id`, `crop_name`, `variety_name`, `crop_type`, `crop_status`, `description`, `created_at`)
VALUES
(1, '상추', '청치마', 'LEAFY', 'ACTIVE', '수경재배 테스트용 엽채류. 온습도와 EC 변화에 민감한 작물.', '2026-05-01 10:00:00'),
(2, '바질', '스위트바질', 'HERB', 'ACTIVE', '허브류 재배 테스트 작물. 광량과 온도 관리가 중요함.', '2026-05-01 10:10:00'),
(3, '딸기', '설향', 'FRUIT', 'INACTIVE', '추후 확장용 과채류 작물. 현재는 비활성 상태.', '2026-05-01 10:20:00');

-- =========================================================
-- 3. 기준 묶음
-- ENV / QUALITY를 분리하고 배치 생성 시점 기준으로 고정 참조
-- =========================================================

INSERT INTO `standard_set`
(`standard_set_id`, `crop_id`, `standard_type`, `standard_name`, `standard_status`, `effective_start_date`, `effective_end_date`, `created_at`)
VALUES
(1, 1, 'ENV', '상추 환경 기준 2026-05', 'ACTIVE', '2026-05-01', NULL, '2026-05-01 10:30:00'),
(2, 1, 'QUALITY', '상추 품질 기준 2026-05', 'ACTIVE', '2026-05-01', NULL, '2026-05-01 10:35:00'),
(3, 2, 'ENV', '바질 환경 기준 2026-05', 'ACTIVE', '2026-05-01', NULL, '2026-05-01 10:40:00'),
(4, 2, 'QUALITY', '바질 품질 기준 2026-05', 'ACTIVE', '2026-05-01', NULL, '2026-05-01 10:45:00');

-- =========================================================
-- 4. 기준 항목
-- fail_rate: 정상 범위를 벗어난 뒤 FAIL로 전환하는 이탈률 기준
-- =========================================================

INSERT INTO `standard_item`
(`standard_item_id`, `standard_set_id`, `item_code`, `item_name`, `item_group`, `standard_min`, `standard_max`, `target_value`, `unit`, `value_type`, `fail_rate`, `sort_order`, `use_yn`, `created_at`)
VALUES
-- 상추 환경 기준
(1, 1, 'TEMP', '온도', 'AIR', 20.00, 24.00, 22.00, '℃', 'NUMBER', 10.00, 1, 'Y', '2026-05-01 10:31:00'),
(2, 1, 'HUMIDITY', '습도', 'AIR', 60.00, 75.00, 68.00, '%', 'NUMBER', 12.00, 2, 'Y', '2026-05-01 10:31:00'),
(3, 1, 'CO2', 'CO2', 'AIR', 700.00, 1000.00, 850.00, 'ppm', 'NUMBER', 15.00, 3, 'Y', '2026-05-01 10:31:00'),
(4, 1, 'VPD', 'VPD', 'AIR', 0.70, 1.20, 0.90, 'kPa', 'NUMBER', 20.00, 4, 'Y', '2026-05-01 10:31:00'),
(5, 1, 'LIGHT_INTENSITY', '조도', 'LIGHT', 12000.00, 18000.00, 15000.00, 'lux', 'NUMBER', 20.00, 5, 'Y', '2026-05-01 10:31:00'),
(6, 1, 'PHOTOPERIOD', '광주기', 'LIGHT', 14.00, 18.00, 16.00, 'hour', 'NUMBER', 15.00, 6, 'Y', '2026-05-01 10:31:00'),
(7, 1, 'LIGHT_WAVELENGTH', '광질/파장', 'LIGHT', 450.00, 660.00, 550.00, 'nm', 'TEXT', NULL, 7, 'N', '2026-05-01 10:31:00'),
(8, 1, 'PH', 'pH', 'NUTRIENT', 5.80, 6.50, 6.20, 'pH', 'NUMBER', 8.00, 8, 'Y', '2026-05-01 10:31:00'),
(9, 1, 'WATER_TEMP', '수온', 'NUTRIENT', 18.00, 22.00, 20.00, '℃', 'NUMBER', 10.00, 9, 'Y', '2026-05-01 10:31:00'),
(10, 1, 'EC', 'EC', 'NUTRIENT', 1.20, 1.80, 1.50, 'mS/cm', 'NUMBER', 12.00, 10, 'Y', '2026-05-01 10:31:00'),
-- 상추 품질 기준
(11, 2, 'PLANT_HEIGHT', '초장', 'GROWTH', 14.00, 22.00, 18.00, 'cm', 'NUMBER', 15.00, 1, 'Y', '2026-05-01 10:36:00'),
(12, 2, 'LEAF_WIDTH', '엽폭', 'GROWTH', 7.00, 12.00, 9.50, 'cm', 'NUMBER', 15.00, 2, 'Y', '2026-05-01 10:36:00'),
(13, 2, 'LEAF_LENGTH', '엽장', 'GROWTH', 10.00, 18.00, 14.00, 'cm', 'NUMBER', 15.00, 3, 'Y', '2026-05-01 10:36:00'),
(14, 2, 'FRESH_WEIGHT', '생체중', 'GROWTH', 80.00, 140.00, 110.00, 'g', 'NUMBER', 20.00, 4, 'Y', '2026-05-01 10:36:00'),
(15, 2, 'LEAF_COLOR', '엽색', 'QUALITY_TEXT', NULL, NULL, NULL, NULL, 'TEXT', NULL, 5, 'Y', '2026-05-01 10:36:00'),
(16, 2, 'GROWTH_STAGE', '생장단계', 'QUALITY_TEXT', NULL, NULL, NULL, NULL, 'TEXT', NULL, 6, 'Y', '2026-05-01 10:36:00'),
-- 바질 환경 기준
(17, 3, 'TEMP', '온도', 'AIR', 22.00, 27.00, 24.00, '℃', 'NUMBER', 10.00, 1, 'Y', '2026-05-01 10:41:00'),
(18, 3, 'HUMIDITY', '습도', 'AIR', 55.00, 70.00, 62.00, '%', 'NUMBER', 12.00, 2, 'Y', '2026-05-01 10:41:00'),
(19, 3, 'CO2', 'CO2', 'AIR', 650.00, 1000.00, 850.00, 'ppm', 'NUMBER', 15.00, 3, 'Y', '2026-05-01 10:41:00'),
(20, 3, 'VPD', 'VPD', 'AIR', 0.80, 1.30, 1.00, 'kPa', 'NUMBER', 20.00, 4, 'Y', '2026-05-01 10:41:00'),
(21, 3, 'LIGHT_INTENSITY', '조도', 'LIGHT', 14000.00, 22000.00, 18000.00, 'lux', 'NUMBER', 20.00, 5, 'Y', '2026-05-01 10:41:00'),
(22, 3, 'PHOTOPERIOD', '광주기', 'LIGHT', 14.00, 18.00, 16.00, 'hour', 'NUMBER', 15.00, 6, 'Y', '2026-05-01 10:41:00'),
(23, 3, 'LIGHT_WAVELENGTH', '광질/파장', 'LIGHT', 450.00, 660.00, 550.00, 'nm', 'TEXT', NULL, 7, 'N', '2026-05-01 10:41:00'),
(24, 3, 'PH', 'pH', 'NUTRIENT', 5.90, 6.40, 6.20, 'pH', 'NUMBER', 8.00, 8, 'Y', '2026-05-01 10:41:00'),
(25, 3, 'WATER_TEMP', '수온', 'NUTRIENT', 19.00, 23.00, 21.00, '℃', 'NUMBER', 10.00, 9, 'Y', '2026-05-01 10:41:00'),
(26, 3, 'EC', 'EC', 'NUTRIENT', 1.00, 1.60, 1.30, 'mS/cm', 'NUMBER', 12.00, 10, 'Y', '2026-05-01 10:41:00'),
-- 바질 품질 기준
(27, 4, 'PLANT_HEIGHT', '초장', 'GROWTH', 18.00, 30.00, 24.00, 'cm', 'NUMBER', 15.00, 1, 'Y', '2026-05-01 10:46:00'),
(28, 4, 'LEAF_WIDTH', '엽폭', 'GROWTH', 3.00, 6.00, 4.50, 'cm', 'NUMBER', 15.00, 2, 'Y', '2026-05-01 10:46:00'),
(29, 4, 'LEAF_LENGTH', '엽장', 'GROWTH', 4.00, 8.00, 6.00, 'cm', 'NUMBER', 15.00, 3, 'Y', '2026-05-01 10:46:00'),
(30, 4, 'FRESH_WEIGHT', '생체중', 'GROWTH', 40.00, 90.00, 65.00, 'g', 'NUMBER', 20.00, 4, 'Y', '2026-05-01 10:46:00'),
(31, 4, 'LEAF_COLOR', '엽색', 'QUALITY_TEXT', NULL, NULL, NULL, NULL, 'TEXT', NULL, 5, 'Y', '2026-05-01 10:46:00'),
(32, 4, 'GROWTH_STAGE', '생장단계', 'QUALITY_TEXT', NULL, NULL, NULL, NULL, 'TEXT', NULL, 6, 'Y', '2026-05-01 10:46:00');

-- 문자형 품질 기준값은 별도 컬럼으로 보정
UPDATE `standard_item` SET `expected_text_value` = '진녹색' WHERE `standard_item_id` IN (15, 31);
UPDATE `standard_item` SET `expected_text_value` = 'GROWING' WHERE `standard_item_id` IN (16, 32);

-- =========================================================
-- 5. 구역 / 배치
-- =========================================================

INSERT INTO `zone`
(`zone_id`, `zone_name`, `zone_status`, `area_size`, `location_desc`, `description`, `created_at`)
VALUES
(1, 'A구역', 'ACTIVE', 24.50, '1층 좌측 재배랙', '상추 주력 재배 구역', '2026-05-01 11:00:00'),
(2, 'B구역', 'ACTIVE', 18.00, '1층 우측 재배랙', '허브류 재배 구역', '2026-05-01 11:10:00'),
(3, 'C구역', 'MAINTENANCE', 15.00, '2층 테스트랙', '센서 점검 중인 테스트 구역', '2026-05-01 11:20:00');

INSERT INTO `cultivation_batch`
(`batch_id`, `zone_id`, `crop_id`, `env_standard_set_id`, `quality_standard_set_id`, `batch_name`, `batch_status`, `start_date`, `expected_end_date`, `actual_end_date`, `planted_quantity`, `created_by`, `created_at`)
VALUES
(1, 1, 1, 1, 2, 'A구역 상추 2026-05 1차', 'GROWING', '2026-05-01', '2026-05-28', NULL, 240, 1, '2026-05-01 11:30:00'),
(2, 2, 2, 3, 4, 'B구역 바질 2026-05 1차', 'GROWING', '2026-05-02', '2026-05-30', NULL, 160, 1, '2026-05-02 09:00:00'),
(3, 3, 1, 1, 2, 'C구역 상추 테스트 배치', 'PLANNED', '2026-05-10', '2026-06-05', NULL, 80, 1, '2026-05-07 14:00:00');

-- =========================================================
-- 6. 환경 로그
-- 30분 주기 시뮬레이터 데이터 예시
-- =========================================================

INSERT INTO `environment_log`
(`env_log_id`, `batch_id`, `measured_at`, `data_source`, `temperature`, `humidity`, `co2`, `vpd`, `light_intensity`, `photoperiod`, `light_wavelength`, `ph`, `water_temp`, `ec`, `env_status`, `created_at`)
VALUES
(1, 1, '2026-05-08 08:00:00', 'SIMULATOR', 22.10, 67.20, 840.00, 0.90, 15100.00, 16.00, '450nm/660nm', 6.20, 20.20, 1.52, 'NORMAL', '2026-05-08 08:00:05'),
(2, 1, '2026-05-08 08:30:00', 'SIMULATOR', 23.00, 66.50, 860.00, 0.95, 15400.00, 16.00, '450nm/660nm', 6.25, 20.30, 1.55, 'NORMAL', '2026-05-08 08:30:05'),
(3, 1, '2026-05-08 09:00:00', 'SIMULATOR', 26.80, 64.00, 875.00, 1.25, 15800.00, 16.00, '450nm/660nm', 6.22, 20.50, 1.56, 'FAIL', '2026-05-08 09:00:05'),
(4, 1, '2026-05-08 09:30:00', 'SIMULATOR', 24.80, 65.10, 860.00, 1.15, 15600.00, 16.00, '450nm/660nm', 6.21, 20.40, 1.54, 'CAUTION', '2026-05-08 09:30:05'),
(5, 1, '2026-05-08 10:00:00', 'SIMULATOR', 23.60, 66.80, 850.00, 0.98, 15300.00, 16.00, '450nm/660nm', 6.20, 20.20, 1.50, 'NORMAL', '2026-05-08 10:00:05'),
(6, 1, '2026-05-08 10:30:00', 'SIMULATOR', 22.80, 67.50, 845.00, 0.92, 15050.00, 16.00, '450nm/660nm', 6.18, 20.00, 1.48, 'NORMAL', '2026-05-08 10:30:05'),
(7, 2, '2026-05-08 08:00:00', 'SIMULATOR', 24.20, 61.50, 800.00, 1.00, 17800.00, 16.00, '450nm/660nm', 6.18, 21.20, 1.31, 'NORMAL', '2026-05-08 08:00:05'),
(8, 2, '2026-05-08 08:30:00', 'SIMULATOR', 24.70, 60.80, 810.00, 1.06, 18100.00, 16.00, '450nm/660nm', 5.72, 21.30, 1.28, 'CAUTION', '2026-05-08 08:30:05'),
(9, 2, '2026-05-08 09:00:00', 'SIMULATOR', 25.10, 60.20, 820.00, 1.10, 18300.00, 16.00, '450nm/660nm', 5.66, 21.40, 1.27, 'CAUTION', '2026-05-08 09:00:05'),
(10, 2, '2026-05-08 09:30:00', 'SIMULATOR', 24.90, 61.00, 815.00, 1.05, 18000.00, 16.00, '450nm/660nm', 5.95, 21.20, 1.29, 'NORMAL', '2026-05-08 09:30:05');

-- =========================================================
-- 7. 환경 항목별 판정
-- 화면 확인용으로 핵심 항목 중심 입력
-- =========================================================

INSERT INTO `env_evaluation_item`
(`env_eval_item_id`, `env_log_id`, `batch_id`, `standard_item_id`, `item_code`, `item_name`, `measured_value`, `standard_min`, `standard_max`, `unit`, `fail_rate`, `deviation_value`, `deviation_rate`, `eval_status`, `created_at`)
VALUES
(1, 1, 1, 1, 'TEMP', '온도', 22.10, 20.00, 24.00, '℃', 10.00, 0.00, 0.00, 'NORMAL', '2026-05-08 08:00:06'),
(2, 1, 1, 8, 'PH', 'pH', 6.20, 5.80, 6.50, 'pH', 8.00, 0.00, 0.00, 'NORMAL', '2026-05-08 08:00:06'),
(3, 2, 1, 1, 'TEMP', '온도', 23.00, 20.00, 24.00, '℃', 10.00, 0.00, 0.00, 'NORMAL', '2026-05-08 08:30:06'),
(4, 2, 1, 8, 'PH', 'pH', 6.25, 5.80, 6.50, 'pH', 8.00, 0.00, 0.00, 'NORMAL', '2026-05-08 08:30:06'),
(5, 3, 1, 1, 'TEMP', '온도', 26.80, 20.00, 24.00, '℃', 10.00, 2.80, 11.67, 'FAIL', '2026-05-08 09:00:06'),
(6, 3, 1, 4, 'VPD', 'VPD', 1.25, 0.70, 1.20, 'kPa', 20.00, 0.05, 4.17, 'CAUTION', '2026-05-08 09:00:06'),
(7, 4, 1, 1, 'TEMP', '온도', 24.80, 20.00, 24.00, '℃', 10.00, 0.80, 3.33, 'CAUTION', '2026-05-08 09:30:06'),
(8, 5, 1, 1, 'TEMP', '온도', 23.60, 20.00, 24.00, '℃', 10.00, 0.00, 0.00, 'NORMAL', '2026-05-08 10:00:06'),
(9, 6, 1, 1, 'TEMP', '온도', 22.80, 20.00, 24.00, '℃', 10.00, 0.00, 0.00, 'NORMAL', '2026-05-08 10:30:06'),
(10, 7, 2, 24, 'PH', 'pH', 6.18, 5.90, 6.40, 'pH', 8.00, 0.00, 0.00, 'NORMAL', '2026-05-08 08:00:06'),
(11, 8, 2, 24, 'PH', 'pH', 5.72, 5.90, 6.40, 'pH', 8.00, 0.18, 3.05, 'CAUTION', '2026-05-08 08:30:06'),
(12, 9, 2, 24, 'PH', 'pH', 5.66, 5.90, 6.40, 'pH', 8.00, 0.24, 4.07, 'CAUTION', '2026-05-08 09:00:06'),
(13, 10, 2, 24, 'PH', 'pH', 5.95, 5.90, 6.40, 'pH', 8.00, 0.00, 0.00, 'NORMAL', '2026-05-08 09:30:06');

-- =========================================================
-- 8. 환경 부적합 / 알림 / 조치 이력
-- A구역 온도 이탈은 정상 로그 발생으로 자동 해결 처리
-- B구역 pH 이탈은 조치 기록 후 정상 복귀 처리 예시
-- =========================================================

INSERT INTO `env_nonconformity`
(`env_nc_id`, `env_log_id`, `env_eval_item_id`, `batch_id`, `zone_id`, `crop_id`, `item_code`, `item_name`, `measured_value`, `standard_min`, `standard_max`, `deviation_value`, `deviation_rate`, `severity`, `env_nc_status`, `occurred_at`, `guide_message`, `resolved_at`, `resolved_env_log_id`, `resolved_type`, `resolved_note`, `created_at`)
VALUES
(1, 3, 5, 1, 1, 1, 'TEMP', '온도', 26.80, 20.00, 24.00, 2.80, 11.67, 'FAIL', 'RESOLVED', '2026-05-08 09:00:00', '냉방 출력을 확인하고 환기팬 가동 상태를 점검하세요.', '2026-05-08 10:00:00', 5, 'SIMULATOR_NORMAL', '10:00 시뮬레이터 데이터에서 정상 범위 복귀 확인', '2026-05-08 09:00:07'),
(2, 8, 11, 2, 2, 2, 'PH', 'pH', 5.72, 5.90, 6.40, 0.18, 3.05, 'CAUTION', 'RESOLVED', '2026-05-08 08:30:00', '양액 pH 보정제를 소량 투입하고 다음 측정값을 확인하세요.', '2026-05-08 09:30:00', 10, 'SIMULATOR_NORMAL', '09:30 시뮬레이터 데이터에서 정상 범위 복귀 확인', '2026-05-08 08:30:07');

INSERT INTO `env_alert`
(`alert_id`, `env_nc_id`, `batch_id`, `zone_id`, `alert_level`, `alert_title`, `alert_message`, `alert_status`, `notified_role`, `read_by`, `read_at`, `created_at`)
VALUES
(1, 1, 1, 1, 'FAIL', 'A구역 온도 경고', 'A구역 상추 배치의 온도가 기준 상한 24.00℃를 초과했습니다. 측정값: 26.80℃', 'READ', 'ALL', 2, '2026-05-08 09:05:00', '2026-05-08 09:00:08'),
(2, 2, 2, 2, 'CAUTION', 'B구역 pH 주의', 'B구역 바질 배치의 pH가 기준 하한 5.90보다 낮습니다. 측정값: 5.72', 'READ', 'ALL', 3, '2026-05-08 08:36:00', '2026-05-08 08:30:08');

INSERT INTO `env_action_log`
(`env_action_id`, `env_nc_id`, `action_by`, `action_type`, `action_content`, `action_status_after`, `result_note`, `action_at`, `created_at`)
VALUES
(1, 1, 2, 'CONTROL_ADJUSTED', 'A구역 냉방 설정 온도를 1℃ 낮추고 환기팬 동작 상태를 확인함.', 'IN_PROGRESS', '다음 30분 측정값에서 온도 하락 여부 확인 예정', '2026-05-08 09:08:00', '2026-05-08 09:08:10'),
(2, 2, 3, 'NUTRIENT_ADJUSTED', '양액 탱크 pH 보정제를 소량 투입하고 순환 펌프를 10분 추가 가동함.', 'IN_PROGRESS', '09:30 측정값에서 정상 복귀 확인됨', '2026-05-08 08:40:00', '2026-05-08 08:40:10');

-- =========================================================
-- 9. 실측 / 품질 데이터
-- 샘플 5개 원시값 저장 + 평균값 캐시
-- =========================================================

INSERT INTO `growth_measurement`
(`measurement_id`, `batch_id`, `measured_by`, `measured_at`, `sample_count`, `aggregation_method`, `plant_height`, `leaf_width`, `leaf_length`, `fresh_weight`, `leaf_color`, `growth_stage`, `quality_status`, `special_note`, `created_at`)
VALUES
(1, 1, 2, '2026-05-08 11:00:00', 5, 'AVG', 18.36, 9.10, 14.22, 108.80, '진녹색', 'GROWING', 'NORMAL', '상추 생육 균일도 양호. 특이 병징 없음.', '2026-05-08 11:05:00'),
(2, 2, 3, '2026-05-08 11:20:00', 5, 'AVG', 17.28, 4.20, 5.90, 57.60, '연녹색', 'GROWING', 'CAUTION', '일부 샘플에서 엽색이 다소 옅음. 광량 및 pH 이력 확인 필요.', '2026-05-08 11:25:00');

INSERT INTO `growth_measurement_sample`
(`sample_id`, `measurement_id`, `sample_no`, `plant_height`, `leaf_width`, `leaf_length`, `fresh_weight`, `leaf_color`, `growth_stage`, `special_note`, `created_at`)
VALUES
(1, 1, 1, 18.20, 9.00, 14.10, 106.00, '진녹색', 'GROWING', NULL, '2026-05-08 11:05:10'),
(2, 1, 2, 18.80, 9.40, 14.50, 112.00, '진녹색', 'GROWING', NULL, '2026-05-08 11:05:10'),
(3, 1, 3, 17.90, 8.80, 13.90, 105.00, '진녹색', 'GROWING', NULL, '2026-05-08 11:05:10'),
(4, 1, 4, 18.50, 9.30, 14.30, 110.00, '진녹색', 'GROWING', NULL, '2026-05-08 11:05:10'),
(5, 1, 5, 18.40, 9.00, 14.30, 111.00, '진녹색', 'GROWING', NULL, '2026-05-08 11:05:10'),
(6, 2, 1, 17.10, 4.10, 5.80, 55.00, '연녹색', 'GROWING', '엽색 옅음', '2026-05-08 11:25:10'),
(7, 2, 2, 17.60, 4.30, 6.10, 59.00, '연녹색', 'GROWING', NULL, '2026-05-08 11:25:10'),
(8, 2, 3, 16.90, 4.00, 5.70, 56.00, '연녹색', 'GROWING', '하엽 색 약함', '2026-05-08 11:25:10'),
(9, 2, 4, 17.40, 4.20, 6.00, 58.00, '진녹색', 'GROWING', NULL, '2026-05-08 11:25:10'),
(10, 2, 5, 17.40, 4.40, 5.90, 60.00, '연녹색', 'GROWING', NULL, '2026-05-08 11:25:10');

-- =========================================================
-- 10. 품질 평가 / 품질 부적합 / 검토 이력
-- =========================================================

INSERT INTO `quality_evaluation`
(`quality_eval_id`, `measurement_id`, `batch_id`, `crop_id`, `standard_set_id`, `evaluated_at`, `overall_status`, `normal_item_count`, `caution_item_count`, `fail_item_count`, `missing_item_count`, `sample_count`, `summary_message`, `report_reflected_yn`, `created_at`)
VALUES
(1, 1, 1, 1, 2, '2026-05-08 11:06:00', 'NORMAL', 6, 0, 0, 0, 5, '상추 품질 실측값이 기준 범위 내에 있습니다.', 'Y', '2026-05-08 11:06:00'),
(2, 2, 2, 2, 4, '2026-05-08 11:26:00', 'CAUTION', 4, 2, 0, 0, 5, '바질 초장이 기준 하한보다 낮고 엽색이 기대값보다 옅습니다.', 'Y', '2026-05-08 11:26:00');

INSERT INTO `quality_evaluation_item`
(`quality_eval_item_id`, `quality_eval_id`, `measurement_id`, `standard_item_id`, `item_code`, `item_name`, `measured_value`, `measured_text_value`, `standard_min`, `standard_max`, `expected_text_value`, `unit`, `fail_rate`, `deviation_value`, `deviation_rate`, `eval_status`, `created_at`)
VALUES
-- 상추 품질 평가: 정상
(1, 1, 1, 11, 'PLANT_HEIGHT', '초장', 18.36, NULL, 14.00, 22.00, NULL, 'cm', 15.00, 0.00, 0.00, 'NORMAL', '2026-05-08 11:06:01'),
(2, 1, 1, 12, 'LEAF_WIDTH', '엽폭', 9.10, NULL, 7.00, 12.00, NULL, 'cm', 15.00, 0.00, 0.00, 'NORMAL', '2026-05-08 11:06:01'),
(3, 1, 1, 13, 'LEAF_LENGTH', '엽장', 14.22, NULL, 10.00, 18.00, NULL, 'cm', 15.00, 0.00, 0.00, 'NORMAL', '2026-05-08 11:06:01'),
(4, 1, 1, 14, 'FRESH_WEIGHT', '생체중', 108.80, NULL, 80.00, 140.00, NULL, 'g', 20.00, 0.00, 0.00, 'NORMAL', '2026-05-08 11:06:01'),
(5, 1, 1, 15, 'LEAF_COLOR', '엽색', NULL, '진녹색', NULL, NULL, '진녹색', NULL, NULL, NULL, NULL, 'NORMAL', '2026-05-08 11:06:01'),
(6, 1, 1, 16, 'GROWTH_STAGE', '생장단계', NULL, 'GROWING', NULL, NULL, 'GROWING', NULL, NULL, NULL, NULL, 'NORMAL', '2026-05-08 11:06:01'),
-- 바질 품질 평가: 주의
(7, 2, 2, 27, 'PLANT_HEIGHT', '초장', 17.28, NULL, 18.00, 30.00, NULL, 'cm', 15.00, 0.72, 4.00, 'CAUTION', '2026-05-08 11:26:01'),
(8, 2, 2, 28, 'LEAF_WIDTH', '엽폭', 4.20, NULL, 3.00, 6.00, NULL, 'cm', 15.00, 0.00, 0.00, 'NORMAL', '2026-05-08 11:26:01'),
(9, 2, 2, 29, 'LEAF_LENGTH', '엽장', 5.90, NULL, 4.00, 8.00, NULL, 'cm', 15.00, 0.00, 0.00, 'NORMAL', '2026-05-08 11:26:01'),
(10, 2, 2, 30, 'FRESH_WEIGHT', '생체중', 57.60, NULL, 40.00, 90.00, NULL, 'g', 20.00, 0.00, 0.00, 'NORMAL', '2026-05-08 11:26:01'),
(11, 2, 2, 31, 'LEAF_COLOR', '엽색', NULL, '연녹색', NULL, NULL, '진녹색', NULL, NULL, NULL, NULL, 'CAUTION', '2026-05-08 11:26:01'),
(12, 2, 2, 32, 'GROWTH_STAGE', '생장단계', NULL, 'GROWING', NULL, NULL, 'GROWING', NULL, NULL, NULL, NULL, 'NORMAL', '2026-05-08 11:26:01');

INSERT INTO `quality_nonconformity`
(`quality_nc_id`, `quality_eval_id`, `quality_eval_item_id`, `measurement_id`, `batch_id`, `crop_id`, `item_code`, `item_name`, `measured_value`, `standard_min`, `standard_max`, `deviation_value`, `deviation_rate`, `severity`, `quality_nc_status`, `occurred_at`, `analysis_message`, `recommended_next_action`, `report_include_yn`, `created_at`)
VALUES
(1, 2, 7, 2, 2, 2, 'PLANT_HEIGHT', '초장', 17.28, 18.00, 30.00, 0.72, 4.00, 'CAUTION', 'REVIEWED', '2026-05-08 11:26:00', '최근 pH 저하 이력이 있어 양액 흡수 저하 가능성이 있습니다.', '다음 측정 전 pH 정상 유지 여부와 광량 누적값을 함께 확인하세요.', 'Y', '2026-05-08 11:26:10'),
(2, 2, 11, 2, 2, 2, 'LEAF_COLOR', '엽색', NULL, NULL, NULL, NULL, NULL, 'CAUTION', 'REVIEWED', '2026-05-08 11:26:00', '샘플 5개 중 다수의 엽색이 기대값보다 옅게 기록되었습니다.', '광량, EC, pH 이력을 함께 점검하고 다음 실측에서 재확인하세요.', 'Y', '2026-05-08 11:26:10');

INSERT INTO `quality_review_log`
(`quality_review_id`, `quality_eval_id`, `reviewed_by`, `review_at`, `review_content`, `created_at`)
VALUES
(1, 2, 1, '2026-05-08 11:40:00', 'pH 주의 이력과 엽색 저하가 같은 시간대에 관찰됨. 다음 주간 리포트에서 추세 확인 필요.', '2026-05-08 11:40:10');

-- =========================================================
-- 11. 리포트
-- 리포트는 발급 시점 스냅샷 텍스트를 저장하는 예시
-- =========================================================

INSERT INTO `report`
(`report_id`, `report_title`, `report_type`, `report_scope`, `report_status`, `report_version`, `start_date`, `end_date`, `crop_id`, `zone_id`, `batch_id`, `created_by`, `env_summary`, `quality_summary`, `env_nc_summary`, `quality_nc_summary`, `guide_summary`, `generated_condition_json`, `created_at`)
VALUES
(1, 'A구역 상추 일일 리포트 - 2026-05-08', 'DAILY', 'BATCH', 'GENERATED', 1, '2026-05-08', '2026-05-08', 1, 1, 1, 1,
 '08:00~10:30 환경 로그 6건 중 NORMAL 4건, CAUTION 1건, FAIL 1건. 10:00 이후 정상 상태 유지.',
 '실측 샘플 5개 평균 기준 품질 판정 NORMAL. 초장 18.36cm, 엽폭 9.10cm, 생체중 108.80g.',
 '09:00 온도 26.80℃로 기준 상한 24.00℃ 초과. 냉방/환기 조치 후 10:00 정상 복귀.',
 '품질 부적합 없음.',
 '온도 급상승 시점의 냉방 설정과 환기팬 상태를 재점검하고 동일 시간대 추이를 관찰하세요.',
 '{"reportType":"DAILY","scope":"BATCH","batchId":1,"startDate":"2026-05-08","endDate":"2026-05-08"}',
 '2026-05-08 12:00:00'),
(2, 'B구역 바질 일일 리포트 - 2026-05-08', 'DAILY', 'BATCH', 'GENERATED', 1, '2026-05-08', '2026-05-08', 2, 2, 2, 1,
 '08:00~09:30 환경 로그 4건 중 NORMAL 2건, CAUTION 2건. pH 하한 이탈 후 09:30 정상 복귀.',
 '실측 샘플 5개 평균 기준 품질 판정 CAUTION. 초장 17.28cm, 엽색 연녹색 기록.',
 '08:30 pH 5.72로 기준 하한 5.90 미달. 양액 보정 조치 후 정상 복귀.',
 '초장 기준 하한 미달 및 엽색 주의 기록. 품질 부적합은 교정 대상이 아닌 분석 기록으로 보관.',
 'pH 정상 유지 여부와 광량 누적값을 함께 확인하고 다음 실측에서 엽색 회복 여부를 비교하세요.',
 '{"reportType":"DAILY","scope":"BATCH","batchId":2,"startDate":"2026-05-08","endDate":"2026-05-08"}',
 '2026-05-08 12:10:00');

-- =========================================================
-- 12. 화면/API 확인용 간단 조회 예시
-- 필요 없으면 아래 SELECT는 삭제해도 됩니다.
-- =========================================================

SELECT 'user_account' AS table_name, COUNT(*) AS row_count FROM `user_account`
UNION ALL SELECT 'crop', COUNT(*) FROM `crop`
UNION ALL SELECT 'zone', COUNT(*) FROM `zone`
UNION ALL SELECT 'cultivation_batch', COUNT(*) FROM `cultivation_batch`
UNION ALL SELECT 'environment_log', COUNT(*) FROM `environment_log`
UNION ALL SELECT 'env_nonconformity', COUNT(*) FROM `env_nonconformity`
UNION ALL SELECT 'growth_measurement', COUNT(*) FROM `growth_measurement`
UNION ALL SELECT 'quality_evaluation', COUNT(*) FROM `quality_evaluation`
UNION ALL SELECT 'report', COUNT(*) FROM `report`;
