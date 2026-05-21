package com.greenq.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "report")
public class Report {
    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "crop_id")
    private Long cropId;

    @Column(name = "delete_yn")
    private String deleteYn;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "env_nc_summary")
    private String envNcSummary;

    @Column(name = "env_summary")
    private String envSummary;

    @Column(name = "generated_condition_json")
    private String generatedConditionJson;

    @Column(name = "guide_summary")
    private String guideSummary;

    @Column(name = "quality_nc_summary")
    private String qualityNcSummary;

    @Column(name = "quality_summary")
    private String qualitySummary;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long reportId;

    @Column(name = "report_scope")
    private String reportScope;

    @Column(name = "report_status")
    private String reportStatus;

    @Column(name = "report_title")
    private String reportTitle;

    @Column(name = "report_type")
    private String reportType;

    @Column(name = "report_version")
    private Integer reportVersion;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "zone_id")
    private Long zoneId;

    public Report() {}

    public Long getBatchId() {
        return batchId;
    }

    public void setBatchId(Long batchId) {
        this.batchId = batchId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }

    public Long getCropId() {
        return cropId;
    }

    public void setCropId(Long cropId) {
        this.cropId = cropId;
    }

    public String getDeleteYn() {
        return deleteYn;
    }

    public void setDeleteYn(String deleteYn) {
        this.deleteYn = deleteYn;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getEnvNcSummary() {
        return envNcSummary;
    }

    public void setEnvNcSummary(String envNcSummary) {
        this.envNcSummary = envNcSummary;
    }

    public String getEnvSummary() {
        return envSummary;
    }

    public void setEnvSummary(String envSummary) {
        this.envSummary = envSummary;
    }

    public String getGeneratedConditionJson() {
        return generatedConditionJson;
    }

    public void setGeneratedConditionJson(String generatedConditionJson) {
        this.generatedConditionJson = generatedConditionJson;
    }

    public String getGuideSummary() {
        return guideSummary;
    }

    public void setGuideSummary(String guideSummary) {
        this.guideSummary = guideSummary;
    }

    public String getQualityNcSummary() {
        return qualityNcSummary;
    }

    public void setQualityNcSummary(String qualityNcSummary) {
        this.qualityNcSummary = qualityNcSummary;
    }

    public String getQualitySummary() {
        return qualitySummary;
    }

    public void setQualitySummary(String qualitySummary) {
        this.qualitySummary = qualitySummary;
    }

    public Long getReportId() {
        return reportId;
    }

    public void setReportId(Long reportId) {
        this.reportId = reportId;
    }

    public String getReportScope() {
        return reportScope;
    }

    public void setReportScope(String reportScope) {
        this.reportScope = reportScope;
    }

    public String getReportStatus() {
        return reportStatus;
    }

    public void setReportStatus(String reportStatus) {
        this.reportStatus = reportStatus;
    }

    public String getReportTitle() {
        return reportTitle;
    }

    public void setReportTitle(String reportTitle) {
        this.reportTitle = reportTitle;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public Integer getReportVersion() {
        return reportVersion;
    }

    public void setReportVersion(Integer reportVersion) {
        this.reportVersion = reportVersion;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public Long getZoneId() {
        return zoneId;
    }

    public void setZoneId(Long zoneId) {
        this.zoneId = zoneId;
    }

}
