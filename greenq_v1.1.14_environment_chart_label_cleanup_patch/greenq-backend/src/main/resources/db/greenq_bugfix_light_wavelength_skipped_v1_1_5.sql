-- GreenQ v1.1.5 bugfix
-- 목적: 광질/파장(LIGHT_WAVELENGTH)은 450nm/660nm 같은 표시용 문자열 값이므로
-- 숫자 자동 판정 대상에서 제외하고, 기존 MISSING 평가/로그를 SKIPPED 또는 정상 종합 상태로 보정한다.

-- 1) 기준 마스터/기준 항목에서 광질·파장은 표시용 항목으로 정리
UPDATE measurement_item_master
SET value_type = 'TEXT'
WHERE item_code IN ('LIGHT_WAVELENGTH', 'WAVELENGTH');

UPDATE standard_item
SET value_type = 'TEXT',
    use_yn = 'N',
    fail_rate = NULL
WHERE item_code IN ('LIGHT_WAVELENGTH', 'WAVELENGTH');

-- 2) 이미 생성된 항목별 평가에서 광질·파장 누락을 제외 상태로 보정
UPDATE env_evaluation_item ei
JOIN environment_log el ON el.env_log_id = ei.env_log_id
SET ei.eval_status = 'SKIPPED',
    ei.measured_value = NULL,
    ei.measured_text_value = el.light_wavelength,
    ei.deviation_value = NULL,
    ei.deviation_rate = NULL
WHERE ei.item_code IN ('LIGHT_WAVELENGTH', 'WAVELENGTH')
  AND ei.eval_status = 'MISSING';

-- 3) SKIPPED 항목은 종합 상태 악화 요인에서 제외하여 ENVIRONMENT_LOG.env_status 재계산
UPDATE environment_log el
JOIN (
    SELECT env_log_id,
           SUM(CASE WHEN eval_status = 'FAIL' THEN 1 ELSE 0 END) AS fail_count,
           SUM(CASE WHEN eval_status = 'CAUTION' THEN 1 ELSE 0 END) AS caution_count,
           SUM(CASE WHEN eval_status = 'MISSING' THEN 1 ELSE 0 END) AS missing_count,
           SUM(CASE WHEN eval_status <> 'SKIPPED' THEN 1 ELSE 0 END) AS meaningful_count,
           SUM(CASE WHEN eval_status = 'SKIPPED' THEN 1 ELSE 0 END) AS skipped_count
    FROM env_evaluation_item
    GROUP BY env_log_id
) s ON s.env_log_id = el.env_log_id
SET el.env_status = CASE
    WHEN s.fail_count > 0 THEN 'FAIL'
    WHEN s.caution_count > 0 THEN 'CAUTION'
    WHEN s.missing_count > 0 THEN 'MISSING'
    WHEN s.meaningful_count = 0 AND s.skipped_count > 0 THEN 'SKIPPED'
    ELSE 'NORMAL'
END
WHERE COALESCE(el.delete_yn, 'N') <> 'Y';
