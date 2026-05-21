package com.greenq.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "standard_set")
public class StandardSet {
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "crop_id")
    private Long cropId;

    @Column(name = "delete_yn")
    private String deleteYn;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "effective_end_date")
    private LocalDate effectiveEndDate;

    @Column(name = "effective_start_date")
    private LocalDate effectiveStartDate;

    @Column(name = "standard_name")
    private String standardName;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "standard_set_id")
    private Long standardSetId;

    @Column(name = "standard_status")
    private String standardStatus;

    @Column(name = "standard_type")
    private String standardType;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public StandardSet() {}

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

    public LocalDate getEffectiveEndDate() {
        return effectiveEndDate;
    }

    public void setEffectiveEndDate(LocalDate effectiveEndDate) {
        this.effectiveEndDate = effectiveEndDate;
    }

    public LocalDate getEffectiveStartDate() {
        return effectiveStartDate;
    }

    public void setEffectiveStartDate(LocalDate effectiveStartDate) {
        this.effectiveStartDate = effectiveStartDate;
    }

    public String getStandardName() {
        return standardName;
    }

    public void setStandardName(String standardName) {
        this.standardName = standardName;
    }

    public Long getStandardSetId() {
        return standardSetId;
    }

    public void setStandardSetId(Long standardSetId) {
        this.standardSetId = standardSetId;
    }

    public String getStandardStatus() {
        return standardStatus;
    }

    public void setStandardStatus(String standardStatus) {
        this.standardStatus = standardStatus;
    }

    public String getStandardType() {
        return standardType;
    }

    public void setStandardType(String standardType) {
        this.standardType = standardType;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

}
