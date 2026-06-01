package com.greenq.service;

import com.greenq.entity.CultivationBatch;
import com.greenq.entity.EnvironmentLog;
import com.greenq.repository.CultivationBatchRepository;
import com.greenq.repository.EnvironmentLogRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Transactional
public class EnvironmentSimulatorService {
    private static final Logger log = LoggerFactory.getLogger(EnvironmentSimulatorService.class);
    private static final int MAX_CATCH_UP_SLOTS_PER_BATCH = 96;

    private final CultivationBatchRepository batchRepository;
    private final EnvironmentLogRepository environmentLogRepository;
    private final EnvironmentEvaluationService environmentEvaluationService;

    @PersistenceContext
    private EntityManager em;

    public EnvironmentSimulatorService(
            CultivationBatchRepository batchRepository,
            EnvironmentLogRepository environmentLogRepository,
            EnvironmentEvaluationService environmentEvaluationService
    ) {
        this.batchRepository = batchRepository;
        this.environmentLogRepository = environmentLogRepository;
        this.environmentEvaluationService = environmentEvaluationService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void catchUpOnApplicationReady() {
        catchUpMissingSimulatorLogs("STARTUP");
    }

    @Scheduled(cron = "0 0,30 * * * *", zone = "Asia/Seoul")
    public void runEveryThirtyMinutes() {
        catchUpMissingSimulatorLogs("SCHEDULED");
    }
    public Map<String, Object> catchUpMissingSimulatorLogs(String trigger) {
        LocalDateTime targetSlot = currentHalfHourSlot();
        List<CultivationBatch> targetBatches = findGrowingBatches(null);

        int generatedSlots = 0;
        int skippedExistingSlots = 0;
        int cappedBatches = 0;
        int generatedLogs = 0;
        int evaluatedItems = 0;
        int createdNonconformities = 0;
        int updatedNonconformities = 0;
        int resolvedNonconformities = 0;
        List<Long> createdLogIds = new ArrayList<>();

        for (CultivationBatch batch : targetBatches) {
            LocalDateTime latestSlot = findLatestSimulatorMeasuredAt(batch.getBatchId());
            LocalDateTime nextSlot = latestSlot == null ? targetSlot : nextHalfHourSlot(latestSlot);
            if (nextSlot.isAfter(targetSlot)) {
                continue;
            }

            int slotCount = countHalfHourSlots(nextSlot, targetSlot);
            if (slotCount > MAX_CATCH_UP_SLOTS_PER_BATCH) {
                cappedBatches++;
                nextSlot = targetSlot.minusMinutes((long) (MAX_CATCH_UP_SLOTS_PER_BATCH - 1) * 30L);
                nextSlot = alignToHalfHourFloor(nextSlot);
            }

            for (LocalDateTime slot = nextSlot; !slot.isAfter(targetSlot); slot = slot.plusMinutes(30)) {
                if (existsSimulatorLogForSlot(batch.getBatchId(), slot)) {
                    skippedExistingSlots++;
                    continue;
                }
                Map<String, Object> result = generateAt(false, batch.getBatchId(), slot, true);
                int logs = toInt(result.get("generatedLogs"));
                if (logs > 0) {
                    generatedSlots++;
                    generatedLogs += logs;
                    evaluatedItems += toInt(result.get("evaluatedItems"));
                    createdNonconformities += toInt(result.get("createdNonconformities"));
                    updatedNonconformities += toInt(result.get("updatedNonconformities"));
                    resolvedNonconformities += toInt(result.get("resolvedNonconformities"));
                    Object ids = result.get("createdLogIds");
                    if (ids instanceof List<?> list) {
                        for (Object id : list) {
                            if (id instanceof Number number) createdLogIds.add(number.longValue());
                        }
                    }
                }
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("trigger", trigger == null ? "UNKNOWN" : trigger);
        summary.put("targetSlot", targetSlot);
        summary.put("targetBatches", targetBatches.size());
        summary.put("generatedSlots", generatedSlots);
        summary.put("generatedLogs", generatedLogs);
        summary.put("evaluatedItems", evaluatedItems);
        summary.put("createdNonconformities", createdNonconformities);
        summary.put("updatedNonconformities", updatedNonconformities);
        summary.put("resolvedNonconformities", resolvedNonconformities);
        summary.put("skippedExistingSlots", skippedExistingSlots);
        summary.put("cappedBatches", cappedBatches);
        summary.put("createdLogIds", createdLogIds);

        log.info("GreenQ environment simulator catch-up completed: {}", summary);
        return summary;
    }

    public Map<String, Object> generate(boolean forceAbnormal, Long batchId) {
        return generateAt(forceAbnormal, batchId, LocalDateTime.now(), false);
    }

    private Map<String, Object> generateAt(boolean forceAbnormal, Long batchId, LocalDateTime measuredAt, boolean fixedSlot) {
        LocalDateTime now = normalizeMeasuredAt(measuredAt, fixedSlot);
        LocalDateTime createdAt = LocalDateTime.now().withNano(0);
        String dataSource = fixedSlot ? "SIMULATOR" : "SIMULATOR_TEST";
        List<CultivationBatch> targetBatches = findGrowingBatches(batchId);

        int logCount = 0;
        int ncCreatedCount = 0;
        int ncUpdatedCount = 0;
        int resolvedCount = 0;
        int evaluatedItemCount = 0;
        List<Long> createdLogIds = new ArrayList<>();

        for (int batchIndex = 0; batchIndex < targetBatches.size(); batchIndex++) {
            CultivationBatch batch = targetBatches.get(batchIndex);
            List<EnvironmentEvaluationService.StandardSnapshot> standards = environmentEvaluationService.loadEnvStandards(batch).stream()
                    .filter(row -> row.standardMin() != null && row.standardMax() != null)
                    .toList();
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

            for (EnvironmentEvaluationService.StandardSnapshot standard : standards) {
                BigDecimal measuredValue = makeMeasuredValue(standard, Objects.equals(standard.itemCode(), abnormalCode));
                applyValueToLog(log, standard.itemCode(), measuredValue);
            }

            if (log.getCo2() == null) log.setCo2(randomDecimal(700, 900, 0));
            if (log.getVpd() == null) log.setVpd(randomDecimal(0.70, 1.20, 2));
            if (log.getLightIntensity() == null) log.setLightIntensity(randomDecimal(12000, 18000, 0));
            if (log.getPhotoperiod() == null) log.setPhotoperiod(randomDecimal(14, 18, 1));
            if (log.getWaterTemp() == null) log.setWaterTemp(randomDecimal(18, 22, 1));
            if (log.getLightWavelength() == null) log.setLightWavelength("450nm/660nm");

            log.setEnvStatus("MISSING");
            EnvironmentLog savedLog = environmentLogRepository.save(log);
            EnvironmentEvaluationService.EvaluationSummary summary = environmentEvaluationService.evaluateSavedLog(
                    savedLog,
                    "SIMULATOR_NORMAL",
                    "다음 시뮬레이터 측정값이 정상 범위로 복귀하여 자동 해결 처리되었습니다."
            );

            createdLogIds.add(savedLog.getEnvLogId());
            logCount++;
            evaluatedItemCount += summary.evaluatedItems();
            ncCreatedCount += summary.createdNonconformities();
            ncUpdatedCount += summary.updatedNonconformities();
            resolvedCount += summary.resolvedNonconformities();
        }

        return Map.of(
                "generatedLogs", logCount,
                "evaluatedItems", evaluatedItemCount,
                "createdNonconformities", ncCreatedCount,
                "updatedNonconformities", ncUpdatedCount,
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

    private List<CultivationBatch> findGrowingBatches(Long batchId) {
        return batchRepository.findAll().stream()
                .filter(batch -> !"Y".equalsIgnoreCase(nvl(batch.getDeleteYn(), "N")))
                .filter(batch -> "GROWING".equalsIgnoreCase(nvl(batch.getBatchStatus(), "")))
                .filter(batch -> batchId == null || Objects.equals(batch.getBatchId(), batchId))
                .sorted(Comparator.comparing(CultivationBatch::getBatchId))
                .toList();
    }

    private LocalDateTime findLatestSimulatorMeasuredAt(Long batchId) {
        Object result = em.createNativeQuery("""
                select max(measured_at)
                from environment_log
                where batch_id = :batchId
                  and data_source = 'SIMULATOR'
                  and coalesce(delete_yn, 'N') <> 'Y'
                """)
                .setParameter("batchId", batchId)
                .getSingleResult();
        return toLocalDateTime(result);
    }

    private LocalDateTime nextHalfHourSlot(LocalDateTime measuredAt) {
        return alignToHalfHourFloor(measuredAt).plusMinutes(30);
    }

    private LocalDateTime alignToHalfHourFloor(LocalDateTime value) {
        LocalDateTime base = (value == null ? LocalDateTime.now() : value).withSecond(0).withNano(0);
        int minute = base.getMinute() < 30 ? 0 : 30;
        return base.withMinute(minute);
    }

    private int countHalfHourSlots(LocalDateTime fromInclusive, LocalDateTime toInclusive) {
        if (fromInclusive == null || toInclusive == null || fromInclusive.isAfter(toInclusive)) return 0;
        long minutes = java.time.Duration.between(fromInclusive, toInclusive).toMinutes();
        return (int) (minutes / 30L) + 1;
    }

    private LocalDateTime toLocalDateTime(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDateTime localDateTime) return localDateTime.withSecond(0).withNano(0);
        if (value instanceof Timestamp timestamp) return timestamp.toLocalDateTime().withSecond(0).withNano(0);
        return LocalDateTime.parse(value.toString().replace(' ', 'T')).withSecond(0).withNano(0);
    }

    private String pickAbnormalCode(List<EnvironmentEvaluationService.StandardSnapshot> standards, int batchIndex) {
        List<String> priority = List.of("TEMP", "HUMIDITY", "EC", "PH");
        for (int i = 0; i < priority.size(); i++) {
            String code = priority.get((batchIndex + i) % priority.size());
            Optional<EnvironmentEvaluationService.StandardSnapshot> found = standards.stream().filter(s -> code.equalsIgnoreCase(s.itemCode())).findFirst();
            if (found.isPresent()) return found.get().itemCode();
        }
        return standards.get(batchIndex % standards.size()).itemCode();
    }

    private BigDecimal makeMeasuredValue(EnvironmentEvaluationService.StandardSnapshot standard, boolean abnormal) {
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

    private static int toInt(Object value) {
        if (value instanceof Number number) return number.intValue();
        if (value == null) return 0;
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }
}
