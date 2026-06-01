package com.greenq.service;

import com.greenq.entity.CultivationBatch;
import com.greenq.entity.GrowthMeasurement;
import com.greenq.entity.QualityEvaluation;
import com.greenq.entity.QualityEvaluationItem;
import com.greenq.entity.QualityNonconformity;
import com.greenq.repository.CultivationBatchRepository;
import com.greenq.repository.GrowthMeasurementRepository;
import com.greenq.repository.QualityEvaluationItemRepository;
import com.greenq.repository.QualityEvaluationRepository;
import com.greenq.repository.QualityNonconformityRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@Transactional
public class QualityEvaluationService {
    private final GrowthMeasurementRepository measurementRepository;
    private final CultivationBatchRepository batchRepository;
    private final QualityEvaluationRepository evaluationRepository;
    private final QualityEvaluationItemRepository evaluationItemRepository;
    private final QualityNonconformityRepository nonconformityRepository;

    @PersistenceContext
    private EntityManager em;

    public QualityEvaluationService(
            GrowthMeasurementRepository measurementRepository,
            CultivationBatchRepository batchRepository,
            QualityEvaluationRepository evaluationRepository,
            QualityEvaluationItemRepository evaluationItemRepository,
            QualityNonconformityRepository nonconformityRepository
    ) {
        this.measurementRepository = measurementRepository;
        this.batchRepository = batchRepository;
        this.evaluationRepository = evaluationRepository;
        this.evaluationItemRepository = evaluationItemRepository;
        this.nonconformityRepository = nonconformityRepository;
    }

    public QualityEvaluation evaluate(Long measurementId) {
        GrowthMeasurement measurement = measurementRepository.findById(measurementId).orElseThrow();
        CultivationBatch batch = batchRepository.findById(measurement.getBatchId()).orElseThrow();
        List<QualityStandardSnapshot> standards = loadQualityStandards(batch.getQualityStandardSetId());
        LocalDateTime now = LocalDateTime.now();

        QualityEvaluation evaluation = new QualityEvaluation();
        evaluation.setMeasurementId(measurement.getMeasurementId());
        evaluation.setBatchId(batch.getBatchId());
        evaluation.setCropId(batch.getCropId());
        evaluation.setStandardSetId(batch.getQualityStandardSetId());
        evaluation.setEvaluatedAt(now);
        evaluation.setCreatedAt(now);
        evaluation.setSampleCount(measurement.getSampleCount());
        evaluation.setReportReflectedYn("N");

        int normalCount = 0;
        int cautionCount = 0;
        int failCount = 0;
        int missingCount = 0;
        int skippedCount = 0;
        String overallStatus = "NORMAL";
        List<QualityEvaluationItem> draftItems = new ArrayList<>();

        for (QualityStandardSnapshot standard : standards) {
            QualityEvalResult result;
            QualityEvaluationItem item = new QualityEvaluationItem();
            item.setMeasurementId(measurement.getMeasurementId());
            item.setCreatedAt(now);
            item.setStandardItemId(standard.standardItemId());
            item.setItemCode(standard.itemCode());
            item.setItemName(standard.itemName());
            item.setUnit(standard.unit());
            item.setStandardMin(standard.standardMin());
            item.setStandardMax(standard.standardMax());
            item.setFailRate(standard.failRate());
            item.setExpectedTextValue(standard.expectedTextValue());

            if ("TEXT".equalsIgnoreCase(standard.valueType()) || "CATEGORY".equalsIgnoreCase(standard.valueType())) {
                String measuredText = measuredTextValue(measurement, standard.itemCode());
                item.setMeasuredTextValue(measuredText);
                result = evaluateText(standard, measuredText);
            } else {
                BigDecimal measuredValue = measuredNumericValue(measurement, standard.itemCode());
                item.setMeasuredValue(measuredValue);
                result = evaluateNumber(standard, measuredValue);
            }

            item.setEvalStatus(result.status());
            item.setDeviationValue(result.deviationValue());
            item.setDeviationRate(result.deviationRate());
            overallStatus = worse(overallStatus, result.status());
            switch (result.status()) {
                case "FAIL" -> failCount++;
                case "CAUTION" -> cautionCount++;
                case "MISSING" -> missingCount++;
                case "SKIPPED" -> skippedCount++;
                default -> normalCount++;
            }
            draftItems.add(item);
        }

        if (standards.isEmpty()) {
            overallStatus = "SKIPPED";
            skippedCount = 1;
        } else if (normalCount + cautionCount + failCount + missingCount == 0 && skippedCount > 0) {
            overallStatus = "SKIPPED";
        }

        evaluation.setNormalItemCount(normalCount);
        evaluation.setCautionItemCount(cautionCount);
        evaluation.setFailItemCount(failCount);
        evaluation.setMissingItemCount(missingCount);
        evaluation.setOverallStatus(overallStatus);
        evaluation.setSummaryMessage(makeSummary(overallStatus, normalCount, cautionCount, failCount, missingCount, skippedCount));
        QualityEvaluation savedEvaluation = evaluationRepository.save(evaluation);

        for (QualityEvaluationItem item : draftItems) {
            item.setQualityEvalId(savedEvaluation.getQualityEvalId());
            QualityEvaluationItem savedItem = evaluationItemRepository.save(item);
            if ("CAUTION".equals(item.getEvalStatus()) || "FAIL".equals(item.getEvalStatus())) {
                createQualityNonconformity(measurement, batch, savedEvaluation, savedItem, item, now);
            }
        }

        measurement.setQualityStatus(overallStatus);
        measurement.setUpdatedAt(now);
        measurementRepository.save(measurement);
        return savedEvaluation;
    }

