/*
 GreenQ v1.1.15 환경 시뮬레이터 스케줄러 점검용 SQL
 - 스키마를 변경하지 않습니다.
 - 자동 생성 누락 여부와 중복 여부를 확인할 때 사용합니다.
*/

-- 1) 배치별 환경 로그 범위 확인
SELECT
    batch_id,
    MIN(measured_at) AS first_measured_at,
    MAX(measured_at) AS last_measured_at,
    COUNT(*) AS log_count
FROM environment_log
WHERE COALESCE(delete_yn, 'N') <> 'Y'
GROUP BY batch_id
ORDER BY batch_id;

-- 2) 30분 슬롯별 생성 건수 확인
SELECT
    DATE_FORMAT(measured_at, '%Y-%m-%d %H:%i') AS measured_slot,
    COUNT(*) AS log_count
FROM environment_log
WHERE COALESCE(delete_yn, 'N') <> 'Y'
  AND data_source = 'SIMULATOR'
GROUP BY DATE_FORMAT(measured_at, '%Y-%m-%d %H:%i')
ORDER BY measured_slot DESC;

-- 3) 동일 배치/동일 시각 SIMULATOR 중복 확인
SELECT
    batch_id,
    measured_at,
    COUNT(*) AS duplicated_count
FROM environment_log
WHERE COALESCE(delete_yn, 'N') <> 'Y'
  AND data_source = 'SIMULATOR'
GROUP BY batch_id, measured_at
HAVING COUNT(*) > 1
ORDER BY measured_at DESC, batch_id;
