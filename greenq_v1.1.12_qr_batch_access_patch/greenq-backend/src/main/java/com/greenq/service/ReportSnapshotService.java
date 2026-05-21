package com.greenq.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class ReportSnapshotService {
    @PersistenceContext
    private EntityManager em;

    public ReportSnapshot build(Map<String, Object> request) {
        String scope = def(str(request, "reportScope"), "BATCH").toUpperCase();
        LocalDate startDate = dateOrToday(request, "startDate");
        LocalDate endDate = dateOrToday(request, "endDate");
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("리포트 종료일은 시작일보다 빠를 수 없습니다.");
        }
        LocalDateTime startAt = startDate.atStartOfDay();
        LocalDateTime endExclusive = endDate.plusDays(1).atStartOfDay();

        ScopeFilter filter = resolveFilter(scope, id(request, "batchId"), id(request, "zoneId"), id(request, "cropId"));
        EnvStats env = envStats(filter, startAt, endExclusive);
        QualityStats quality = qualityStats(filter, startAt, endExclusive);
        NcStats envNc = envNcStats(filter, startAt, endExclusive);
        NcStats qualityNc = qualityNcStats(filter, startAt, endExclusive);
        int actionCount = envActionCount(filter, startAt, endExclusive);
        int reviewCount = qualityReviewCount(filter, startAt, endExclusive);
        int reflectedCount = qualityReportReflectedCount(filter, startAt, endExclusive);
        String envTopItems = topIssueItems("env_nonconformity", "occurred_at", filter, startAt, endExclusive);
        String qualityTopItems = topIssueItems("quality_nonconformity", "occurred_at", filter, startAt, endExclusive);

        String envSummary = "환경 로그 " + env.totalCount() + "건, 정상 " + env.normalCount() + "건, 주의 " + env.cautionCount()
                + "건, 경고 " + env.failCount() + "건, 누락 " + env.missingCount() + "건, 제외 " + env.skippedCount()
                + "건 / 평균 온도 " + fmt(env.avgTemp()) + "℃, 습도 " + fmt(env.avgHumidity()) + "%, pH " + fmt(env.avgPh())
                + ", EC " + fmt(env.avgEc()) + ", CO2 " + fmt(env.avgCo2()) + "ppm";
        String qualitySummary = "실측 " + quality.totalCount() + "건, 정상 " + quality.normalCount() + "건, 주의 " + quality.cautionCount()
                + "건, 경고 " + quality.failCount() + "건, 누락 " + quality.missingCount() + "건, 제외 " + quality.skippedCount()
                + "건 / 평균 초장 " + fmt(quality.avgPlantHeight()) + "cm, 엽폭 " + fmt(quality.avgLeafWidth())
                + "cm, 엽장 " + fmt(quality.avgLeafLength()) + "cm, 생체중 " + fmt(quality.avgFreshWeight()) + "g";
        String envNcSummary = "환경 부적합 " + envNc.totalCount() + "건, 주의 " + envNc.cautionCount() + "건, 경고 " + envNc.failCount()
                + "건, 조치 이력 " + actionCount + "건" + (envTopItems.isBlank() ? "" : " / 주요 항목: " + envTopItems);
        String qualityNcSummary = "품질 부적합 " + qualityNc.totalCount() + "건, 주의 " + qualityNc.cautionCount() + "건, 경고 " + qualityNc.failCount()
                + "건, 검토 이력 " + reviewCount + "건, 리포트 반영 " + reflectedCount + "건"
                + (qualityTopItems.isBlank() ? "" : " / 주요 항목: " + qualityTopItems);
        String guideSummary = makeGuide(env, quality, envNc, qualityNc, actionCount, reviewCount, reflectedCount, envTopItems, qualityTopItems);
        String conditionJson = makeConditionJson(request, filter, startDate, endDate, env, quality, envNc, qualityNc, actionCount, reviewCount, reflectedCount, envTopItems, qualityTopItems);

        return new ReportSnapshot(envSummary, qualitySummary, envNcSummary, qualityNcSummary, guideSummary, conditionJson);
    }

    private ScopeFilter resolveFilter(String scope, Long batchId, Long zoneId, Long cropId) {
        if ("BATCH".equals(scope) && batchId != null) {
            @SuppressWarnings("unchecked")
            List<Object[]> rows = em.createNativeQuery("""
                    select b.batch_id, b.zone_id, b.crop_id, b.batch_name, z.zone_name, c.crop_name
                    from cultivation_batch b
                    join zone z on z.zone_id = b.zone_id
                    join crop c on c.crop_id = b.crop_id
                    where b.batch_id = :batchId
                    """).setParameter("batchId", batchId).getResultList();
            if (!rows.isEmpty()) {
                Object[] r = rows.get(0);
                return new ScopeFilter("BATCH", toLong(r[0]), toLong(r[1]), toLong(r[2]), String.valueOf(r[3]), String.valueOf(r[4]), String.valueOf(r[5]));
            }
        }
        if ("ZONE".equals(scope) && zoneId != null) {
            Object zoneName = em.createNativeQuery("select zone_name from zone where zone_id = :zoneId")
                    .setParameter("zoneId", zoneId).getResultStream().findFirst().orElse(null);
            return new ScopeFilter("ZONE", null, zoneId, null, null, zoneName == null ? null : String.valueOf(zoneName), null);
        }
        if ("CROP".equals(scope) && cropId != null) {
            Object cropName = em.createNativeQuery("select crop_name from crop where crop_id = :cropId")
                    .setParameter("cropId", cropId).getResultStream().findFirst().orElse(null);
            return new ScopeFilter("CROP", null, null, cropId, null, null, cropName == null ? null : String.valueOf(cropName));
        }
        return new ScopeFilter("ALL", null, null, null, null, null, null);
    }

    private EnvStats envStats(ScopeFilter filter, LocalDateTime startAt, LocalDateTime endExclusive) {
        String sql = """
                select count(*),
                       sum(case when el.env_status = 'NORMAL' then 1 else 0 end),
                       sum(case when el.env_status = 'CAUTION' then 1 else 0 end),
                       sum(case when el.env_status = 'FAIL' then 1 else 0 end),
                       sum(case when el.env_status = 'MISSING' then 1 else 0 end),
                       sum(case when el.env_status = 'SKIPPED' then 1 else 0 end),
                       avg(el.temperature), avg(el.humidity), avg(el.ph), avg(el.ec), avg(el.co2)
                from environment_log el
                join cultivation_batch b on b.batch_id = el.batch_id
                where coalesce(el.delete_yn, 'N') <> 'Y'
                  and el.measured_at >= :startAt and el.measured_at < :endAt
                """ + scopeWhere(filter);
        Object[] row = singleRow(sql, filter, startAt, endExclusive);
        return new EnvStats(intVal(row[0]), intVal(row[1]), intVal(row[2]), intVal(row[3]), intVal(row[4]), intVal(row[5]), bd(row[6]), bd(row[7]), bd(row[8]), bd(row[9]), bd(row[10]));
    }

    private QualityStats qualityStats(ScopeFilter filter, LocalDateTime startAt, LocalDateTime endExclusive) {
        String sql = """
                select count(*),
                       sum(case when gm.quality_status = 'NORMAL' then 1 else 0 end),
                       sum(case when gm.quality_status = 'CAUTION' then 1 else 0 end),
                       sum(case when gm.quality_status = 'FAIL' then 1 else 0 end),
                       sum(case when gm.quality_status = 'MISSING' then 1 else 0 end),
                       sum(case when gm.quality_status = 'SKIPPED' then 1 else 0 end),
                       avg(gm.plant_height), avg(gm.leaf_width), avg(gm.leaf_length), avg(gm.fresh_weight)
                from growth_measurement gm
                join cultivation_batch b on b.batch_id = gm.batch_id
                where coalesce(gm.delete_yn, 'N') <> 'Y'
                  and gm.measured_at >= :startAt and gm.measured_at < :endAt
                """ + scopeWhere(filter);
        Object[] row = singleRow(sql, filter, startAt, endExclusive);
        return new QualityStats(intVal(row[0]), intVal(row[1]), intVal(row[2]), intVal(row[3]), intVal(row[4]), intVal(row[5]), bd(row[6]), bd(row[7]), bd(row[8]), bd(row[9]));
    }

    private NcStats envNcStats(ScopeFilter filter, LocalDateTime startAt, LocalDateTime endExclusive) {
        String sql = """
                select count(*),
                       sum(case when nc.severity = 'CAUTION' then 1 else 0 end),
                       sum(case when nc.severity = 'FAIL' then 1 else 0 end)
                from env_nonconformity nc
                join cultivation_batch b on b.batch_id = nc.batch_id
                where coalesce(nc.delete_yn, 'N') <> 'Y'
                  and nc.occurred_at >= :startAt and nc.occurred_at < :endAt
                """ + scopeWhere(filter);
        Object[] row = singleRow(sql, filter, startAt, endExclusive);
        return new NcStats(intVal(row[0]), intVal(row[1]), intVal(row[2]));
    }

    private NcStats qualityNcStats(ScopeFilter filter, LocalDateTime startAt, LocalDateTime endExclusive) {
        String sql = """
                select count(*),
                       sum(case when nc.severity = 'CAUTION' then 1 else 0 end),
                       sum(case when nc.severity = 'FAIL' then 1 else 0 end)
                from quality_nonconformity nc
                join cultivation_batch b on b.batch_id = nc.batch_id
                where coalesce(nc.delete_yn, 'N') <> 'Y'
                  and nc.occurred_at >= :startAt and nc.occurred_at < :endAt
                """ + scopeWhere(filter);
        Object[] row = singleRow(sql, filter, startAt, endExclusive);
        return new NcStats(intVal(row[0]), intVal(row[1]), intVal(row[2]));
    }

    private int envActionCount(ScopeFilter filter, LocalDateTime startAt, LocalDateTime endExclusive) {
        String sql = """
                select count(*)
                from env_action_log al
                join env_nonconformity nc on nc.env_nc_id = al.env_nc_id
                join cultivation_batch b on b.batch_id = nc.batch_id
                where al.action_at >= :startAt and al.action_at < :endAt
                """ + scopeWhere(filter);
        Object[] row = singleRow(sql, filter, startAt, endExclusive);
        return intVal(row[0]);
    }

    private int qualityReviewCount(ScopeFilter filter, LocalDateTime startAt, LocalDateTime endExclusive) {
        String sql = """
                select count(*)
                from quality_review_log qrl
                join quality_evaluation qe on qe.quality_eval_id = qrl.quality_eval_id
                join cultivation_batch b on b.batch_id = qe.batch_id
                where qrl.review_at >= :startAt and qrl.review_at < :endAt
                """ + scopeWhere(filter);
        Object[] row = singleRow(sql, filter, startAt, endExclusive);
        return intVal(row[0]);
    }

    private int qualityReportReflectedCount(ScopeFilter filter, LocalDateTime startAt, LocalDateTime endExclusive) {
        String sql = """
                select count(*)
                from quality_evaluation qe
                join cultivation_batch b on b.batch_id = qe.batch_id
                where coalesce(qe.report_reflected_yn, 'N') = 'Y'
                  and qe.evaluated_at >= :startAt and qe.evaluated_at < :endAt
                """ + scopeWhere(filter);
        Object[] row = singleRow(sql, filter, startAt, endExclusive);
        return intVal(row[0]);
    }

    private String topIssueItems(String tableName, String timeColumn, ScopeFilter filter, LocalDateTime startAt, LocalDateTime endExclusive) {
        String sql = """
                select coalesce(nc.item_name, nc.item_code, '-') as item_name, nc.severity, count(*) as cnt
                from %s nc
                join cultivation_batch b on b.batch_id = nc.batch_id
                where coalesce(nc.delete_yn, 'N') <> 'Y'
                  and nc.%s >= :startAt and nc.%s < :endAt
                %s
                group by coalesce(nc.item_name, nc.item_code, '-'), nc.severity
                order by cnt desc, case when nc.severity = 'FAIL' then 0 else 1 end, item_name
                limit 3
                """.formatted(tableName, timeColumn, timeColumn, scopeWhere(filter));
        var query = em.createNativeQuery(sql).setParameter("startAt", startAt).setParameter("endAt", endExclusive);
        applyScopeParams(query, filter);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        return rows.stream()
                .map(r -> String.valueOf(r[0]) + " " + severityLabel(String.valueOf(r[1])) + " " + intVal(r[2]) + "건")
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
    }

    private Object[] singleRow(String sql, ScopeFilter filter, LocalDateTime startAt, LocalDateTime endExclusive) {
        var query = em.createNativeQuery(sql)
                .setParameter("startAt", startAt)
                .setParameter("endAt", endExclusive);
        applyScopeParams(query, filter);
        List<?> rows = query.getResultList();
        if (rows.isEmpty()) return new Object[]{0, 0, 0, 0, 0, 0, null, null, null, null, null};
        Object first = rows.get(0);
        if (first instanceof Object[] array) return array;
        return new Object[]{first};
    }

    private String scopeWhere(ScopeFilter filter) {
        if (filter.batchId() != null) return " and b.batch_id = :batchId ";
        if (filter.zoneId() != null) return " and b.zone_id = :zoneId ";
        if (filter.cropId() != null) return " and b.crop_id = :cropId ";
        return "";
    }

    private void applyScopeParams(jakarta.persistence.Query query, ScopeFilter filter) {
        if (filter.batchId() != null) query.setParameter("batchId", filter.batchId());
        else if (filter.zoneId() != null) query.setParameter("zoneId", filter.zoneId());
        else if (filter.cropId() != null) query.setParameter("cropId", filter.cropId());
    }

    private String makeGuide(EnvStats env, QualityStats quality, NcStats envNc, NcStats qualityNc, int actionCount, int reviewCount, int reflectedCount, String envTopItems, String qualityTopItems) {
        if (env.totalCount() == 0 && quality.totalCount() == 0) {
            return "선택 기간에 집계할 환경/품질 데이터가 부족합니다. 기간 또는 리포트 대상을 다시 확인하세요.";
        }
        if (envNc.failCount() > 0 || qualityNc.failCount() > 0) {
            String topic = !envTopItems.isBlank() ? envTopItems : qualityTopItems;
            return "경고 항목이 존재합니다. " + (topic.isBlank() ? "부적합 항목" : topic) + "을 우선 검토하고, 조치/검토 이력을 확인한 뒤 다음 재배 회차의 기준값 또는 운영 조건을 조정하세요.";
        }
        if (qualityNc.totalCount() > 0 && reflectedCount < qualityNc.totalCount()) {
            return "품질 부적합 중 리포트 반영 전 항목이 있습니다. 품질 검토 메모를 확인하고 REFLECTED 상태로 전환한 뒤 리포트에 반영하세요.";
        }
        if (envNc.cautionCount() > 0 || qualityNc.cautionCount() > 0 || env.cautionCount() > 0 || quality.cautionCount() > 0) {
            return "주의 항목이 확인되었습니다. 동일 항목이 반복되는지 모니터링하고, 작업자 조치 메모 또는 품질 검토 메모를 남기세요.";
        }
        if (env.missingCount() > 0 || quality.missingCount() > 0) {
            return "누락 항목이 확인되었습니다. 센서 수집 항목, 실측 입력 항목, 기준값 사용 여부를 점검하세요.";
        }
        if (actionCount == 0 && reviewCount == 0) {
            return "선택 기간의 환경과 품질 상태가 안정적입니다. 현재 운영 조건을 유지하되, 정기 점검 메모를 남기면 추적성이 좋아집니다.";
        }
        return "선택 기간의 환경과 품질 상태가 안정적입니다. 등록된 조치/검토 이력을 참고하여 현재 운영 조건을 유지하세요.";
    }

    private String makeConditionJson(Map<String, Object> request, ScopeFilter filter, LocalDate startDate, LocalDate endDate, EnvStats env, QualityStats quality, NcStats envNc, NcStats qualityNc, int actionCount, int reviewCount, int reflectedCount, String envTopItems, String qualityTopItems) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("reportType", def(str(request, "reportType"), "DAILY").toUpperCase());
        snapshot.put("reportScope", filter.scope());
        snapshot.put("batchId", filter.batchId());
        snapshot.put("zoneId", filter.zoneId());
        snapshot.put("cropId", filter.cropId());
        snapshot.put("batchName", filter.batchName());
        snapshot.put("zoneName", filter.zoneName());
        snapshot.put("cropName", filter.cropName());
        snapshot.put("targetName", filter.targetName());
        snapshot.put("startDate", startDate.toString());
        snapshot.put("endDate", endDate.toString());
        snapshot.put("envTotal", env.totalCount());
        snapshot.put("envNormal", env.normalCount());
        snapshot.put("envCaution", env.cautionCount());
        snapshot.put("envFail", env.failCount());
        snapshot.put("envMissing", env.missingCount());
        snapshot.put("envSkipped", env.skippedCount());
        snapshot.put("envAvgTemp", fmt(env.avgTemp()));
        snapshot.put("envAvgHumidity", fmt(env.avgHumidity()));
        snapshot.put("envAvgPh", fmt(env.avgPh()));
        snapshot.put("envAvgEc", fmt(env.avgEc()));
        snapshot.put("qualityTotal", quality.totalCount());
        snapshot.put("qualityNormal", quality.normalCount());
        snapshot.put("qualityCaution", quality.cautionCount());
        snapshot.put("qualityFail", quality.failCount());
        snapshot.put("qualityMissing", quality.missingCount());
        snapshot.put("qualitySkipped", quality.skippedCount());
        snapshot.put("envNcTotal", envNc.totalCount());
        snapshot.put("envNcCaution", envNc.cautionCount());
        snapshot.put("envNcFail", envNc.failCount());
        snapshot.put("envNcTopItems", envTopItems);
        snapshot.put("qualityNcTotal", qualityNc.totalCount());
        snapshot.put("qualityNcCaution", qualityNc.cautionCount());
        snapshot.put("qualityNcFail", qualityNc.failCount());
        snapshot.put("qualityNcTopItems", qualityTopItems);
        snapshot.put("envActionTotal", actionCount);
        snapshot.put("qualityReviewTotal", reviewCount);
        snapshot.put("qualityReportReflectedTotal", reflectedCount);
        return toJson(snapshot);
    }

    private String toJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!first) sb.append(',');
            first = false;
            sb.append('"').append(escape(entry.getKey())).append('"').append(':');
            Object value = entry.getValue();
            if (value == null) sb.append("null");
            else if (value instanceof Number || value instanceof Boolean) sb.append(value);
            else sb.append('"').append(escape(String.valueOf(value))).append('"');
        }
        sb.append('}');
        return sb.toString();
    }

    private String escape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String severityLabel(String severity) {
        if ("FAIL".equalsIgnoreCase(severity)) return "경고";
        if ("CAUTION".equalsIgnoreCase(severity)) return "주의";
        return severity;
    }

    private static Long id(Map<String, Object> req, String key) {
        Object v = req.get(key);
        if (v == null || String.valueOf(v).isBlank() || "null".equalsIgnoreCase(String.valueOf(v))) return null;
        return Long.valueOf(String.valueOf(v));
    }

    private static String str(Map<String, Object> req, String key) {
        Object v = req.get(key);
        return v == null ? null : String.valueOf(v);
    }

    private static String def(String value, String def) {
        return value == null || value.isBlank() || "null".equalsIgnoreCase(value) ? def : value;
    }

    private static LocalDate dateOrToday(Map<String, Object> req, String key) {
        Object v = req.get(key);
        if (v == null || String.valueOf(v).isBlank()) return LocalDate.now();
        return LocalDate.parse(String.valueOf(v).substring(0, 10));
    }

    private static Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();
        return Long.valueOf(String.valueOf(value));
    }

    private static BigDecimal bd(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal bigDecimal) return bigDecimal;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        if (String.valueOf(value).isBlank()) return null;
        return new BigDecimal(String.valueOf(value));
    }

    private static int intVal(Object value) {
        if (value == null) return 0;
        if (value instanceof Number number) return number.intValue();
        return Integer.parseInt(String.valueOf(value));
    }

    private String fmt(BigDecimal value) {
        if (value == null) return "-";
        return value.setScale(2, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
    }

    public record ReportSnapshot(
            String envSummary,
            String qualitySummary,
            String envNcSummary,
            String qualityNcSummary,
            String guideSummary,
            String generatedConditionJson
    ) {}

    private record ScopeFilter(String scope, Long batchId, Long zoneId, Long cropId, String batchName, String zoneName, String cropName) {
        String targetName() {
            if (batchName != null && !batchName.isBlank()) return batchName;
            if (zoneName != null && !zoneName.isBlank()) return zoneName;
            if (cropName != null && !cropName.isBlank()) return cropName;
            return "전체";
        }
    }
    private record EnvStats(int totalCount, int normalCount, int cautionCount, int failCount, int missingCount, int skippedCount, BigDecimal avgTemp, BigDecimal avgHumidity, BigDecimal avgPh, BigDecimal avgEc, BigDecimal avgCo2) {}
    private record QualityStats(int totalCount, int normalCount, int cautionCount, int failCount, int missingCount, int skippedCount, BigDecimal avgPlantHeight, BigDecimal avgLeafWidth, BigDecimal avgLeafLength, BigDecimal avgFreshWeight) {}
    private record NcStats(int totalCount, int cautionCount, int failCount) {}
}
