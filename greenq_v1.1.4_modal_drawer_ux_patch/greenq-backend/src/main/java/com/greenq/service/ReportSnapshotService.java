package com.greenq.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
        Long batchId = id(request, "batchId");
        Long zoneId = id(request, "zoneId");
        Long cropId = id(request, "cropId");
        LocalDate startDate = date(request, "startDate");
        LocalDate endDate = date(request, "endDate");
        LocalDateTime startAt = startDate.atStartOfDay();
        LocalDateTime endExclusive = endDate.plusDays(1).atStartOfDay();

        ScopeFilter filter = resolveFilter(scope, batchId, zoneId, cropId);
        EnvStats env = envStats(filter, startAt, endExclusive);
        QualityStats quality = qualityStats(filter, startAt, endExclusive);
        NcStats envNc = envNcStats(filter, startAt, endExclusive);
        NcStats qualityNc = qualityNcStats(filter, startAt, endExclusive);
        int actionCount = envActionCount(filter, startAt, endExclusive);

        String envSummary = "환경 로그 " + env.totalCount() + "건, 정상 " + env.normalCount() + "건, 주의 " + env.cautionCount() + "건, 경고 " + env.failCount()
                + "건, 누락 " + env.missingCount() + "건 / 평균 온도 " + fmt(env.avgTemp()) + "℃, 습도 " + fmt(env.avgHumidity()) + "%, pH " + fmt(env.avgPh()) + ", EC " + fmt(env.avgEc());
        String qualitySummary = "실측 " + quality.totalCount() + "건, 정상 " + quality.normalCount() + "건, 주의 " + quality.cautionCount() + "건, 경고 " + quality.failCount()
                + "건, 누락 " + quality.missingCount() + "건 / 평균 초장 " + fmt(quality.avgPlantHeight()) + "cm, 엽폭 " + fmt(quality.avgLeafWidth()) + "cm, 엽장 " + fmt(quality.avgLeafLength()) + "cm, 생체중 " + fmt(quality.avgFreshWeight()) + "g";
        String envNcSummary = "환경 부적합 " + envNc.totalCount() + "건, 주의 " + envNc.cautionCount() + "건, 경고 " + envNc.failCount() + "건, 조치 이력 " + actionCount + "건";
        String qualityNcSummary = "품질 부적합 " + qualityNc.totalCount() + "건, 주의 " + qualityNc.cautionCount() + "건, 경고 " + qualityNc.failCount() + "건";
        String guideSummary = makeGuide(env, quality, envNc, qualityNc);
        String conditionJson = makeConditionJson(request, filter, env, quality, envNc, qualityNc, actionCount);

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
        return new ScopeFilter(scope, batchId, zoneId, cropId, null, null, null);
    }

    private EnvStats envStats(ScopeFilter filter, LocalDateTime startAt, LocalDateTime endExclusive) {
        String sql = """
                select count(*),
                       sum(case when el.env_status = 'NORMAL' then 1 else 0 end),
                       sum(case when el.env_status = 'CAUTION' then 1 else 0 end),
                       sum(case when el.env_status = 'FAIL' then 1 else 0 end),
                       sum(case when el.env_status = 'MISSING' then 1 else 0 end),
                       avg(el.temperature), avg(el.humidity), avg(el.ph), avg(el.ec)
                from environment_log el
                join cultivation_batch b on b.batch_id = el.batch_id
                where coalesce(el.delete_yn, 'N') <> 'Y'
                  and el.measured_at >= :startAt and el.measured_at < :endAt
                """ + scopeWhere(filter);
        Object[] row = singleRow(sql, filter, startAt, endExclusive);
        return new EnvStats(intVal(row[0]), intVal(row[1]), intVal(row[2]), intVal(row[3]), intVal(row[4]), bd(row[5]), bd(row[6]), bd(row[7]), bd(row[8]));
    }

    private QualityStats qualityStats(ScopeFilter filter, LocalDateTime startAt, LocalDateTime endExclusive) {
        String sql = """
                select count(*),
                       sum(case when gm.quality_status = 'NORMAL' then 1 else 0 end),
                       sum(case when gm.quality_status = 'CAUTION' then 1 else 0 end),
                       sum(case when gm.quality_status = 'FAIL' then 1 else 0 end),
                       sum(case when gm.quality_status = 'MISSING' then 1 else 0 end),
                       avg(gm.plant_height), avg(gm.leaf_width), avg(gm.leaf_length), avg(gm.fresh_weight)
                from growth_measurement gm
                join cultivation_batch b on b.batch_id = gm.batch_id
                where coalesce(gm.delete_yn, 'N') <> 'Y'
                  and gm.measured_at >= :startAt and gm.measured_at < :endAt
                """ + scopeWhere(filter);
        Object[] row = singleRow(sql, filter, startAt, endExclusive);
        return new QualityStats(intVal(row[0]), intVal(row[1]), intVal(row[2]), intVal(row[3]), intVal(row[4]), bd(row[5]), bd(row[6]), bd(row[7]), bd(row[8]));
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

    private Object[] singleRow(String sql, ScopeFilter filter, LocalDateTime startAt, LocalDateTime endExclusive) {
        var query = em.createNativeQuery(sql)
                .setParameter("startAt", startAt)
                .setParameter("endAt", endExclusive);
        applyScopeParams(query, filter);
        List<?> rows = query.getResultList();
        if (rows.isEmpty()) return new Object[]{0, 0, 0, 0, 0, null, null, null, null};
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

    private String makeGuide(EnvStats env, QualityStats quality, NcStats envNc, NcStats qualityNc) {
        if (envNc.failCount() > 0 || qualityNc.failCount() > 0) {
            return "경고 항목이 존재합니다. 해당 기간의 부적합 항목과 조치 이력을 우선 검토하고, 다음 재배 회차 기준값/운영 조건을 조정하세요.";
        }
        if (envNc.cautionCount() > 0 || qualityNc.cautionCount() > 0 || env.cautionCount() > 0 || quality.cautionCount() > 0) {
            return "주의 항목이 확인되었습니다. 동일 항목이 반복되는지 모니터링하고 작업자 점검 메모를 남기세요.";
        }
        if (env.totalCount() == 0 && quality.totalCount() == 0) {
            return "선택 기간에 집계할 환경/품질 데이터가 부족합니다. 기간 또는 대상을 다시 확인하세요.";
        }
        return "선택 기간의 환경과 품질 상태가 안정적입니다. 현재 운영 조건을 유지하세요.";
    }

    private String makeConditionJson(Map<String, Object> request, ScopeFilter filter, EnvStats env, QualityStats quality, NcStats envNc, NcStats qualityNc, int actionCount) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("reportType", def(str(request, "reportType"), "DAILY"));
        snapshot.put("reportScope", filter.scope());
        snapshot.put("batchId", filter.batchId());
        snapshot.put("zoneId", filter.zoneId());
        snapshot.put("cropId", filter.cropId());
        snapshot.put("batchName", filter.batchName());
        snapshot.put("zoneName", filter.zoneName());
        snapshot.put("cropName", filter.cropName());
        snapshot.put("startDate", str(request, "startDate"));
        snapshot.put("endDate", str(request, "endDate"));
        snapshot.put("envTotal", env.totalCount());
        snapshot.put("envNormal", env.normalCount());
        snapshot.put("envCaution", env.cautionCount());
        snapshot.put("envFail", env.failCount());
        snapshot.put("envMissing", env.missingCount());
        snapshot.put("qualityTotal", quality.totalCount());
        snapshot.put("qualityNormal", quality.normalCount());
        snapshot.put("qualityCaution", quality.cautionCount());
        snapshot.put("qualityFail", quality.failCount());
        snapshot.put("qualityMissing", quality.missingCount());
        snapshot.put("envNcTotal", envNc.totalCount());
        snapshot.put("qualityNcTotal", qualityNc.totalCount());
        snapshot.put("envActionTotal", actionCount);
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

    private static LocalDate date(Map<String, Object> req, String key) {
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
        return value.setScale(2, java.math.RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
    }

    public record ReportSnapshot(
            String envSummary,
            String qualitySummary,
            String envNcSummary,
            String qualityNcSummary,
            String guideSummary,
            String generatedConditionJson
    ) {}

    private record ScopeFilter(String scope, Long batchId, Long zoneId, Long cropId, String batchName, String zoneName, String cropName) {}
    private record EnvStats(int totalCount, int normalCount, int cautionCount, int failCount, int missingCount, BigDecimal avgTemp, BigDecimal avgHumidity, BigDecimal avgPh, BigDecimal avgEc) {}
    private record QualityStats(int totalCount, int normalCount, int cautionCount, int failCount, int missingCount, BigDecimal avgPlantHeight, BigDecimal avgLeafWidth, BigDecimal avgLeafLength, BigDecimal avgFreshWeight) {}
    private record NcStats(int totalCount, int cautionCount, int failCount) {}
}
