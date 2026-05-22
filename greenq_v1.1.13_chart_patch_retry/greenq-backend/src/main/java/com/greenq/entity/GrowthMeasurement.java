package com.greenq.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "growth_measurement")
public class GrowthMeasurement {
    @Column(name = "aggregation_method")
    private String aggregationMethod;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "delete_yn")
    private String deleteYn;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "fresh_weight")
    private BigDecimal freshWeight;

    @Column(name = "growth_stage")
    private String growthStage;

    @Column(name = "leaf_color")
    private String leafColor;

    @Column(name = "leaf_length")
    private BigDecimal leafLength;

    @Column(name = "leaf_width")
    private BigDecimal leafWidth;

    @Column(name = "measured_at")
    private LocalDateTime measuredAt;

    @Column(name = "measured_by")
    private Long measuredBy;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "measurement_id")
    private Long measurementId;

    @Column(name = "plant_height")
    private BigDecimal plantHeight;

    @Column(name = "quality_status")
    private String qualityStatus;

    @Column(name = "sample_count")
    private Integer sampleCount;

    @Column(name = "special_note")
    private String specialNote;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public GrowthMeasurement() {}

    public String getAggregationMethod() {
        return aggregationMethod;
    }

    public void setAggregationMethod(String aggregationMethod) {
        this.aggregationMethod = aggregationMethod;
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

    public BigDecimal getFreshWeight() {
        return freshWeight;
    }

    public void setFreshWeight(BigDecimal freshWeight) {
        this.freshWeight = freshWeight;
    }

    public String getGrowthStage() {
        return growthStage;
    }

    public void setGrowthStage(String growthStage) {
        this.growthStage = growthStage;
    }

    public String getLeafColor() {
        return leafColor;
    }

    public void setLeafColor(String leafColor) {
        this.leafColor = leafColor;
    }

    public BigDecimal getLeafLength() {
        return leafLength;
    }

    public void setLeafLength(BigDecimal leafLength) {
        this.leafLength = leafLength;
    }

    public BigDecimal getLeafWidth() {
        return leafWidth;
    }

    public void setLeafWidth(BigDecimal leafWidth) {
        this.leafWidth = leafWidth;
    }

    public LocalDateTime getMeasuredAt() {
        return measuredAt;
    }

    public void setMeasuredAt(LocalDateTime measuredAt) {
        this.measuredAt = measuredAt;
    }

    public Long getMeasuredBy() {
        return measuredBy;
    }

    public void setMeasuredBy(Long measuredBy) {
        this.measuredBy = measuredBy;
    }

    public Long getMeasurementId() {
        return measurementId;
    }

    public void setMeasurementId(Long measurementId) {
        this.measurementId = measurementId;
    }

    public BigDecimal getPlantHeight() {
        return plantHeight;
    }

    public void setPlantHeight(BigDecimal plantHeight) {
        this.plantHeight = plantHeight;
    }

    public String getQualityStatus() {
        return qualityStatus;
    }

    public void setQualityStatus(String qualityStatus) {
        this.qualityStatus = qualityStatus;
    }

    public Integer getSampleCount() {
        return sampleCount;
    }

    public void setSampleCount(Integer sampleCount) {
        this.sampleCount = sampleCount;
    }

    public String getSpecialNote() {
        return specialNote;
    }

    public void setSpecialNote(String specialNote) {
        this.specialNote = specialNote;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

}
