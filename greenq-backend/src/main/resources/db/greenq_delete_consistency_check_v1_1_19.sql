-- GreenQ v1.1.19 삭제 정합성 점검 SQL
-- DB를 변경하지 않고, 임시 삭제 후 운영 화면에 남을 수 있는 참조 데이터를 확인합니다.

-- 1) 삭제된 작물/구역을 참조하는 활성 배치
SELECT
    b.batch_id,
    b.batch_name,
    c.crop_name,
    c.delete_yn AS crop_deleted,
    z.zone_name,
    z.delete_yn AS zone_deleted
FROM cultivation_batch b
JOIN crop c ON c.crop_id = b.crop_id
JOIN zone z ON z.zone_id = b.zone_id
WHERE COALESCE(b.delete_yn, 'N') <> 'Y'
  AND (
      COALESCE(c.delete_yn, 'N') = 'Y'
      OR COALESCE(z.delete_yn, 'N') = 'Y'
  );

-- 2) 삭제된 부모 데이터를 참조하는 활성 환경 로그
SELECT
    el.env_log_id,
    el.measured_at,
    b.batch_name,
    b.delete_yn AS batch_deleted,
    c.crop_name,
    c.delete_yn AS crop_deleted,
    z.zone_name,
    z.delete_yn AS zone_deleted
FROM environment_log el
JOIN cultivation_batch b ON b.batch_id = el.batch_id
JOIN crop c ON c.crop_id = b.crop_id
JOIN zone z ON z.zone_id = b.zone_id
WHERE COALESCE(el.delete_yn, 'N') <> 'Y'
  AND (
      COALESCE(b.delete_yn, 'N') = 'Y'
      OR COALESCE(c.delete_yn, 'N') = 'Y'
      OR COALESCE(z.delete_yn, 'N') = 'Y'
  );

-- 3) 삭제된 환경 로그를 참조하는 활성 환경 부적합
SELECT
    nc.env_nc_id,
    nc.item_name,
    el.env_log_id,
    el.delete_yn AS env_log_deleted
FROM env_nonconformity nc
JOIN environment_log el ON el.env_log_id = nc.env_log_id
WHERE COALESCE(nc.delete_yn, 'N') <> 'Y'
  AND COALESCE(el.delete_yn, 'N') = 'Y';

-- 4) 삭제된 부모 데이터를 참조하는 활성 실측 데이터
SELECT
    gm.measurement_id,
    gm.measured_at,
    b.batch_name,
    b.delete_yn AS batch_deleted,
    c.crop_name,
    c.delete_yn AS crop_deleted,
    z.zone_name,
    z.delete_yn AS zone_deleted
FROM growth_measurement gm
JOIN cultivation_batch b ON b.batch_id = gm.batch_id
JOIN crop c ON c.crop_id = b.crop_id
JOIN zone z ON z.zone_id = b.zone_id
WHERE COALESCE(gm.delete_yn, 'N') <> 'Y'
  AND (
      COALESCE(b.delete_yn, 'N') = 'Y'
      OR COALESCE(c.delete_yn, 'N') = 'Y'
      OR COALESCE(z.delete_yn, 'N') = 'Y'
  );

-- 5) 삭제된 실측을 참조하는 활성 품질 부적합
SELECT
    qn.quality_nc_id,
    qn.item_name,
    gm.measurement_id,
    gm.delete_yn AS measurement_deleted
FROM quality_nonconformity qn
JOIN growth_measurement gm ON gm.measurement_id = qn.measurement_id
WHERE COALESCE(qn.delete_yn, 'N') <> 'Y'
  AND COALESCE(gm.delete_yn, 'N') = 'Y';
