package com.greenq.service;

import com.greenq.entity.CultivationBatch;
import com.greenq.entity.EnvEvaluationItem;
import com.greenq.entity.EnvNonconformity;
import com.greenq.entity.EnvironmentLog;
import com.greenq.repository.CultivationBatchRepository;
import com.greenq.repository.EnvEvaluationItemRepository;
import com.greenq.repository.EnvNonconformityRepository;
import com.greenq.repository.EnvironmentLogRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class EnvironmentEvaluationService {
    private final CultivationBatchRepository batchRepository;
    private final EnvironmentLogRepository environmentLogRepository;
    private final EnvEvaluationItemRepository evaluationItemRepository;
    private final EnvNonconformityRepository nonconformityRepository;
    private final EnvAlertService envAlertService;
    private final Clock appClock;

    @PersistenceContext
    private EntityManager em;

    public EnvironmentEvaluationService(
            CultivationBatchRepository batchRepository,
            EnvironmentLogRepository environmentLogRepository,
            EnvEvaluationItemRepository evaluationItemRepository,
            EnvNonconformityRepository nonconformityRepository,
            EnvAlertService envAlertService,
            Clock appClock
    ) {
        this.batchRepository = batchRepository;
        this.environmentLogRepository = environmentLogRepository;
        this.evaluationItemRepository = evaluationItemRepository;
        this.nonconformityRepository = nonconformityRepository;
        this.envAlertService = envAlertService;
        this.appClock = appClock;
    }
    public EvaluationSummary evaluateSavedLog(EnvironmentLog log, String resolvedType, String resolvedNote) {
        if (log == null || log.getEnvLogId() == null) {
            throw new IllegalArgumentException("저장된 환경 로그만 평가할 수 있습니다.");
        }
        if (log.getBatchId() == null) {
            log.setEnvStatus("MISSING");
            return new EvaluationSummary(0, 0, 0, 0, List.of());
        }

        CultivationBatch batch = batchRepository.findById(log.getBatchId())
                .orElseThrow(() -> new IllegalArgumentException("환경 로그의 배치를 찾을 수 없습니다: " + log.getBatchId()));
        List<StandardSnapshot> standards = loadEnvStandards(batch);
        if (standards.isEmpty()) {
            log.setEnvStatus("MISSING");
            environmentLogRepository.save(log);
            return new EvaluationSummary(0, 0, 0, 0, List.of());
        }

        LocalDateTime evaluatedAt = now();
        LocalDateTime occurredAt = log.getMeasuredAt() == null ? evaluatedAt : log.getMeasuredAt();
        String totalStatus = "NORMAL";
        int evaluatedItems = 0;
        int meaningfulItems = 0;
        int skippedItems = 0;
        int created = 0;
        int updated = 0;
        int resolved = 0;
        List<Long> evaluationItemIds = new ArrayList<>();

        for (StandardSnapshot standard : standards) {
            BigDecimal measuredValue = measuredValueFromLog(log, standard.itemCode());
            String measuredTextValue = measuredTextValueFromLog(log, standard.itemCode());
            EvalResult result = evaluate(standard, measuredValue);
            if ("SKIPPED".equals(result.status())) {
                skippedItems++;
            } else {
                meaningfulItems++;
                totalStatus = worse(totalStatus, result.status());
            }

            EnvEvaluationItem item = new EnvEvaluationItem();
            item.setBatchId(batch.getBatchId());
            item.setEnvLogId(log.getEnvLogId());
            item.setCreatedAt(evaluatedAt);
            item.setStandardItemId(standard.standardItemId());
            item.setItemCode(standard.itemCode());
            item.setItemName(standard.itemName());
            item.setUnit(standard.unit());
            item.setStandardMin(standard.standardMin());
            item.setStandardMax(standard.standardMax());
            item.setFailRate(standard.failRate());
            item.setMeasuredValue(measuredValue);
            item.setMeasuredTextValue(measuredTextValue);
            item.setDeviationValue(result.deviationValue());
            item.setDeviationRate(result.deviationRate());
            item.setEvalStatus(result.status());
            EnvEvaluationItem savedItem = evaluationItemRepository.save(item);
            evaluationItemIds.add(savedItem.getEnvEvalItemId());
            evaluatedItems++;

            if ("NORMAL".equals(result.status())) {
                resolved += resolveOpenNonconformities(
                        batch,
                        standard.itemCode(),
                        log.getEnvLogId(),
                        occurredAt,
                        def(resolvedType, "AUTO_NORMAL"),
                        def(resolvedNote, "환경 측정값이 정상 범위로 복귀하여 자동 해결 처리되었습니다.")
                );
            } else if ("CAUTION".equals(result.status()) || "FAIL".equals(result.status())) {
                UpsertResult upsertResult = upsertNonconformity(batch, log, savedItem, standard, measuredValue, result, occurredAt);
                if (upsertResult.created()) created++; else updated++;
            }
        }

        if (meaningfulItems == 0 && skippedItems > 0) {
            totalStatus = "SKIPPED";
        }
        log.setEnvStatus(totalStatus);
        environmentLogRepository.save(log);
        return new EvaluationSummary(evaluatedItems, created, updated, resolved, evaluationItemIds);
    }

    public List<StandardSnapshot> loadEnvStandards(CultivationBatch batch) {
        if (batch == null || batch.getEnvStandardSetId() == null) return List.of();

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery("""
                select standard_item_id, item_code, item_name, unit, standard_min, standard_max, fail_rate
                from standard_item
                where standard_set_id = :standardSetId
                  and coalesce(delete_yn, 'N') <> 'Y'
                  and coalesce(use_yn, 'Y') = 'Y'
                  and value_type = 'NUMBER'
                order by sort_order, standard_item_id
                """).setParameter("standardSetId", batch.getEnvStandardSetId()).getResultList();

        return rows.stream().map(row -> new StandardSnapshot(
                toLong(row[0]),
                String.valueOf(row[1]),
                String.valueOf(row[2]),
                row[3] == null ? "" : String.valueOf(row[3]),
                toBigDecimal(row[4]),
                toBigDecimal(row[5]),
                toBigDecimal(row[6]) == null ? bd("10") : toBigDecimal(row[6])
        )).toList();
    }

    private EvalResult evaluate(StandardSnapshot standard, BigDecimal value) {
        if (isSkippedEnvItem(standard.itemCode())) {
            return new EvalResult("SKIPPED", null, null);
        }
        if (value == null) {
            return new EvalResult("MISSING", null, null);
        }
        BigDecimal min = standard.standardMin();
        BigDecimal max = standard.standardMax();
        if (min == null || max == null) {
            return new EvalResult("SKIPPED", null, null);
        }

        BigDecimal deviation = BigDecimal.ZERO;
        if (value.compareTo(min) < 0) {
            deviation = min.subtract(value);
        } else if (value.compareTo(max) > 0) {
            deviation = value.subtract(max);
        }

        if (deviation.compareTo(BigDecimal.ZERO) == 0) {
            return new EvalResult("NORMAL", BigDecimal.ZERO, BigDecimal.ZERO);
        }

        BigDecimal range = max.subtract(min).abs();
        if (range.compareTo(BigDecimal.ZERO) == 0) range = BigDecimal.ONE;
        BigDecimal deviationRate = deviation.divide(range, 4, RoundingMode.HALF_UP)
                .multiply(bd("100"))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal failRate = standard.failRate() == null ? bd("10") : standard.failRate();
        String status = deviationRate.compareTo(failRate) >= 0 ? "FAIL" : "CAUTION";
        return new EvalResult(status, deviation.setScale(2, RoundingMode.HALF_UP), deviationRate);
    }

    private UpsertResult upsertNonconformity(
            CultivationBatch batch,
            EnvironmentLog log,
            EnvEvaluationItem item,
            StandardSnapshot standard,
            BigDecimal measuredValue,
            EvalResult result,
            LocalDateTime occurredAt
    ) {
        EnvNonconformity nc = findOpenNonconformity(batch.getBatchId(), standard.itemCode());
        boolean created = nc == null;
        if (created) {
            nc = new EnvNonconformity();
            nc.setBatchId(batch.getBatchId());
            nc.setCropId(batch.getCropId());
            nc.setZoneId(batch.getZoneId());
            nc.setItemCode(standard.itemCode());
            nc.setItemName(standard.itemName());
            nc.setEnvNcStatus("OPEN");
            nc.setOccurredAt(occurredAt);
            nc.setCreatedAt(now());
            nc.setDeleteYn("N");
        }

        nc.setEnvLogId(log.getEnvLogId());
        nc.setEnvEvalItemId(item.getEnvEvalItemId());
        nc.setMeasuredValue(measuredValue);
        nc.setStandardMin(standard.standardMin());
        nc.setStandardMax(standard.standardMax());
        nc.setDeviationValue(result.deviationValue());
        nc.setDeviationRate(result.deviationRate());
        nc.setSeverity(result.status());
        nc.setGuideMessage(guideMessage(standard.itemCode(), measuredValue, standard));
        nc.setResolvedAt(null);
        nc.setResolvedEnvLogId(null);
        nc.setResolvedType(null);
        nc.setResolvedNote(null);
        if (nc.getEnvNcStatus() == null || "RESOLVED".equals(nc.getEnvNcStatus())) {
            nc.setEnvNcStatus("OPEN");
        }
        EnvNonconformity saved = nonconformityRepository.save(nc);
        envAlertService.createOrRefreshAlert(saved, created);
        return new UpsertResult(created);
    }

    private EnvNonconformity findOpenNonconformity(Long batchId, String itemCode) {
        @SuppressWarnings("unchecked")
        List<Number> ids = em.createNativeQuery("""
                select env_nc_id
                from env_nonconformity
                where batch_id = :batchId
                  and item_code = :itemCode
                  and env_nc_status <> 'RESOLVED'
                  and coalesce(delete_yn, 'N') <> 'Y'
                order by occurred_at desc, env_nc_id desc
                limit 1
                """)
                .setParameter("batchId", batchId)
                .setParameter("itemCode", itemCode)
                .getResultList();
        if (ids.isEmpty()) return null;
        return nonconformityRepository.findById(ids.get(0).longValue()).orElse(null);
    }

    private int resolveOpenNonconformities(
            CultivationBatch batch,
            String itemCode,
            Long resolvedLogId,
            LocalDateTime resolvedAt,
            String resolvedType,
            String resolvedNote
    ) {
        @SuppressWarnings("unchecked")
        List<Number> ids = em.createNativeQuery("""
                select env_nc_id
                from env_nonconformity
                where batch_id = :batchId
                  and item_code = :itemCode
                  and env_nc_status <> 'RESOLVED'
                  and coalesce(delete_yn, 'N') <> 'Y'
                """)
                .setParameter("batchId", batch.getBatchId())
                .setParameter("itemCode", itemCode)
                .getResultList();

        int count = 0;
        for (Number id : ids) {
            EnvNonconformity nc = nonconformityRepository.findById(id.longValue()).orElse(null);
            if (nc == null) continue;
            nc.setEnvNcStatus("RESOLVED");
            nc.setResolvedAt(resolvedAt);
            nc.setResolvedEnvLogId(resolvedLogId);
            nc.setResolvedType(resolvedType);
            nc.setResolvedNote(resolvedNote);
            envAlertService.closeResolvedAlerts(nc.getEnvNcId());
            count++;
        }
        return count;
    }

    private BigDecimal measuredValueFromLog(EnvironmentLog log, String itemCode) {
        String code = normalizeItemCode(itemCode);
        return switch (code) {
            case "TEMP", "TEMPERATURE" -> log.getTemperature();
            case "HUMIDITY" -> log.getHumidity();
            case "PH" -> log.getPh();
            case "EC" -> log.getEc();
            case "CO2" -> log.getCo2();
            case "VPD" -> log.getVpd();
            case "LIGHT", "LIGHT_INTENSITY" -> log.getLightIntensity();
            case "PHOTOPERIOD" -> log.getPhotoperiod();
            case "WATER_TEMP" -> log.getWaterTemp();
            default -> null;
        };
    }

    private String measuredTextValueFromLog(EnvironmentLog log, String itemCode) {
        String code = normalizeItemCode(itemCode);
        return switch (code) {
            case "LIGHT_WAVELENGTH", "WAVELENGTH" -> log.getLightWavelength();
            default -> null;
        };
    }

    private boolean isSkippedEnvItem(String itemCode) {
        String code = normalizeItemCode(itemCode);
        return "LIGHT_WAVELENGTH".equals(code) || "WAVELENGTH".equals(code);
    }

    private String normalizeItemCode(String itemCode) {
        return itemCode == null ? "" : itemCode.trim().toUpperCase();
    }

    private String guideMessage(String itemCode, BigDecimal value, StandardSnapshot standard) {
        if (value == null || standard.standardMin() == null || standard.standardMax() == null) {
            return standard.itemName() + " 값 확인이 필요합니다.";
        }
        String direction = value.compareTo(standard.standardMin()) < 0 ? "낮음" : "높음";
        return switch ((itemCode == null ? "" : itemCode).toUpperCase()) {
            case "TEMP", "TEMPERATURE" -> "온도 " + direction + " 상태입니다. 냉난방 및 환기 설정을 확인합니다.";
            case "HUMIDITY" -> "습도 " + direction + " 상태입니다. 가습/제습 및 환기 상태를 확인합니다.";
            case "PH" -> "pH " + direction + " 상태입니다. 양액 pH 보정이 필요합니다.";
            case "EC" -> "EC " + direction + " 상태입니다. 양액 농도와 급액 상태를 확인합니다.";
            case "CO2" -> "CO2 " + direction + " 상태입니다. 환기 및 CO2 공급 설정을 확인합니다.";
            case "VPD" -> "VPD " + direction + " 상태입니다. 온습도 균형을 확인합니다.";
            case "LIGHT", "LIGHT_INTENSITY" -> "광량 " + direction + " 상태입니다. 조명 출력과 점등 상태를 확인합니다.";
            case "PHOTOPERIOD" -> "광주기 " + direction + " 상태입니다. 조명 스케줄을 확인합니다.";
            case "WATER_TEMP" -> "수온 " + direction + " 상태입니다. 양액 탱크 온도와 냉각/가온 상태를 확인합니다.";
            default -> standard.itemName() + " 값이 기준 범위를 벗어났습니다. 설비 상태를 확인합니다.";
        };
    }

    private String worse(String a, String b) {
        return rank(b) > rank(a) ? b : a;
    }

    private int rank(String status) {
        return switch (status) {
            case "FAIL" -> 4;
            case "CAUTION" -> 3;
            case "MISSING" -> 2;
            case "SKIPPED" -> 0;
            default -> 0;
        };
    }

    private static String def(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value;
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }

    private static Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();
        return Long.valueOf(String.valueOf(value));
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        return new BigDecimal(String.valueOf(value));
    }

    private LocalDateTime now() {
        return LocalDateTime.now(appClock).withNano(0);
    }

    public record EvaluationSummary(
            int evaluatedItems,
            int createdNonconformities,
            int updatedNonconformities,
            int resolvedNonconformities,
            List<Long> evaluationItemIds
    ) {}

    public record StandardSnapshot(
            Long standardItemId,
            String itemCode,
            String itemName,
            String unit,
            BigDecimal standardMin,
            BigDecimal standardMax,
            BigDecimal failRate
    ) {}

    private record EvalResult(String status, BigDecimal deviationValue, BigDecimal deviationRate) {}

    private record UpsertResult(boolean created) {}
}
