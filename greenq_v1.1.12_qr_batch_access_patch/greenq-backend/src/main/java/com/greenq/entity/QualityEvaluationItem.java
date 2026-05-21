package com.greenq.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "quality_evaluation_item")
public class QualityEvaluationItem {
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "deviation_rate")
    private BigDecimal deviationRate;

    @Column(name = "deviation_value")
    private BigDecimal deviationValue;

    @Column(name = "eval_status")
    private String evalStatus;

    @Column(name = "expected_text_value")
    private String expectedTextValue;

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

    @Column(name = "measurement_id")
    private Long measurementId;

    @Column(name = "quality_eval_id")
    private Long qualityEvalId;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "quality_eval_item_id")
    private Long qualityEvalItemId;

    @Column(name = "standard_item_id")
    private Long standardItemId;

    @Column(name = "standard_max")
    private BigDecimal standardMax;

    @Column(name = "standard_min")
    private BigDecimal standardMin;

    @Column(name = "unit")
    private String unit;

    public QualityEvaluationItem() {}

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

    public String getEvalStatus() {
        return evalStatus;
    }

    public void setEvalStatus(String evalStatus) {
        this.evalStatus = evalStatus;
    }

    public String getExpectedTextValue() {
        return expectedTextValue;
    }

    public void setExpectedTextValue(String expectedTextValue) {
        this.expectedTextValue = expectedTextValue;
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

    public Long getMeasurementId() {
        return measurementId;
    }

    public void setMeasurementId(Long measurementId) {
        this.measurementId = measurementId;
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
