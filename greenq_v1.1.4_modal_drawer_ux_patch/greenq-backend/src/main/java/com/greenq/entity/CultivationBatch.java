package com.greenq.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cultivation_batch")
public class CultivationBatch {
    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "batch_name")
    private String batchName;

    @Column(name = "batch_status")
    private String batchStatus;

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

    @Column(name = "env_standard_set_id")
    private Long envStandardSetId;

    @Column(name = "expected_end_date")
    private LocalDate expectedEndDate;

    @Column(name = "planted_quantity")
    private Integer plantedQuantity;

    @Column(name = "quality_standard_set_id")
    private Long qualityStandardSetId;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "zone_id")
    private Long zoneId;

    public CultivationBatch() {}

    public LocalDate getActualEndDate() {
        return actualEndDate;
    }

    public void setActualEndDate(LocalDate actualEndDate) {
        this.actualEndDate = actualEndDate;
    }

    public Long getBatchId() {
        return batchId;
    }

    public void setBatchId(Long batchId) {
        this.batchId = batchId;
    }

    public String getBatchName() {
        return batchName;
    }

    public void setBatchName(String batchName) {
        this.batchName = batchName;
    }

    public String getBatchStatus() {
        return batchStatus;
    }

    public void setBatchStatus(String batchStatus) {
        this.batchStatus = batchStatus;
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

    public Long getEnvStandardSetId() {
        return envStandardSetId;
    }

    public void setEnvStandardSetId(Long envStandardSetId) {
        this.envStandardSetId = envStandardSetId;
    }

    public LocalDate getExpectedEndDate() {
        return expectedEndDate;
    }

    public void setExpectedEndDate(LocalDate expectedEndDate) {
        this.expectedEndDate = expectedEndDate;
    }

    public Integer getPlantedQuantity() {
        return plantedQuantity;
    }

    public void setPlantedQuantity(Integer plantedQuantity) {
        this.plantedQuantity = plantedQuantity;
    }

    public Long getQualityStandardSetId() {
        return qualityStandardSetId;
    }

    public void setQualityStandardSetId(Long qualityStandardSetId) {
        this.qualityStandardSetId = qualityStandardSetId;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getZoneId() {
        return zoneId;
    }

    public void setZoneId(Long zoneId) {
        this.zoneId = zoneId;
    }

}
