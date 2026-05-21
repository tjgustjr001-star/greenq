package com.greenq.service;

import com.greenq.entity.*;
import com.greenq.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class GreenqQueryService {
    private final CropRepository cropRepository;
    private final ZoneRepository zoneRepository;
    private final CultivationBatchRepository batchRepository;
    private final EnvironmentLogRepository environmentLogRepository;
    private final EnvNonconformityRepository envNonconformityRepository;
    private final GrowthMeasurementRepository growthMeasurementRepository;
    private final ReportRepository reportRepository;
    private final UserAccountRepository userAccountRepository;
    private final MeasurementItemMasterRepository itemMasterRepository;

    @PersistenceContext
    private EntityManager em;

    public GreenqQueryService(
            CropRepository cropRepository,
            ZoneRepository zoneRepository,
            CultivationBatchRepository batchRepository,
            EnvironmentLogRepository environmentLogRepository,
            EnvNonconformityRepository envNonconformityRepository,
            GrowthMeasurementRepository growthMeasurementRepository,
            ReportRepository reportRepository,
            UserAccountRepository userAccountRepository,
            MeasurementItemMasterRepository itemMasterRepository
    ) {
        this.cropRepository = cropRepository;
        this.zoneRepository = zoneRepository;
        this.batchRepository = batchRepository;
        this.environmentLogRepository = environmentLogRepository;
        this.envNonconformityRepository = envNonconformityRepository;
        this.growthMeasurementRepository = growthMeasurementRepository;
        this.reportRepository = reportRepository;
        this.userAccountRepository = userAccountRepository;
        this.itemMasterRepository = itemMasterRepository;
    }

    public List<Map<String, Object>> users() {
        return userAccountRepository.findAll().stream()
                .sorted(Comparator.comparing(UserAccount::getUserId))
                .map(u -> mapOf(
                        "userId", u.getUserId(),
                        "loginId", u.getLoginId(),
                        "userName", u.getUserName(),
                        "roleCode", u.getRoleCode(),
                        "email", u.getEmail(),
                        "phone", u.getPhone(),
                        "accountStatus", u.getAccountStatus(),
                        "createdAt", dt(u.getCreatedAt())
                )).toList();
    }

    public List<Map<String, Object>> itemMasters() {
        return itemMasterRepository.findAll().stream()
                .sorted(Comparator.comparing(MeasurementItemMaster::getSortOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(i -> mapOf(
                        "itemCode", i.getItemCode(), "itemName", i.getItemName(), "itemGroup", i.getItemGroup(),
                        "standardType", i.getStandardType(), "unit", i.getUnit(), "valueType", i.getValueType(),
                        "entityField", i.getEntityField(), "sortOrder", i.getSortOrder(), "useYn", i.getUseYn(),
                        "defaultUseYn", i.getDefaultUseYn()
                )).toList();
    }

    public List<Map<String, Object>> crops() {
        return cropRepository.findAll().stream()
                .filter(c -> !"Y".equalsIgnoreCase(nullToN(c.getDeleteYn())))
                .sorted(Comparator.comparing(Crop::getCropId))
                .map(this::cropMap)
                .toList();
    }

    public Map<String, Object> crop(Long id) {
        return cropRepository.findById(id).map(this::cropMap).orElseThrow();
    }

    private Map<String, Object> cropMap(Crop c) {
        Map<String, Object> map = mapOf(
                "cropId", c.getCropId(), "cropName", c.getCropName(), "varietyName", c.getVarietyName(),
                "cropType", c.getCropType(), "cropStatus", c.getCropStatus(), "description", c.getDescription(),
                "deleteYn", nullToN(c.getDeleteYn()), "createdAt", dt(c.getCreatedAt()), "updatedAt", dt(c.getUpdatedAt())
        );
        map.put("envStandards", standardItems(c.getCropId(), "ENV"));
        map.put("qualityStandards", standardItems(c.getCropId(), "QUALITY"));
        return map;
    }

    public List<Map<String, Object>> standardItems(Long cropId, String type) {
        String sql = """
                select si.item_code, si.item_name, si.unit, si.standard_min, si.standard_max, si.fail_rate, si.use_yn,
                       si.item_group, si.value_type, si.expected_text_value, si.standard_item_id, ss.standard_set_id
                from standard_set ss
                join standard_item si on si.standard_set_id = ss.standard_set_id
                where ss.crop_id = :cropId
                  and ss.standard_type = :type
                  and ss.standard_status = 'ACTIVE'
                  and coalesce(ss.delete_yn, 'N') <> 'Y'
                  and coalesce(si.delete_yn, 'N') <> 'Y'
                order by si.sort_order, si.standard_item_id
                """;
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("cropId", cropId)
                .setParameter("type", type)
                .getResultList();
        return rows.stream().map(r -> mapOf(
                "itemCode", r[0], "itemName", r[1], "unit", r[2],
                "min", num(r[3]), "max", num(r[4]), "failRate", num(r[5]), "useYn", r[6],
                "itemGroup", r[7], "valueType", r[8], "expectedTextValue", r[9],
                "standardItemId", r[10], "standardSetId", r[11]
        )).toList();
    }

    public List<Map<String, Object>> zones() {
        return zoneRepository.findAll().stream()
                .filter(z -> !"Y".equalsIgnoreCase(nullToN(z.getDeleteYn())))
                .sorted(Comparator.comparing(Zone::getZoneId))
                .map(this::zoneMap)
                .toList();
    }

    public Map<String, Object> zone(Long id) {
        return zoneRepository.findById(id).map(this::zoneMap).orElseThrow();
    }

    private Map<String, Object> zoneMap(Zone z) {
        String currentBatch = latestBatchNameByZone(z.getZoneId());
        return mapOf(
                "zoneId", z.getZoneId(), "zoneName", z.getZoneName(), "locationDesc", z.getLocationDesc(),
                "areaSize", num(z.getAreaSize()), "zoneStatus", z.getZoneStatus(), "description", z.getDescription(),
                "currentBatch", currentBatch == null ? "-" : currentBatch,
                "deleteYn", nullToN(z.getDeleteYn()), "createdAt", dt(z.getCreatedAt()), "updatedAt", dt(z.getUpdatedAt())
        );
    }

    private String latestBatchNameByZone(Long zoneId) {
        @SuppressWarnings("unchecked")
        List<String> rows = em.createNativeQuery("""
                select batch_name from cultivation_batch
                where zone_id = :zoneId and coalesce(delete_yn, 'N') <> 'Y'
                order by case batch_status when 'GROWING' then 1 when 'PLANNED' then 2 else 3 end, start_date desc, batch_id desc
                limit 1
                """).setParameter("zoneId", zoneId).getResultList();
        return rows.isEmpty() ? null : rows.get(0);
    }

    public List<Map<String, Object>> batches() {
        String sql = """
                select b.batch_id, b.batch_name, b.crop_id, c.crop_name, b.zone_id, z.zone_name, b.planted_quantity,
                       b.start_date, b.expected_end_date, b.actual_end_date, b.batch_status,
                       b.env_standard_set_id, b.quality_standard_set_id, b.created_at, b.updated_at
                from cultivation_batch b
                join crop c on c.crop_id = b.crop_id
                join zone z on z.zone_id = b.zone_id
                where coalesce(b.delete_yn, 'N') <> 'Y'
                order by b.batch_id
                """;
        @SuppressWarnings("unchecked") List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        return rows.stream().map(this::batchRowMap).toList();
    }

    public Map<String, Object> batch(Long id) {
        return batches().stream().filter(b -> Objects.equals(String.valueOf(b.get("batchId")), String.valueOf(id))).findFirst().orElseThrow();
    }

    private Map<String, Object> batchRowMap(Object[] r) {
        return mapOf(
                "batchId", r[0], "batchName", r[1], "cropId", r[2], "cropName", r[3],
                "zoneId", r[4], "zoneName", r[5], "plantedQuantity", r[6],
                "startDate", d(r[7]), "expectedEndDate", d(r[8]), "actualEndDate", d(r[9]),
                "batchStatus", r[10], "envStandardSetId", r[11], "qualityStandardSetId", r[12],
                "createdAt", dtObj(r[13]), "updatedAt", dtObj(r[14])
        );
    }

    public List<Map<String, Object>> environmentLogs() {
        return environmentLogs(null, null);
    }

    public List<Map<String, Object>> environmentLogs(Long batchId, Integer hours) {
        StringBuilder sql = new StringBuilder("""
                select el.env_log_id, el.measured_at, el.batch_id, b.batch_name, z.zone_name, el.temperature,
                       el.humidity, el.co2, el.vpd, el.light_intensity, el.photoperiod, el.light_wavelength,
                       el.ph, el.water_temp, el.ec, el.env_status, el.data_source
                from environment_log el
                join cultivation_batch b on b.batch_id = el.batch_id
                join zone z on z.zone_id = b.zone_id
                where coalesce(el.delete_yn, 'N') <> 'Y'
                """);
        if (batchId != null) sql.append(" and el.batch_id = :batchId ");
        if (hours != null && hours > 0) sql.append(" and el.measured_at >= :fromTime ");
        sql.append(" order by el.measured_at desc, el.env_log_id desc ");
        var query = em.createNativeQuery(sql.toString());
        if (batchId != null) query.setParameter("batchId", batchId);
        if (hours != null && hours > 0) query.setParameter("fromTime", LocalDateTime.now().minusHours(hours));
        @SuppressWarnings("unchecked") List<Object[]> rows = query.getResultList();
        return rows.stream().map(this::environmentRowMap).toList();
    }

    public Map<String, Object> environmentLog(Long id) {
        Map<String, Object> map = environmentLogs().stream()
                .filter(e -> Objects.equals(String.valueOf(e.get("envLogId")), String.valueOf(id)))
                .findFirst().orElseThrow();
        map.put("items", environmentItems(id));
        return map;
    }

    private Map<String, Object> environmentRowMap(Object[] r) {
        return mapOf(
                "envLogId", r[0], "measuredAt", dtObj(r[1]), "batchId", r[2], "batchName", r[3], "zoneName", r[4],
                "temperature", num(r[5]), "humidity", num(r[6]), "co2", num(r[7]), "vpd", num(r[8]),
                "lightIntensity", num(r[9]), "photoperiod", num(r[10]), "lightWavelength", r[11],
                "ph", num(r[12]), "waterTemp", num(r[13]), "ec", num(r[14]), "envStatus", r[15], "dataSource", r[16]
        );
    }

    private List<Map<String, Object>> environmentItems(Long envLogId) {
        String sql = """
                select item_code, item_name, measured_value, measured_text_value, standard_min, standard_max,
                       deviation_rate, eval_status, unit
                from env_evaluation_item
                where env_log_id = :id
                order by env_eval_item_id
                """;
        @SuppressWarnings("unchecked") List<Object[]> rows = em.createNativeQuery(sql).setParameter("id", envLogId).getResultList();
        return rows.stream().map(r -> mapOf(
                "itemCode", r[0], "itemName", r[1], "measuredValue", num(r[2]), "measuredTextValue", r[3],
                "standard", range(r[4], r[5]), "standardMin", num(r[4]), "standardMax", num(r[5]),
                "deviationRate", num(r[6]), "status", r[7], "evalStatus", r[7], "unit", r[8]
        )).toList();
    }

    public List<Map<String, Object>> issues() {
        List<Map<String, Object>> result = new ArrayList<>();
        result.addAll(envIssues());
        result.addAll(qualityIssues());
        result.sort((a, b) -> String.valueOf(b.get("occurredAt")).compareTo(String.valueOf(a.get("occurredAt"))));
        return result;
    }

    public List<Map<String, Object>> envIssueAlerts() {
        return envAlerts("UNREAD", null);
    }

    public List<Map<String, Object>> envAlerts(String status, Long envNcId) {
        StringBuilder sql = new StringBuilder("""
                select a.alert_id, a.created_at, a.alert_title, a.alert_message, a.alert_level, a.alert_status,
                       a.env_nc_id, a.batch_id, b.batch_name, a.zone_id, z.zone_name,
                       nc.item_code, nc.item_name, nc.env_nc_status, nc.measured_value, nc.standard_min, nc.standard_max,
                       nc.deviation_rate, a.read_at, a.read_by, ru.user_name
                from env_alert a
                join env_nonconformity nc on nc.env_nc_id = a.env_nc_id
                join cultivation_batch b on b.batch_id = a.batch_id
                join zone z on z.zone_id = a.zone_id
                left join user_account ru on ru.user_id = a.read_by
                where coalesce(nc.delete_yn, 'N') <> 'Y'
                """);
        if (status != null && !status.isBlank()) sql.append(" and a.alert_status = :status ");
        if (envNcId != null) sql.append(" and a.env_nc_id = :envNcId ");
        sql.append("""
                order by
                  case a.alert_status when 'UNREAD' then 1 when 'READ' then 2 else 3 end,
                  case a.alert_level when 'FAIL' then 1 when 'CAUTION' then 2 else 3 end,
                  a.created_at desc, a.alert_id desc
                """);
        var query = em.createNativeQuery(sql.toString());
        if (status != null && !status.isBlank()) query.setParameter("status", status.toUpperCase());
        if (envNcId != null) query.setParameter("envNcId", envNcId);
        @SuppressWarnings("unchecked") List<Object[]> rows = query.getResultList();
        return rows.stream().map(r -> mapOf(
                "alertId", r[0], "createdAt", dtObj(r[1]), "alertTitle", r[2], "alertMessage", r[3],
                "alertLevel", r[4], "alertStatus", r[5], "envNcId", r[6], "rawId", r[6],
                "issueId", "ENV-" + r[6], "issueType", "env", "batchId", r[7], "batchName", r[8],
                "zoneId", r[9], "zoneName", r[10], "itemCode", r[11], "itemName", r[12],
                "status", r[13], "envNcStatus", r[13], "measuredValue", num(r[14]),
                "standardRange", range(r[15], r[16]), "standardMin", num(r[15]), "standardMax", num(r[16]),
                "deviationRate", num(r[17]), "readAt", dtObj(r[18]), "readBy", r[19], "readByName", r[20],
                "severity", r[4]
        )).toList();
    }

    public Map<String, Object> issue(String issueKey) {
        return issues().stream().filter(i -> Objects.equals(String.valueOf(i.get("issueId")), issueKey)).findFirst().orElseThrow();
    }

    public List<Map<String, Object>> issueActions(Long envNcId) {
        String sql = """
                select al.env_action_id, al.action_at, ua.user_name, al.action_type, al.action_content,
                       al.action_status_after, al.result_note
                from env_action_log al
                join user_account ua on ua.user_id = al.action_by
                where al.env_nc_id = :id
                order by al.action_at desc, al.env_action_id desc
                """;
        @SuppressWarnings("unchecked") List<Object[]> rows = em.createNativeQuery(sql).setParameter("id", envNcId).getResultList();
        return rows.stream().map(r -> mapOf(
                "actionId", r[0], "actionAt", dtObj(r[1]), "actionBy", r[2], "actionType", r[3],
                "actionContent", r[4], "actionStatusAfter", r[5], "resultNote", r[6]
        )).toList();
    }

    public List<Map<String, Object>> qualityReviews(Long qualityNcId) {
        String sql = """
                select qr.quality_review_id, qr.review_at, qr.review_content, qr.reviewed_by, ua.user_name,
                       qn.quality_nc_status, qr.created_at
                from quality_nonconformity qn
                join quality_review_log qr on qr.quality_eval_id = qn.quality_eval_id
                left join user_account ua on ua.user_id = qr.reviewed_by
                where qn.quality_nc_id = :id
                order by qr.review_at desc, qr.quality_review_id desc
                """;
        @SuppressWarnings("unchecked") List<Object[]> rows = em.createNativeQuery(sql).setParameter("id", qualityNcId).getResultList();
        return rows.stream().map(r -> mapOf(
                "qualityReviewId", r[0], "reviewAt", dtObj(r[1]), "reviewContent", r[2],
                "reviewedBy", r[3], "reviewedByName", r[4], "reviewStatusAfter", r[5], "createdAt", dtObj(r[6])
        )).toList();
    }

    private List<Map<String, Object>> envIssues() {
        String sql = """
                select nc.env_nc_id, nc.occurred_at, nc.resolved_at, nc.env_nc_status, nc.severity,
                       nc.item_code, nc.item_name, nc.measured_value, nc.standard_min, nc.standard_max,
                       nc.deviation_rate, nc.guide_message, b.batch_name, z.zone_name, nc.batch_id, nc.zone_id,
                       coalesce(sum(case when a.alert_status = 'UNREAD' then 1 else 0 end), 0) as unread_alert_count,
                       coalesce(sum(case when a.alert_status <> 'CLOSED' then 1 else 0 end), 0) as active_alert_count
                from env_nonconformity nc
                join cultivation_batch b on b.batch_id = nc.batch_id
                join zone z on z.zone_id = nc.zone_id
                left join env_alert a on a.env_nc_id = nc.env_nc_id
                where coalesce(nc.delete_yn, 'N') <> 'Y'
                group by nc.env_nc_id, nc.occurred_at, nc.resolved_at, nc.env_nc_status, nc.severity,
                         nc.item_code, nc.item_name, nc.measured_value, nc.standard_min, nc.standard_max,
                         nc.deviation_rate, nc.guide_message, b.batch_name, z.zone_name, nc.batch_id, nc.zone_id
                """;
        @SuppressWarnings("unchecked") List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        return rows.stream().map(r -> {
            String status = String.valueOf(r[3]);
            return mapOf(
                    "issueId", "ENV-" + r[0], "rawId", r[0], "issueType", "ENV", "occurredAt", dtObj(r[1]),
                    "resolvedAt", dtObj(r[2]), "status", status, "actionStatus", status, "severity", r[4], "itemCode", r[5], "itemName", r[6],
                    "measuredValue", num(r[7]), "standardRange", range(r[8], r[9]), "standardMin", num(r[8]), "standardMax", num(r[9]),
                    "deviationRate", num(r[10]), "guide", r[11], "guideMessage", r[11], "batchName", r[12], "zoneName", r[13],
                    "batchId", r[14], "zoneId", r[15], "unreadAlertCount", r[16], "activeAlertCount", r[17],
                    "actionRequired", true
            );
        }).toList();
    }

    private List<Map<String, Object>> qualityIssues() {
        String sql = """
                select nc.quality_nc_id, nc.occurred_at, nc.quality_nc_status, nc.severity,
                       nc.item_code, nc.item_name, nc.measured_value, nc.standard_min, nc.standard_max,
                       nc.deviation_rate, nc.recommended_next_action, b.batch_name, z.zone_name, nc.quality_eval_id
                from quality_nonconformity nc
                join cultivation_batch b on b.batch_id = nc.batch_id
                join zone z on z.zone_id = b.zone_id
                where coalesce(nc.delete_yn, 'N') <> 'Y'
                """;
        @SuppressWarnings("unchecked") List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        return rows.stream().map(r -> mapOf(
                "issueId", "QLT-" + r[0], "rawId", r[0], "issueType", "QUALITY", "occurredAt", dtObj(r[1]),
                "resolvedAt", null, "status", r[2], "qualityNcStatus", r[2], "severity", r[3], "itemCode", r[4], "itemName", r[5],
                "measuredValue", num(r[6]), "standardRange", range(r[7], r[8]), "standardMin", num(r[7]), "standardMax", num(r[8]),
                "deviationRate", num(r[9]), "guide", r[10], "guideMessage", r[10], "batchName", r[11], "zoneName", r[12],
                "qualityEvalId", r[13], "actionRequired", false
        )).toList();
    }


    private int severityRank(String severity) {
        return switch (String.valueOf(severity).toUpperCase()) {
            case "FAIL" -> 3;
            case "CAUTION" -> 2;
            case "NORMAL" -> 1;
            default -> 0;
        };
    }

    public List<Map<String, Object>> measurements() {
        String sql = """
                select gm.measurement_id, gm.measured_at, gm.batch_id, b.batch_name, gm.sample_count,
                       gm.plant_height, gm.leaf_width, gm.leaf_length, gm.fresh_weight, gm.leaf_color,
                       gm.growth_stage, gm.special_note, gm.quality_status
                from growth_measurement gm
                join cultivation_batch b on b.batch_id = gm.batch_id
                where coalesce(gm.delete_yn, 'N') <> 'Y'
                order by gm.measured_at desc, gm.measurement_id desc
                """;
        @SuppressWarnings("unchecked") List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        return rows.stream().map(this::measurementRowMap).toList();
    }

    public Map<String, Object> measurement(Long id) {
        Map<String, Object> map = measurements().stream()
                .filter(m -> Objects.equals(String.valueOf(m.get("measurementId")), String.valueOf(id)))
                .findFirst().orElseThrow();
        map.put("samples", measurementSamples(id));
        map.put("items", qualityItems(id));
        return map;
    }

    private Map<String, Object> measurementRowMap(Object[] r) {
        return mapOf(
                "measurementId", r[0], "measuredAt", dtObj(r[1]), "batchId", r[2], "batchName", r[3],
                "sampleCount", r[4], "plantHeight", num(r[5]), "leafWidth", num(r[6]), "leafLength", num(r[7]),
                "freshWeight", num(r[8]), "leafColor", r[9], "growthStage", r[10], "specialNote", r[11],
                "qualityStatus", r[12]
        );
    }

    private List<Map<String, Object>> measurementSamples(Long measurementId) {
        String sql = """
                select sample_no, plant_height, leaf_width, leaf_length, fresh_weight, leaf_color, growth_stage, special_note
                from growth_measurement_sample
                where measurement_id = :id
                order by sample_no
                """;
        @SuppressWarnings("unchecked") List<Object[]> rows = em.createNativeQuery(sql).setParameter("id", measurementId).getResultList();
        return rows.stream().map(r -> mapOf(
                "sampleNo", r[0], "plantHeight", num(r[1]), "leafWidth", num(r[2]), "leafLength", num(r[3]),
                "freshWeight", num(r[4]), "leafColor", r[5], "growthStage", r[6], "note", r[7], "specialNote", r[7]
        )).toList();
    }

    private List<Map<String, Object>> qualityItems(Long measurementId) {
        String sql = """
                select item_code, item_name, measured_value, measured_text_value, standard_min, standard_max,
                       deviation_rate, eval_status, unit
                from quality_evaluation_item
                where measurement_id = :id
                order by quality_eval_item_id
                """;
        @SuppressWarnings("unchecked") List<Object[]> rows = em.createNativeQuery(sql).setParameter("id", measurementId).getResultList();
        return rows.stream().map(r -> mapOf(
                "itemCode", r[0], "itemName", r[1], "measuredValue", num(r[2]), "measuredTextValue", r[3],
                "standard", range(r[4], r[5]), "standardMin", num(r[4]), "standardMax", num(r[5]),
                "deviationRate", num(r[6]), "status", r[7], "evalStatus", r[7], "unit", r[8]
        )).toList();
    }

    public List<Map<String, Object>> reports() {
        String sql = """
                select r.report_id, r.report_title, r.report_type, r.report_scope, r.start_date, r.end_date,
                       r.created_at, coalesce(b.batch_name, z.zone_name, c.crop_name, '전체') as target_name,
                       r.report_status, r.report_version
                from report r
                left join cultivation_batch b on b.batch_id = r.batch_id
                left join zone z on z.zone_id = r.zone_id
                left join crop c on c.crop_id = r.crop_id
                where coalesce(r.delete_yn, 'N') <> 'Y'
                order by r.created_at desc, r.report_id desc
                """;
        @SuppressWarnings("unchecked") List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        return rows.stream().map(r -> mapOf(
                "reportId", r[0], "reportTitle", r[1], "reportType", r[2], "reportScope", r[3],
                "startDate", d(r[4]), "endDate", d(r[5]), "createdAt", dtObj(r[6]), "targetName", r[7],
                "reportStatus", r[8], "reportVersion", r[9]
        )).toList();
    }

    public List<Map<String, Object>> deletedData() {
        String sql = """
                select 'crops' entity_name, '작물' entity_label, crop_id id_value,
                       concat(crop_name, coalesce(concat(' (', variety_name, ')'), '')) display_name, deleted_at
                from crop where coalesce(delete_yn, 'N') = 'Y'
                union all
                select 'zones', '구역', zone_id, zone_name, deleted_at from zone where coalesce(delete_yn, 'N') = 'Y'
                union all
                select 'batches', '배치', batch_id, batch_name, deleted_at from cultivation_batch where coalesce(delete_yn, 'N') = 'Y'
                union all
                select 'environmentLogs', '환경 데이터', env_log_id, concat('환경 로그 #', env_log_id), deleted_at from environment_log where coalesce(delete_yn, 'N') = 'Y'
                union all
                select 'measurements', '실측', measurement_id, concat('실측 #', measurement_id), deleted_at from growth_measurement where coalesce(delete_yn, 'N') = 'Y'
                union all
                select 'reports', '리포트', report_id, report_title, deleted_at from report where coalesce(delete_yn, 'N') = 'Y'
                union all
                select 'issuesEnv', '환경 부적합', env_nc_id, concat(item_name, ' / ', severity), deleted_at from env_nonconformity where coalesce(delete_yn, 'N') = 'Y'
                union all
                select 'issuesQuality', '품질 부적합', quality_nc_id, concat(item_name, ' / ', severity), deleted_at from quality_nonconformity where coalesce(delete_yn, 'N') = 'Y'
                order by deleted_at desc
                """;
        @SuppressWarnings("unchecked") List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        return rows.stream().map(r -> mapOf(
                "entityName", r[0], "entityLabel", r[1], "idValue", r[2], "displayName", r[3], "deletedAt", dtObj(r[4])
        )).toList();
    }

    public Map<String, Object> report(Long id) {
        Report r = reportRepository.findById(id).orElseThrow();
        String targetName = reports().stream().filter(x -> Objects.equals(String.valueOf(x.get("reportId")), String.valueOf(id)))
                .map(x -> String.valueOf(x.get("targetName"))).findFirst().orElse("-");
        return mapOf(
                "reportId", r.getReportId(), "reportTitle", r.getReportTitle(), "reportType", r.getReportType(),
                "reportScope", r.getReportScope(), "startDate", d(r.getStartDate()), "endDate", d(r.getEndDate()),
                "createdAt", dt(r.getCreatedAt()), "targetName", targetName,
                "envSummary", r.getEnvSummary(), "qualitySummary", r.getQualitySummary(),
                "envNcSummary", r.getEnvNcSummary(), "qualityNcSummary", r.getQualityNcSummary(),
                "guideSummary", r.getGuideSummary(), "generatedConditionJson", r.getGeneratedConditionJson(),
                "reportStatus", r.getReportStatus(), "reportVersion", r.getReportVersion()
        );
    }

    public Map<String, Object> dashboard() {
        List<Map<String, Object>> logs = environmentLogs();
        List<Map<String, Object>> iss = issues();
        List<Map<String, Object>> ms = measurements();
        List<Map<String, Object>> unreadAlerts = envAlerts("UNREAD", null);
        List<Map<String, Object>> recentAlerts = envAlerts(null, null);
        return mapOf(
                "cropCount", crops().size(),
                "zoneCount", zones().size(),
                "growingBatchCount", batches().stream().filter(b -> "GROWING".equals(b.get("batchStatus"))).count(),
                "openIssueCount", iss.stream().filter(i -> !String.valueOf(i.get("status")).contains("RESOLVED") && !String.valueOf(i.get("status")).contains("REFLECTED")).count(),
                "unreadEnvAlertCount", unreadAlerts.size(),
                "latestEnvironmentLogs", logs.stream().limit(5).toList(),
                "recentEnvAlerts", recentAlerts.stream().limit(5).toList(),
                "unreadEnvAlerts", unreadAlerts.stream().limit(5).toList(),
                "recentIssues", iss.stream().limit(5).toList(),
                "recentMeasurements", ms.stream().limit(5).toList()
        );
    }

    private static Map<String, Object> mapOf(Object... args) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < args.length; i += 2) {
            map.put(String.valueOf(args[i]), args[i + 1]);
        }
        return map;
    }

    private static String nullToN(String s) { return s == null ? "N" : s; }

    private static Object num(Object v) {
        if (v instanceof BigDecimal bd) return bd.stripTrailingZeros();
        return v;
    }

    private static String range(Object min, Object max) {
        if (min == null && max == null) return "-";
        if (min == null) return "~ " + num(max);
        if (max == null) return num(min) + " ~";
        return num(min) + " ~ " + num(max);
    }

    private static String dt(LocalDateTime v) {
        return v == null ? null : v.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    private static String dtObj(Object v) {
        if (v == null) return null;
        if (v instanceof LocalDateTime t) return dt(t);
        return String.valueOf(v).replace('T', ' ');
    }

    private static String d(LocalDate v) {
        return v == null ? null : v.toString();
    }

    private static String d(Object v) {
        return v == null ? null : String.valueOf(v).substring(0, Math.min(10, String.valueOf(v).length()));
    }
}
