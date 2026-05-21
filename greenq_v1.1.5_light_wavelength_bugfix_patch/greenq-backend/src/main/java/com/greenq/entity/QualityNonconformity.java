package com.greenq.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "quality_nonconformity")
public class QualityNonconformity {
    @Column(name = "analysis_message")
    private String analysisMessage;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "crop_id")
    private Long cropId;

    @Column(name = "delete_yn")
    private String deleteYn;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deviation_rate")
    private BigDecimal deviationRate;

    @Column(name = "deviation_value")
    private BigDecimal deviationValue;

    @Column(name = "item_code")
    private String itemCode;

    @Column(name = "item_name")
    private String itemName;

    @Column(name = "measured_value")
    private BigDecimal measuredValue;

    @Column(name = "measurement_id")
    private Long measurementId;

    @Column(name = "occurred_at")
    private LocalDateTime occurredAt;

    @Column(name = "quality_eval_id")
    private Long qualityEvalId;

    @Column(name = "quality_eval_item_id")
    private Long qualityEvalItemId;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "quality_nc_id")
    private Long qualityNcId;

    @Column(name = "quality_nc_status")
    private String qualityNcStatus;

    @Column(name = "recommended_next_action")
    private String recommendedNextAction;

    @Column(name = "report_include_yn")
    private String reportIncludeYn;

    @Column(name = "severity")
    private String severity;

    @Column(name = "standard_max")
    private BigDecimal standardMax;

    @Column(name = "standard_min")
    private BigDecimal standardMin;

    public QualityNonconformity() {}

    public String getAnalysisMessage() {
        return analysisMessage;
    }

    public void setAnalysisMessage(String analysisMessage) {
        this.analysisMessage = analysisMessage;
    }

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

    public BigDecimal getDeviationRate() {
        return deviationRate;
    }

    public void setDeviationRate(BigDecimal deviationRate) {
        this.deviationRate = deviationRate;
    }

    public BigDecimal getDeviationValue() {
        return deviationValue;
    }

    public void setDeviationValue(BigDecimal deviationValue) {
        this.deviationValue = deviationValue;
    }

    public String getItemCode() {
        return itemCode;
    }

    public void setItemCode(String itemCode) {
        this.itemCode = itemCode;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public BigDecimal getMeasuredValue() {
        return measuredValue;
    }

    public void setMeasuredValue(BigDecimal measuredValue) {
        this.measuredValue = measuredValue;
    }

    public Long getMeasurementId() {
        return measurementId;
    }

    public void setMeasurementId(Long measurementId) {
        this.measurementId = measurementId;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }

    public Long getQualityEvalId() {
        return qualityEvalId;
    }

    public void setQualityEvalId(Long qualityEvalId) {
        this.qualityEvalId = qualityEvalId;
    }

    public Long getQualityEvalItemId() {
        return qualityEvalItemId;
    }

    public void setQualityEvalItemId(Long qualityEvalItemId) {
        this.qualityEvalItemId = qualityEvalItemId;
    }

    public Long getQualityNcId() {
        return qualityNcId;
    }

    public void setQualityNcId(Long qualityNcId) {
        this.qualityNcId = qualityNcId;
    }

    public String getQualityNcStatus() {
        return qualityNcStatus;
    }

    public void setQualityNcStatus(String qualityNcStatus) {
        this.qualityNcStatus = qualityNcStatus;
    }

    public String getRecommendedNextAction() {
        return recommendedNextAction;
    }

    public void setRecommendedNextAction(String recommendedNextAction) {
        this.recommendedNextAction = recommendedNextAction;
    }

    public String getReportIncludeYn() {
        return reportIncludeYn;
    }

    public void setReportIncludeYn(String reportIncludeYn) {
        this.reportIncludeYn = reportIncludeYn;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public BigDecimal getStandardMax() {
        return standardMax;
    }

    public void setStandardMax(BigDecimal standardMax) {
        this.standardMax = standardMax;
    }

    public BigDecimal getStandardMin() {
        return standardMin;
    }

    public void setStandardMin(BigDecimal standardMin) {
        this.standardMin = standardMin;
    }

}
