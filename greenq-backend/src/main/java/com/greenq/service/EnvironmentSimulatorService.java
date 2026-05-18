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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Transactional
public class EnvironmentSimulatorService {
    private final CultivationBatchRepository batchRepository;
    private final EnvironmentLogRepository environmentLogRepository;
    private final EnvEvaluationItemRepository evaluationItemRepository;
    private final EnvNonconformityRepository nonconformityRepository;

    @PersistenceContext
    private EntityManager em;

    public EnvironmentSimulatorService(
            CultivationBatchRepository batchRepository,
            EnvironmentLogRepository environmentLogRepository,
            EnvEvaluationItemRepository evaluationItemRepository,
            EnvNonconformityRepository nonconformityRepository
    ) {
        this.batchRepository = batchRepository;
        this.environmentLogRepository = environmentLogRepository;
        this.evaluationItemRepository = evaluationItemRepository;
        this.nonconformityRepository = nonconformityRepository;
    }

    @Scheduled(cron = "0 0,30 * * * *", zone = "Asia/Seoul")
    public void runEveryThirtyMinutes() {
        generateAt(false, null, currentHalfHourSlot(), true);
    }

    public Map<String, Object> generate(boolean forceAbnormal, Long batchId) {
        return generateAt(forceAbnormal, batchId, LocalDateTime.now(), false);
    }

    private Map<String, Object> generateAt(boolean forceAbnormal, Long batchId, LocalDateTime measuredAt, boolean fixedSlot) {
        LocalDateTime now = normalizeMeasuredAt(measuredAt, fixedSlot);
        LocalDateTime createdAt = LocalDateTime.now().withNano(0);
        String dataSource = fixedSlot ? "SIMULATOR" : "SIMULATOR_TEST";
        List<CultivationBatch> targetBatches = batchRepository.findAll().stream()
                .filter(batch -> !"Y".equalsIgnoreCase(nvl(batch.getDeleteYn(), "N")))
                .filter(batch -> "GROWING".equalsIgnoreCase(nvl(batch.getBatchStatus(), "")))
                .filter(batch -> batchId == null || Objects.equals(batch.getBatchId(), batchId))
                .sorted(Comparator.comparing(CultivationBatch::getBatchId))
                .toList();

        int logCount = 0;
        int ncCreatedCount = 0;
        int resolvedCount = 0;
        List<Long> createdLogIds = new ArrayList<>();

        for (int batchIndex = 0; batchIndex < targetBatches.size(); batchIndex++) {
            CultivationBatch batch = targetBatches.get(batchIndex);
            List<StandardSnapshot> standards = loadEnvStandards(batch);
            if (standards.isEmpty()) {
                continue;
            }

            String abnormalCode = null;
            if (forceAbnormal) {
                abnormalCode = pickAbnormalCode(standards, batchIndex);
            }

            if (fixedSlot && !forceAbnormal && existsSimulatorLogForSlot(batch.getBatchId(), now)) {
                continue;
            }

            EnvironmentLog log = new EnvironmentLog();
            log.setBatchId(batch.getBatchId());
            log.setMeasuredAt(now);
            log.setCreatedAt(createdAt);
            log.setDataSource(dataSource);
            log.setDeleteYn("N");

            List<EvalDraft> drafts = new ArrayList<>();
            String totalStatus = "NORMAL";

            for (StandardSnapshot standard : standards) {
                BigDecimal measuredValue = makeMeasuredValue(standard, Objects.equals(standard.itemCode(), abnormalCode));
                applyValueToLog(log, standard.itemCode(), measuredValue);

                EvalResult result = evaluate(standard, measuredValue);
                totalStatus = worse(totalStatus, result.status());
                drafts.add(new EvalDraft(standard, measuredValue, result));
            }

            if (log.getCo2() == null) log.setCo2(randomDecimal(700, 900, 0));
            if (log.getVpd() == null) log.setVpd(randomDecimal(0.70, 1.20, 2));
            if (log.getLightIntensity() == null) log.setLightIntensity(randomDecimal(12000, 18000, 0));
            if (log.getPhotoperiod() == null) log.setPhotoperiod(randomDecimal(14, 18, 1));
            if (log.getWaterTemp() == null) log.setWaterTemp(randomDecimal(18, 22, 1));
            if (log.getLightWavelength() == null) log.setLightWavelength("450nm/660nm");

            log.setEnvStatus(totalStatus);
            EnvironmentLog savedLog = environmentLogRepository.save(log);
            createdLogIds.add(savedLog.getEnvLogId());
            logCount++;

            for (EvalDraft draft : drafts) {
                EnvEvaluationItem item = new EnvEvaluationItem();
                item.setBatchId(batch.getBatchId());
                item.setEnvLogId(savedLog.getEnvLogId());
                item.setCreatedAt(createdAt);
                item.setStandardItemId(draft.standard().standardItemId());
                item.setItemCode(draft.standard().itemCode());
                item.setItemName(draft.standard().itemName());
                item.setUnit(draft.standard().unit());
                item.setStandardMin(draft.standard().standardMin());
                item.setStandardMax(draft.standard().standardMax());
                item.setFailRate(draft.standard().failRate());
                item.setMeasuredValue(draft.measuredValue());
                item.setDeviationValue(draft.result().deviationValue());
                item.setDeviationRate(draft.result().deviationRate());
                item.setEvalStatus(draft.result().status());
                EnvEvaluationItem savedItem = evaluationItemRepository.save(item);

                if ("NORMAL".equals(draft.result().status())) {
                    resolvedCount += resolveOpenNonconformities(batch, draft.standard().itemCode(), savedLog.getEnvLogId(), now);
                    continue;
                }

                createNonconformity(batch, savedLog, savedItem, draft, now);
                ncCreatedCount++;
            }
        }

        return Map.of(
                "generatedLogs", logCount,
                "createdNonconformities", ncCreatedCount,
                "resolvedNonconformities", resolvedCount,
                "createdLogIds", createdLogIds
        );
    }