    private void createQualityNonconformity(
            GrowthMeasurement measurement,
            CultivationBatch batch,
            QualityEvaluation evaluation,
            QualityEvaluationItem savedItem,
            QualityEvaluationItem item,
            LocalDateTime now
    ) {
        QualityNonconformity nc = new QualityNonconformity();
        nc.setMeasurementId(measurement.getMeasurementId());
        nc.setQualityEvalId(evaluation.getQualityEvalId());
        nc.setQualityEvalItemId(savedItem.getQualityEvalItemId());
        nc.setBatchId(batch.getBatchId());
        nc.setCropId(batch.getCropId());
        nc.setItemCode(item.getItemCode());
        nc.setItemName(item.getItemName());
        nc.setMeasuredValue(item.getMeasuredValue());
        nc.setStandardMin(item.getStandardMin());
        nc.setStandardMax(item.getStandardMax());
        nc.setDeviationValue(item.getDeviationValue());
        nc.setDeviationRate(item.getDeviationRate());
        nc.setSeverity(item.getEvalStatus());
        nc.setQualityNcStatus("RECORDED");
        nc.setReportIncludeYn("Y");
        nc.setOccurredAt(evaluation.getEvaluatedAt());
        nc.setCreatedAt(now);
        nc.setDeleteYn("N");
        nc.setAnalysisMessage(makeAnalysisMessage(item));
        nc.setRecommendedNextAction("다음 재배 회차에서 해당 품질 항목과 최근 환경 부적합 이력을 함께 검토하세요.");
        nonconformityRepository.save(nc);
    }

    private List<QualityStandardSnapshot> loadQualityStandards(Long standardSetId) {
        if (standardSetId == null) return List.of();
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery("""
                select standard_item_id, item_code, item_name, unit, value_type, standard_min, standard_max, fail_rate, expected_text_value
                from standard_item
                where standard_set_id = :standardSetId
                  and coalesce(delete_yn, 'N') <> 'Y'
                  and coalesce(use_yn, 'Y') = 'Y'
                order by sort_order, standard_item_id
                """).setParameter("standardSetId", standardSetId).getResultList();

        return rows.stream().map(row -> new QualityStandardSnapshot(
                toLong(row[0]),
                String.valueOf(row[1]),
                String.valueOf(row[2]),
                row[3] == null ? "" : String.valueOf(row[3]),
                row[4] == null ? "NUMBER" : String.valueOf(row[4]),
                toBigDecimal(row[5]),
                toBigDecimal(row[6]),
                toBigDecimal(row[7]) == null ? bd("10") : toBigDecimal(row[7]),
                row[8] == null ? null : String.valueOf(row[8])
        )).toList();
    }

