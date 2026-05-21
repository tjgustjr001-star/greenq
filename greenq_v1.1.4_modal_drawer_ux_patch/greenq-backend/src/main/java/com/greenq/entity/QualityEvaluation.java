package com.greenq.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quality_evaluation")
public class QualityEvaluation {
    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "caution_item_count")
    private Integer cautionItemCount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "crop_id")
    private Long cropId;

    @Column(name = "evaluated_at")
    private LocalDateTime evaluatedAt;

    @Column(name = "fail_item_count")
    private Integer failItemCount;

    @Column(name = "measurement_id")
    private Long measurementId;

    @Column(name = "missing_item_count")
    private Integer missingItemCount;

    @Column(name = "normal_item_count")
    private Integer normalItemCount;

    @Column(name = "overall_status")
    private String overallStatus;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "quality_eval_id")
    private Long qualityEvalId;

    @Column(name = "report_reflected_yn")
    private String reportReflectedYn;

    @Column(name = "sample_count")
    private Integer sampleCount;

    @Column(name = "standard_set_id")
    private Long standardSetId;

    @Column(name = "summary_message")
    private String summaryMessage;

    public QualityEvaluation() {}

    public Long getBatchId() {
        return batchId;
    }

    public void setBatchId(Long batchId) {
        this.batchId = batchId;
    }

    public Integer getCautionItemCount() {
        return cautionItemCount;
    }

    public void setCautionItemCount(Integer cautionItemCount) {
        this.cautionItemCount = cautionItemCount;
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

    public LocalDateTime getEvaluatedAt() {
        return evaluatedAt;
    }

    public void setEvaluatedAt(LocalDateTime evaluatedAt) {
        this.evaluatedAt = evaluatedAt;
    }

    public Integer getFailItemCount() {
        return failItemCount;
    }

    public void setFailItemCount(Integer failItemCount) {
        this.failItemCount = failItemCount;
    }

    public Long getMeasurementId() {
        return measurementId;
    }

    public void setMeasurementId(Long measurementId) {
        this.measurementId = measurementId;
    }

    public Integer getMissingItemCount() {
        return missingItemCount;
    }

    public void setMissingItemCount(Integer missingItemCount) {
        this.missingItemCount = missingItemCount;
    }

    public Integer getNormalItemCount() {
        return normalItemCount;
    }

    public void setNormalItemCount(Integer normalItemCount) {
        this.normalItemCount = normalItemCount;
    }

    public String getOverallStatus() {
        return overallStatus;
    }

    public void setOverallStatus(String overallStatus) {
        this.overallStatus = overallStatus;
    }

    public Long getQualityEvalId() {
        return qualityEvalId;
    }

    public void setQualityEvalId(Long qualityEvalId) {
        this.qualityEvalId = qualityEvalId;
    }

    public String getReportReflectedYn() {
        return reportReflectedYn;
    }

    public void setReportReflectedYn(String reportReflectedYn) {
        this.reportReflectedYn = reportReflectedYn;
    }

    public Integer getSampleCount() {
        return sampleCount;
    }

    public void setSampleCount(Integer sampleCount) {
        this.sampleCount = sampleCount;
    }

    public Long getStandardSetId() {
        return standardSetId;
    }

    public void setStandardSetId(Long standardSetId) {
        this.standardSetId = standardSetId;
    }

    public String getSummaryMessage() {
        return summaryMessage;
    }

    public void setSummaryMessage(String summaryMessage) {
        this.summaryMessage = summaryMessage;
    }

}