    private LocalDateTime currentHalfHourSlot() {
        LocalDateTime now = LocalDateTime.now().withSecond(0).withNano(0);
        int minute = now.getMinute() < 30 ? 0 : 30;
        return now.withMinute(minute);
    }

    private LocalDateTime normalizeMeasuredAt(LocalDateTime measuredAt, boolean fixedSlot) {
        LocalDateTime base = measuredAt == null ? LocalDateTime.now() : measuredAt;
        if (fixedSlot) {
            return base.withSecond(0).withNano(0);
        }
        return base.withNano(0);
    }

    private boolean existsSimulatorLogForSlot(Long batchId, LocalDateTime measuredAt) {
        Number count = (Number) em.createNativeQuery("""
                select count(*)
                from environment_log
                where batch_id = :batchId
                  and measured_at = :measuredAt
                  and data_source = 'SIMULATOR'
                  and coalesce(delete_yn, 'N') <> 'Y'
                """)
                .setParameter("batchId", batchId)
                .setParameter("measuredAt", measuredAt)
                .getSingleResult();
        return count.longValue() > 0;
    }

    private List<StandardSnapshot> loadEnvStandards(CultivationBatch batch) {
        if (batch.getEnvStandardSetId() == null) return List.of();

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
        )).filter(row -> row.standardMin() != null && row.standardMax() != null).toList();
    }

    private String pickAbnormalCode(List<StandardSnapshot> standards, int batchIndex) {
        List<String> priority = List.of("TEMP", "HUMIDITY", "EC", "PH");
        for (int i = 0; i < priority.size(); i++) {
            String code = priority.get((batchIndex + i) % priority.size());
            Optional<StandardSnapshot> found = standards.stream().filter(s -> code.equalsIgnoreCase(s.itemCode())).findFirst();
            if (found.isPresent()) return found.get().itemCode();
        }
        return standards.get(batchIndex % standards.size()).itemCode();
    }

    private BigDecimal makeMeasuredValue(StandardSnapshot standard, boolean abnormal) {
        BigDecimal min = standard.standardMin();
        BigDecimal max = standard.standardMax();
        BigDecimal range = max.subtract(min).abs();
        if (range.compareTo(BigDecimal.ZERO) == 0) range = BigDecimal.ONE;

        if (!abnormal) {
            double low = min.doubleValue() + range.doubleValue() * 0.20;
            double high = max.doubleValue() - range.doubleValue() * 0.20;
            return randomDecimal(low, high, scaleFor(standard.itemCode()));
        }

        BigDecimal failRate = standard.failRate() == null ? bd("10") : standard.failRate();
        BigDecimal failGap = range.multiply(failRate).divide(bd("100"), 4, RoundingMode.HALF_UP);
        BigDecimal overGap = failGap.add(range.multiply(bd("0.15")));
        boolean goHigh = ThreadLocalRandom.current().nextBoolean();
        BigDecimal value = goHigh ? max.add(overGap) : min.subtract(overGap);
        return value.setScale(scaleFor(standard.itemCode()), RoundingMode.HALF_UP);
    }

    private EvalResult evaluate(StandardSnapshot standard, BigDecimal value) {
        BigDecimal min = standard.standardMin();
        BigDecimal max = standard.standardMax();
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
        BigDecimal deviationRate = deviation.divide(range, 4, RoundingMode.HALF_UP).multiply(bd("100")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal failRate = standard.failRate() == null ? bd("10") : standard.failRate();
        String status = deviationRate.compareTo(failRate) >= 0 ? "FAIL" : "CAUTION";
        return new EvalResult(status, deviation.setScale(2, RoundingMode.HALF_UP), deviationRate);
    }

    private void createNonconformity(CultivationBatch batch, EnvironmentLog log, EnvEvaluationItem item, EvalDraft draft, LocalDateTime now) {
        EnvNonconformity nc = new EnvNonconformity();
        nc.setBatchId(batch.getBatchId());
        nc.setCropId(batch.getCropId());
        nc.setZoneId(batch.getZoneId());
        nc.setEnvLogId(log.getEnvLogId());
        nc.setEnvEvalItemId(item.getEnvEvalItemId());
        nc.setItemCode(draft.standard().itemCode());
        nc.setItemName(draft.standard().itemName());
        nc.setMeasuredValue(draft.measuredValue());
        nc.setStandardMin(draft.standard().standardMin());
        nc.setStandardMax(draft.standard().standardMax());
        nc.setDeviationValue(draft.result().deviationValue());
        nc.setDeviationRate(draft.result().deviationRate());
        nc.setSeverity(draft.result().status());
        nc.setEnvNcStatus("OPEN");
        nc.setGuideMessage(guideMessage(draft.standard().itemCode(), draft.measuredValue(), draft.standard()));
        nc.setOccurredAt(now);
        nc.setCreatedAt(LocalDateTime.now().withNano(0));
        nc.setDeleteYn("N");
        nonconformityRepository.save(nc);
    }

    private int resolveOpenNonconformities(CultivationBatch batch, String itemCode, Long resolvedLogId, LocalDateTime now) {
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
            nc.setResolvedAt(now);
            nc.setResolvedEnvLogId(resolvedLogId);
            nc.setResolvedType("SIMULATOR_NORMAL");
            nc.setResolvedNote("다음 시뮬레이터 측정값이 정상 범위로 복귀하여 자동 해결 처리되었습니다.");
            count++;
        }
        return count;
    }

    private void applyValueToLog(EnvironmentLog log, String itemCode, BigDecimal value) {
        String code = itemCode == null ? "" : itemCode.toUpperCase();
        switch (code) {
            case "TEMP", "TEMPERATURE" -> log.setTemperature(value);
            case "HUMIDITY" -> log.setHumidity(value);
            case "PH" -> log.setPh(value);
            case "EC" -> log.setEc(value);
            case "CO2" -> log.setCo2(value);
            case "VPD" -> log.setVpd(value);
            case "LIGHT", "LIGHT_INTENSITY" -> log.setLightIntensity(value);
            case "PHOTOPERIOD" -> log.setPhotoperiod(value);
            case "WATER_TEMP" -> log.setWaterTemp(value);
            default -> { }
        }
    }

    private String guideMessage(String itemCode, BigDecimal value, StandardSnapshot standard) {
        String direction = value.compareTo(standard.standardMin()) < 0 ? "낮음" : "높음";
        return switch ((itemCode == null ? "" : itemCode).toUpperCase()) {
            case "TEMP", "TEMPERATURE" -> "온도 " + direction + " 상태입니다. 냉난방 및 환기 설정을 확인합니다.";
            case "HUMIDITY" -> "습도 " + direction + " 상태입니다. 가습/제습 및 환기 상태를 확인합니다.";
            case "PH" -> "pH " + direction + " 상태입니다. 양액 pH 보정이 필요합니다.";
            case "EC" -> "EC " + direction + " 상태입니다. 양액 농도와 급액 상태를 확인합니다.";
            default -> standard.itemName() + " 값이 기준 범위를 벗어났습니다. 설비 상태를 확인합니다.";
        };
    }

    private String worse(String a, String b) {
        return rank(b) > rank(a) ? b : a;
    }

    private int rank(String status) {
        return switch (status) {
            case "FAIL" -> 3;
            case "CAUTION" -> 2;
            case "MISSING" -> 1;
            default -> 0;
        };
    }

    private BigDecimal randomDecimal(double min, double max, int scale) {
        double value = ThreadLocalRandom.current().nextDouble(min, max);
        return BigDecimal.valueOf(value).setScale(scale, RoundingMode.HALF_UP);
    }

    private int scaleFor(String itemCode) {
        String code = itemCode == null ? "" : itemCode.toUpperCase();
        if ("PH".equals(code) || "EC".equals(code) || "VPD".equals(code)) return 2;
        if ("CO2".equals(code) || "LIGHT".equals(code) || "LIGHT_INTENSITY".equals(code)) return 0;
        return 1;
    }

    private static String nvl(String value, String defaultValue) {
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

    private record StandardSnapshot(
            Long standardItemId,
            String itemCode,
            String itemName,
            String unit,
            BigDecimal standardMin,
            BigDecimal standardMax,
            BigDecimal failRate
    ) {}

    private record EvalResult(String status, BigDecimal deviationValue, BigDecimal deviationRate) {}

    private record EvalDraft(StandardSnapshot standard, BigDecimal measuredValue, EvalResult result) {}
}
