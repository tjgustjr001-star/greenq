package com.greenq.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "env_nonconformity")
public class EnvNonconformity {
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

    @Column(name = "env_eval_item_id")
    private Long envEvalItemId;

    @Column(name = "env_log_id")
    private Long envLogId;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "env_nc_id")
    private Long envNcId;

    @Column(name = "env_nc_status")
    private String envNcStatus;

    @Column(name = "guide_message")
    private String guideMessage;

    @Column(name = "item_code")
    private String itemCode;

    @Column(name = "item_name")
    private String itemName;

    @Column(name = "measured_value")
    private BigDecimal measuredValue;

    @Column(name = "occurred_at")
    private LocalDateTime occurredAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolved_env_log_id")
    private Long resolvedEnvLogId;

    @Column(name = "resolved_note")
    private String resolvedNote;

    @Column(name = "resolved_type")
    private String resolvedType;

    @Column(name = "severity")
    private String severity;

    @Column(name = "standard_max")
    private BigDecimal standardMax;

    @Column(name = "standard_min")
    private BigDecimal standardMin;

    @Column(name = "zone_id")
    private Long zoneId;

    public EnvNonconformity() {}

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

    public Long getEnvEvalItemId() {
        return envEvalItemId;
    }

    public void setEnvEvalItemId(Long envEvalItemId) {
        this.envEvalItemId = envEvalItemId;
    }

    public Long getEnvLogId() {
        return envLogId;
    }

    public void setEnvLogId(Long envLogId) {
        this.envLogId = envLogId;
    }

    public Long getEnvNcId() {
        return envNcId;
    }

    public void setEnvNcId(Long envNcId) {
        this.envNcId = envNcId;
    }

    public String getEnvNcStatus() {
        return envNcStatus;
    }

    public void setEnvNcStatus(String envNcStatus) {
        this.envNcStatus = envNcStatus;
    }

    public String getGuideMessage() {
        return guideMessage;
    }

    public void setGuideMessage(String guideMessage) {
        this.guideMessage = guideMessage;
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

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public Long getResolvedEnvLogId() {
        return resolvedEnvLogId;
    }

    public void setResolvedEnvLogId(Long resolvedEnvLogId) {
        this.resolvedEnvLogId = resolvedEnvLogId;
    }

    public String getResolvedNote() {
        return resolvedNote;
    }

    public void setResolvedNote(String resolvedNote) {
        this.resolvedNote = resolvedNote;
    }

    public String getResolvedType() {
        return resolvedType;
    }

    public void setResolvedType(String resolvedType) {
        this.resolvedType = resolvedType;
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

    public Long getZoneId() {
        return zoneId;
    }

    public void setZoneId(Long zoneId) {
        this.zoneId = zoneId;
    }

}