    private QualityEvalResult evaluateNumber(QualityStandardSnapshot standard, BigDecimal value) {
        if (value == null) {
            return new QualityEvalResult("MISSING", null, null);
        }
        if (standard.standardMin() == null || standard.standardMax() == null) {
            return new QualityEvalResult("SKIPPED", null, null);
        }

        BigDecimal min = standard.standardMin();
        BigDecimal max = standard.standardMax();
        BigDecimal deviation = BigDecimal.ZERO;
        BigDecimal base = null;
        if (value.compareTo(min) < 0) {
            deviation = min.subtract(value);
            base = min;
        } else if (value.compareTo(max) > 0) {
            deviation = value.subtract(max);
            base = max;
        }

        if (deviation.compareTo(BigDecimal.ZERO) == 0) {
            return new QualityEvalResult("NORMAL", BigDecimal.ZERO, BigDecimal.ZERO);
        }

        BigDecimal rate = BigDecimal.ZERO;
        if (base != null && base.compareTo(BigDecimal.ZERO) != 0) {
            rate = deviation.divide(base.abs(), 6, RoundingMode.HALF_UP).multiply(bd("100")).setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal failRate = standard.failRate() == null ? bd("10") : standard.failRate();
        String status = rate.compareTo(failRate) >= 0 ? "FAIL" : "CAUTION";
        return new QualityEvalResult(status, deviation.setScale(2, RoundingMode.HALF_UP), rate);
    }

    private QualityEvalResult evaluateText(QualityStandardSnapshot standard, String value) {
        if (isBlank(value)) {
            return new QualityEvalResult("MISSING", null, null);
        }
        if (isBlank(standard.expectedTextValue())) {
            return new QualityEvalResult("SKIPPED", null, null);
        }
        String expected = normalizeCategoryValue(standard.itemCode(), standard.expectedTextValue());
        String measured = normalizeCategoryValue(standard.itemCode(), value);
        boolean match = expected.equalsIgnoreCase(measured);
        return new QualityEvalResult(match ? "NORMAL" : "CAUTION", match ? BigDecimal.ZERO : null, match ? BigDecimal.ZERO : null);
    }

    private String normalizeCategoryValue(String itemCode, String value) {
        if (value == null) return "";
        String text = value.trim();
        if (!"GROWTH_STAGE".equalsIgnoreCase(itemCode)) return text;
        return switch (text.toUpperCase()) {
            case "발아기", "GERMINATION" -> "GERMINATION";
            case "육묘기", "SEEDLING" -> "SEEDLING";
            case "정식기", "TRANSPLANTING" -> "TRANSPLANTING";
            case "활착기", "ROOTING" -> "ROOTING";
            case "생육기", "GROWING" -> "GROWING";
            case "수확기", "HARVEST" -> "HARVEST";
            case "종료", "END" -> "END";
            case "기타", "ETC" -> "ETC";
            default -> text;
        };
    }

    private BigDecimal measuredNumericValue(GrowthMeasurement measurement, String itemCode) {
        Map<String, BigDecimal> values = new LinkedHashMap<>();
        values.put("PLANT_HEIGHT", measurement.getPlantHeight());
        values.put("LEAF_WIDTH", measurement.getLeafWidth());
        values.put("LEAF_LENGTH", measurement.getLeafLength());
        values.put("FRESH_WEIGHT", measurement.getFreshWeight());
        return values.get(itemCode == null ? "" : itemCode.toUpperCase());
    }

    private String measuredTextValue(GrowthMeasurement measurement, String itemCode) {
        if (itemCode == null) return null;
        return switch (itemCode.toUpperCase()) {
            case "LEAF_COLOR" -> measurement.getLeafColor();
            case "GROWTH_STAGE" -> measurement.getGrowthStage();
            default -> null;
        };
    }

    private String worse(String current, String next) {
        return severityRank(next) > severityRank(current) ? next : current;
    }

    private int severityRank(String status) {
        if ("FAIL".equals(status)) return 3;
        if ("CAUTION".equals(status)) return 2;
        if ("MISSING".equals(status)) return 1;
        if ("SKIPPED".equals(status)) return -1;
        return 0;
    }

    private String makeSummary(String overallStatus, int normalCount, int cautionCount, int failCount, int missingCount, int skippedCount) {
        return "품질 종합 판정 " + overallStatus
                + " - 정상 " + normalCount + "건, 주의 " + cautionCount + "건, 경고 " + failCount
                + "건, 미입력 " + missingCount + "건, 판정 제외 " + skippedCount + "건";
    }

    private String makeAnalysisMessage(QualityEvaluationItem item) {
        if (item.getMeasuredValue() == null) {
            return item.getItemName() + " 항목이 기준 문자값과 다르거나 측정값이 부족합니다.";
        }
        return item.getItemName() + " 측정값 " + item.getMeasuredValue() + "이 기준 범위 " + item.getStandardMin() + " ~ " + item.getStandardMax() + "에서 벗어났습니다.";
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
        if (String.valueOf(value).isBlank()) return null;
        return new BigDecimal(String.valueOf(value));
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record QualityStandardSnapshot(
            Long standardItemId,
            String itemCode,
            String itemName,
            String unit,
            String valueType,
            BigDecimal standardMin,
            BigDecimal standardMax,
            BigDecimal failRate,
            String expectedTextValue
    ) {}

    private record QualityEvalResult(String status, BigDecimal deviationValue, BigDecimal deviationRate) {}
}
