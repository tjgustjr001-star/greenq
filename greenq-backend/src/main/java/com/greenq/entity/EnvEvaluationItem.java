package com.greenq.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "env_evaluation_item")
public class EnvEvaluationItem {
    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "deviation_rate")
    private BigDecimal deviationRate;

    @Column(name = "deviation_value")
    private BigDecimal deviationValue;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "env_eval_item_id")
    private Long envEvalItemId;

    @Column(name = "env_log_id")
    private Long envLogId;

    @Column(name = "eval_status")
    private String evalStatus;

    @Column(name = "fail_rate")
    private BigDecimal failRate;

    @Column(name = "item_code")
    private String itemCode;

    @Column(name = "item_name")
    private String itemName;

    @Column(name = "measured_text_value")
    private String measuredTextValue;

    @Column(name = "measured_value")
    private BigDecimal measuredValue;

    @Column(name = "standard_item_id")
    private Long standardItemId;

    @Column(name = "standard_max")
    private BigDecimal standardMax;

    @Column(name = "standard_min")
    private BigDecimal standardMin;

    @Column(name = "unit")
    private String unit;

    public EnvEvaluationItem() {}

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

    public String getEvalStatus() {
        return evalStatus;
    }

    public void setEvalStatus(String evalStatus) {
        this.evalStatus = evalStatus;
    }

    public BigDecimal getFailRate() {
        return failRate;
    }

    public void setFailRate(BigDecimal failRate) {
        this.failRate = failRate;
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

    public String getMeasuredTextValue() {
        return measuredTextValue;
    }

    public void setMeasuredTextValue(String measuredTextValue) {
        this.measuredTextValue = measuredTextValue;
    }

    public BigDecimal getMeasuredValue() {
        return measuredValue;
    }

    public void setMeasuredValue(BigDecimal measuredValue) {
        this.measuredValue = measuredValue;
    }

    public Long getStandardItemId() {
        return standardItemId;
    }

    public void setStandardItemId(Long standardItemId) {
        this.standardItemId = standardItemId;
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

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

}
