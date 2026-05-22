package com.greenq.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "growth_measurement_sample")
public class GrowthMeasurementSample {
    @Column(name = "created_at")
    private LocalDateTime createdAt;

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

    @Column(name = "measurement_id")
    private Long measurementId;

    @Column(name = "plant_height")
    private BigDecimal plantHeight;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sample_id")
    private Long sampleId;

    @Column(name = "sample_no")
    private Integer sampleNo;

    @Column(name = "special_note")
    private String specialNote;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public GrowthMeasurementSample() {}

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
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

    public Long getSampleId() {
        return sampleId;
    }

    public void setSampleId(Long sampleId) {
        this.sampleId = sampleId;
    }

    public Integer getSampleNo() {
        return sampleNo;
    }

    public void setSampleNo(Integer sampleNo) {
        this.sampleNo = sampleNo;
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
