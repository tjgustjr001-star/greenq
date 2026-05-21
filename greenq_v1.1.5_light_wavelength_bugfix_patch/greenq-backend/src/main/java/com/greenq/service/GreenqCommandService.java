package com.greenq.service;

import com.greenq.entity.*;
import com.greenq.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class GreenqCommandService {
    private final CropRepository cropRepository;
    private final ZoneRepository zoneRepository;
    private final CultivationBatchRepository batchRepository;
    private final EnvNonconformityRepository envNonconformityRepository;
    private final EnvActionLogRepository envActionLogRepository;
    private final GrowthMeasurementRepository measurementRepository;
    private final GrowthMeasurementSampleRepository sampleRepository;
    private final ReportRepository reportRepository;
    private final EnvironmentLogRepository environmentLogRepository;
    private final UserAccountRepository userAccountRepository;
    private final QualityNonconformityRepository qualityNonconformityRepository;
    private final QualityReviewLogRepository qualityReviewLogRepository;
    private final EnvironmentEvaluationService environmentEvaluationService;
    private final EnvAlertService envAlertService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PersistenceContext
    private EntityManager em;

    public GreenqCommandService(
            CropRepository cropRepository,
            ZoneRepository zoneRepository,
            CultivationBatchRepository batchRepository,
            EnvNonconformityRepository envNonconformityRepository,
            EnvActionLogRepository envActionLogRepository,
            GrowthMeasurementRepository measurementRepository,
            GrowthMeasurementSampleRepository sampleRepository,
            ReportRepository reportRepository,
            EnvironmentLogRepository environmentLogRepository,
            UserAccountRepository userAccountRepository,
            QualityNonconformityRepository qualityNonconformityRepository,
            QualityReviewLogRepository qualityReviewLogRepository,
            EnvironmentEvaluationService environmentEvaluationService,
            EnvAlertService envAlertService
    ) {
        this.cropRepository = cropRepository;
        this.zoneRepository = zoneRepository;
        this.batchRepository = batchRepository;
        this.envNonconformityRepository = envNonconformityRepository;
        this.envActionLogRepository = envActionLogRepository;
        this.measurementRepository = measurementRepository;
        this.sampleRepository = sampleRepository;
        this.reportRepository = reportRepository;
        this.environmentLogRepository = environmentLogRepository;
        this.userAccountRepository = userAccountRepository;
        this.qualityNonconformityRepository = qualityNonconformityRepository;
        this.qualityReviewLogRepository = qualityReviewLogRepository;
        this.environmentEvaluationService = environmentEvaluationService;
        this.envAlertService = envAlertService;
    }

    public Crop saveCrop(Map<String, Object> req) {
        Crop crop = id(req, "cropId") == null ? new Crop() : cropRepository.findById(id(req, "cropId")).orElse(new Crop());
        crop.setCropName(str(req, "cropName"));
        crop.setVarietyName(str(req, "varietyName"));
        crop.setCropType(def(str(req, "cropType"), "LEAFY"));
        crop.setCropStatus(def(str(req, "cropStatus"), "ACTIVE"));
        crop.setDescription(str(req, "description"));
        crop.setDeleteYn("N");
        return cropRepository.save(crop);
    }

    public void softDeleteCrop(Long id) {
        Crop crop = cropRepository.findById(id).orElseThrow();
        crop.setDeleteYn("Y");
        crop.setDeletedAt(LocalDateTime.now());
    }

    public Zone saveZone(Map<String, Object> req) {
        Zone zone = id(req, "zoneId") == null ? new Zone() : zoneRepository.findById(id(req, "zoneId")).orElse(new Zone());
        zone.setZoneName(str(req, "zoneName"));
        zone.setLocationDesc(str(req, "locationDesc"));
        zone.setAreaSize(dec(req, "areaSize"));
        zone.setZoneStatus(def(str(req, "zoneStatus"), "ACTIVE"));
        zone.setDescription(str(req, "description"));
        zone.setDeleteYn("N");
        return zoneRepository.save(zone);
    }

    public void softDeleteZone(Long id) {
        Zone zone = zoneRepository.findById(id).orElseThrow();
        zone.setDeleteYn("Y");
        zone.setDeletedAt(LocalDateTime.now());
    }

    public UserAccount saveUser(Map<String, Object> req) {
        UserAccount user = id(req, "userId") == null ? new UserAccount() : userAccountRepository.findById(id(req, "userId")).orElse(new UserAccount());
        user.setLoginId(str(req, "loginId") == null ? null : str(req, "loginId").trim());
        user.setUserName(str(req, "userName") == null ? null : str(req, "userName").trim());
        user.setRoleCode(def(str(req, "roleCode"), "WORKER"));
        user.setAccountStatus(def(str(req, "accountStatus"), "ACTIVE"));
        user.setEmail(str(req, "email"));
        user.setPhone(str(req, "phone"));
        if (user.getUserId() == null) {
            String rawPassword = def(str(req, "password"), "password");
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            user.setCreatedAt(LocalDateTime.now());
        }
        user.setUpdatedAt(LocalDateTime.now());
        return userAccountRepository.save(user);
    }

    public CultivationBatch saveBatch(Map<String, Object> req) {
        CultivationBatch batch = id(req, "batchId") == null ? new CultivationBatch() : batchRepository.findById(id(req, "batchId")).orElse(new CultivationBatch());
        Long cropId = id(req, "cropId");
        Long zoneId = id(req, "zoneId");
        batch.setBatchName(str(req, "batchName"));
        batch.setCropId(cropId);
        batch.setZoneId(zoneId);
        batch.setPlantedQuantity(integer(req, "plantedQuantity"));
        batch.setStartDate(date(req, "startDate"));
        batch.setExpectedEndDate(date(req, "expectedEndDate"));
        batch.setActualEndDate(date(req, "actualEndDate"));
        batch.setBatchStatus(def(str(req, "batchStatus"), "GROWING"));
        batch.setCreatedBy(defId(id(req, "createdBy"), 1L));
        if (batch.getEnvStandardSetId() == null) batch.setEnvStandardSetId(activeStandardSetId(cropId, "ENV"));
        if (batch.getQualityStandardSetId() == null) batch.setQualityStandardSetId(activeStandardSetId(cropId, "QUALITY"));
        batch.setDeleteYn("N");
        return batchRepository.save(batch);
    }

    public void softDeleteBatch(Long id) {
        CultivationBatch batch = batchRepository.findById(id).orElseThrow();
        batch.setDeleteYn("Y");
        batch.setDeletedAt(LocalDateTime.now());
    }

    public EnvActionLog addEnvironmentAction(Long envNcId, Map<String, Object> req) {
        EnvNonconformity nc = envNonconformityRepository.findById(envNcId).orElseThrow();
        EnvActionLog log = new EnvActionLog();
        log.setEnvNcId(envNcId);
        log.setActionBy(defId(id(req, "actionBy"), 2L));
        log.setActionAt(LocalDateTime.now());
        log.setActionType(def(str(req, "actionType"), "CHECKED"));
        log.setActionContent(str(req, "actionContent"));
        log.setActionStatusAfter(def(str(req, "actionStatusAfter"), "IN_PROGRESS"));
        log.setResultNote(str(req, "resultNote"));
        nc.setEnvNcStatus(log.getActionStatusAfter());
        if ("RESOLVED".equalsIgnoreCase(log.getActionStatusAfter())) {
            envAlertService.closeByNonconformity(envNcId, log.getActionBy());
        } else {
            envAlertService.markReadByNonconformity(envNcId, log.getActionBy());
        }
        return envActionLogRepository.save(log);
    }

    public QualityReviewLog addQualityReview(Long qualityNcId, Map<String, Object> req) {
        QualityNonconformity nc = qualityNonconformityRepository.findById(qualityNcId).orElseThrow();
        QualityReviewLog review = new QualityReviewLog();
        review.setQualityEvalId(nc.getQualityEvalId());
        review.setReviewedBy(defId(id(req, "reviewedBy"), 1L));
        review.setReviewAt(LocalDateTime.now());
        review.setReviewContent(str(req, "reviewContent"));
        review.setCreatedAt(LocalDateTime.now());
        String nextStatus = def(str(req, "reviewStatusAfter"), "REVIEWED");
        nc.setQualityNcStatus(nextStatus);
        return qualityReviewLogRepository.save(review);
    }

    public GrowthMeasurement saveMeasurement(Map<String, Object> req) {
        GrowthMeasurement measurement = new GrowthMeasurement();
        measurement.setBatchId(id(req, "batchId"));
        measurement.setMeasuredBy(defId(id(req, "measuredBy"), 2L));
        measurement.setMeasuredAt(LocalDateTime.now());
        measurement.setSampleCount(integer(req, "sampleCount") == null ? 5 : integer(req, "sampleCount"));
        measurement.setAggregationMethod("AVG");
        measurement.setPlantHeight(dec(req, "plantHeight"));
        measurement.setLeafWidth(dec(req, "leafWidth"));
        measurement.setLeafLength(dec(req, "leafLength"));
        measurement.setFreshWeight(dec(req, "freshWeight"));
        measurement.setLeafColor(str(req, "leafColor"));
        measurement.setGrowthStage(str(req, "growthStage"));
        measurement.setSpecialNote(str(req, "specialNote"));
        measurement.setQualityStatus("MISSING");
        measurement.setDeleteYn("N");
        GrowthMeasurement saved = measurementRepository.save(measurement);
        Object samples = req.get("samples");
        if (samples instanceof List<?> list) {
            int no = 1;
            for (Object obj : list) {
                if (obj instanceof Map<?, ?> raw) {
                    @SuppressWarnings("unchecked") Map<String, Object> s = (Map<String, Object>) raw;
                    GrowthMeasurementSample sample = new GrowthMeasurementSample();
                    sample.setMeasurementId(saved.getMeasurementId());
                    sample.setSampleNo(integer(s, "sampleNo") == null ? no : integer(s, "sampleNo"));
                    sample.setPlantHeight(dec(s, "plantHeight"));
                    sample.setLeafWidth(dec(s, "leafWidth"));
                    sample.setLeafLength(dec(s, "leafLength"));
                    sample.setFreshWeight(dec(s, "freshWeight"));
                    sample.setLeafColor(str(s, "leafColor"));
                    sample.setGrowthStage(str(s, "growthStage"));
                    sample.setSpecialNote(def(str(s, "specialNote"), str(s, "note")));
                    sampleRepository.save(sample);
                    no++;
                }
            }
        }
        return saved;
    }

    public Report saveReport(Map<String, Object> req) {
        Report report = new Report();
        report.setReportTitle(str(req, "reportTitle"));
        report.setReportType(def(str(req, "reportType"), "DAILY"));
        report.setReportScope(def(str(req, "reportScope"), "BATCH"));
        report.setBatchId(id(req, "batchId"));
        report.setZoneId(id(req, "zoneId"));
        report.setCropId(id(req, "cropId"));
        report.setStartDate(date(req, "startDate"));
        report.setEndDate(date(req, "endDate"));
        report.setCreatedBy(defId(id(req, "createdBy"), 1L));
        report.setReportStatus("GENERATED");
        report.setReportVersion(1);
        report.setEnvSummary(str(req, "envSummary"));
        report.setQualitySummary(str(req, "qualitySummary"));
        report.setEnvNcSummary(str(req, "envNcSummary"));
        report.setQualityNcSummary(str(req, "qualityNcSummary"));
        report.setGuideSummary(str(req, "guideSummary"));
        report.setGeneratedConditionJson(str(req, "generatedConditionJson"));
        report.setDeleteYn("N");
        return reportRepository.save(report);
    }


    public EnvironmentLog saveEnvironmentLog(Map<String, Object> req) {
        EnvironmentLog log = new EnvironmentLog();
        log.setBatchId(id(req, "batchId"));
        log.setMeasuredAt(localDateTime(req, "measuredAt") == null ? LocalDateTime.now().withNano(0) : localDateTime(req, "measuredAt"));
        log.setTemperature(dec(req, "temperature"));
        log.setHumidity(dec(req, "humidity"));
        log.setCo2(dec(req, "co2"));
        log.setVpd(dec(req, "vpd"));
        log.setLightIntensity(dec(req, "lightIntensity"));
        log.setPhotoperiod(dec(req, "photoperiod"));
        log.setLightWavelength(str(req, "lightWavelength"));
        log.setPh(dec(req, "ph"));
        log.setWaterTemp(dec(req, "waterTemp"));
        log.setEc(dec(req, "ec"));
        log.setEnvStatus(normalizeJudgmentStatus(str(req, "envStatus"), "MISSING"));
        log.setDataSource(def(str(req, "dataSource"), "MANUAL"));
        log.setCreatedAt(LocalDateTime.now().withNano(0));
        log.setDeleteYn("N");
        EnvironmentLog saved = environmentLogRepository.save(log);
        environmentEvaluationService.evaluateSavedLog(
                saved,
                "MANUAL_NORMAL",
                "수동 환경 로그의 측정값이 정상 범위로 복귀하여 자동 해결 처리되었습니다."
        );
        return saved;
    }


    public void softDeleteEnvironmentLog(Long id) {
        EnvironmentLog log = environmentLogRepository.findById(id).orElseThrow();
        log.setDeleteYn("Y");
        log.setDeletedAt(LocalDateTime.now());
    }

    public void softDeleteMeasurement(Long id) {
        GrowthMeasurement measurement = measurementRepository.findById(id).orElseThrow();
        measurement.setDeleteYn("Y");
        measurement.setDeletedAt(LocalDateTime.now());
    }

    public void softDeleteReport(Long id) {
        Report report = reportRepository.findById(id).orElseThrow();
        report.setDeleteYn("Y");
        report.setDeletedAt(LocalDateTime.now());
    }

    public void softDeleteIssue(String issueType, Long rawId) {
        String table = "quality".equalsIgnoreCase(issueType) ? "quality_nonconformity" : "env_nonconformity";
        String idColumn = "quality".equalsIgnoreCase(issueType) ? "quality_nc_id" : "env_nc_id";
        em.createNativeQuery("update " + table + " set delete_yn = 'Y', deleted_at = :deletedAt where " + idColumn + " = :id")
                .setParameter("deletedAt", LocalDateTime.now()).setParameter("id", rawId).executeUpdate();
    }

    public void saveCropStandards(Long cropId, String standardType, Map<String, Object> req) {
        Long standardSetId = activeStandardSetId(cropId, standardType.toUpperCase());
        Object items = req.get("items");
        if (!(items instanceof List<?> list)) return;
        int sort = 1;
        for (Object obj : list) {
            if (!(obj instanceof Map<?, ?> raw)) continue;
            @SuppressWarnings("unchecked") Map<String, Object> item = (Map<String, Object>) raw;
            String itemCode = str(item, "itemCode");
            @SuppressWarnings("unchecked") List<Number> ids = em.createNativeQuery("select standard_item_id from standard_item where standard_set_id = :setId and item_code = :code")
                    .setParameter("setId", standardSetId).setParameter("code", itemCode).getResultList();
            if (ids.isEmpty()) {
                em.createNativeQuery("""
                        insert into standard_item
                        (standard_set_id, item_code, item_name, item_group, value_type, unit, standard_min, standard_max, fail_rate, use_yn, sort_order, delete_yn, created_at)
                        values (:setId, :code, :name, :grp, :valueType, :unit, :min, :max, :failRate, :useYn, :sortOrder, 'N', :now)
                        """)
                        .setParameter("setId", standardSetId).setParameter("code", itemCode).setParameter("name", str(item, "itemName"))
                        .setParameter("grp", str(item, "itemGroup")).setParameter("valueType", str(item, "valueType")).setParameter("unit", str(item, "unit"))
                        .setParameter("min", dec(item, "min")).setParameter("max", dec(item, "max")).setParameter("failRate", dec(item, "failRate"))
                        .setParameter("useYn", def(str(item, "useYn"), "N")).setParameter("sortOrder", sort++).setParameter("now", LocalDateTime.now()).executeUpdate();
            } else {
                em.createNativeQuery("""
                        update standard_item
                        set standard_min = :min, standard_max = :max, fail_rate = :failRate, use_yn = :useYn,
                            delete_yn = 'N', updated_at = :now
                        where standard_item_id = :id
                        """)
                        .setParameter("min", dec(item, "min")).setParameter("max", dec(item, "max")).setParameter("failRate", dec(item, "failRate"))
                        .setParameter("useYn", def(str(item, "useYn"), "N")).setParameter("now", LocalDateTime.now()).setParameter("id", ids.get(0).longValue()).executeUpdate();
            }
        }
    }

    public void restoreDeletedData(String entityName, Long idValue) {
        updateDeleteYn(entityName, idValue, "N", false);
    }

    public void permanentDeleteDeletedData(String entityName, Long idValue) {
        updateDeleteYn(entityName, idValue, "Y", true);
    }

    private void updateDeleteYn(String entityName, Long idValue, String deleteYn, boolean hardDelete) {
        String table;
        String idColumn;
        switch (entityName) {
            case "crops" -> { table = "crop"; idColumn = "crop_id"; }
            case "zones" -> { table = "zone"; idColumn = "zone_id"; }
            case "batches" -> { table = "cultivation_batch"; idColumn = "batch_id"; }
            case "environmentLogs" -> { table = "environment_log"; idColumn = "env_log_id"; }
            case "measurements" -> { table = "growth_measurement"; idColumn = "measurement_id"; }
            case "reports" -> { table = "report"; idColumn = "report_id"; }
            case "issuesEnv" -> { table = "env_nonconformity"; idColumn = "env_nc_id"; }
            case "issuesQuality" -> { table = "quality_nonconformity"; idColumn = "quality_nc_id"; }
            default -> throw new IllegalArgumentException("지원하지 않는 삭제 데이터 유형입니다: " + entityName);
        }
        if (hardDelete) {
            em.createNativeQuery("delete from " + table + " where " + idColumn + " = :id").setParameter("id", idValue).executeUpdate();
        } else {
            em.createNativeQuery("update " + table + " set delete_yn = :deleteYn, deleted_at = null where " + idColumn + " = :id")
                    .setParameter("deleteYn", deleteYn).setParameter("id", idValue).executeUpdate();
        }
    }

    private Long activeStandardSetId(Long cropId, String type) {
        @SuppressWarnings("unchecked")
        List<Number> ids = em.createNativeQuery("""
                select standard_set_id from standard_set
                where crop_id = :cropId and standard_type = :type and standard_status = 'ACTIVE' and coalesce(delete_yn, 'N') <> 'Y'
                order by effective_start_date desc, standard_set_id desc
                limit 1
                """).setParameter("cropId", cropId).setParameter("type", type).getResultList();
        if (ids.isEmpty()) throw new IllegalArgumentException("작물의 " + type + " 기준값이 없습니다.");
        return ids.get(0).longValue();
    }

    private static Long id(Map<String, Object> req, String key) {
        Object v = req.get(key);
        if (v == null || String.valueOf(v).isBlank()) return null;
        return Long.valueOf(String.valueOf(v));
    }

    private static Long defId(Long value, Long def) { return value == null ? def : value; }
    private static String str(Map<String, Object> req, String key) { Object v = req.get(key); return v == null ? null : String.valueOf(v); }
    private static String def(String value, String def) { return value == null || value.isBlank() ? def : value; }
    private static String normalizeJudgmentStatus(String value, String defaultValue) {
        if (value == null || value.isBlank()) return defaultValue;
        return switch (value.trim().toUpperCase()) {
            case "PASS" -> "NORMAL";
            case "WARNING" -> "CAUTION";
            case "NORMAL", "CAUTION", "FAIL", "MISSING", "SKIPPED" -> value.trim().toUpperCase();
            default -> defaultValue;
        };
    }
    private static BigDecimal dec(Map<String, Object> req, String key) { Object v = req.get(key); return v == null || String.valueOf(v).isBlank() ? null : new BigDecimal(String.valueOf(v)); }
    private static Integer integer(Map<String, Object> req, String key) { Object v = req.get(key); return v == null || String.valueOf(v).isBlank() ? null : Integer.valueOf(String.valueOf(v)); }
    private static LocalDate date(Map<String, Object> req, String key) { Object v = req.get(key); return v == null || String.valueOf(v).isBlank() ? null : LocalDate.parse(String.valueOf(v).substring(0, 10)); }
    private static LocalDateTime localDateTime(Map<String, Object> req, String key) {
        Object v = req.get(key);
        if (v == null || String.valueOf(v).isBlank()) return null;
        String text = String.valueOf(v).trim();
        if (text.length() == 10) return LocalDate.parse(text).atStartOfDay();
        return LocalDateTime.parse(text.replace(" ", "T")).withNano(0);
    }
}
