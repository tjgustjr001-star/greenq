-- GreenQ v1.1.12 QR 기반 배치 접근 기능 보정 SQL
-- 기존 DB를 유지한 채 패치하는 경우 1회 실행하세요.

ALTER TABLE cultivation_batch
  ADD COLUMN IF NOT EXISTS qr_token VARCHAR(64) NULL COMMENT 'QR 접근 토큰 / 작업자 실측 입력 진입용 배치별 토큰';

UPDATE cultivation_batch
SET qr_token = CONCAT('qr_batch_', batch_id, '_', REPLACE(UUID(), '-', ''))
WHERE qr_token IS NULL OR qr_token = '';

CREATE UNIQUE INDEX IF NOT EXISTS uk_cultivation_batch_qr_token
  ON cultivation_batch (qr_token);
