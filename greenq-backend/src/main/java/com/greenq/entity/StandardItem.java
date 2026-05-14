package com.greenq.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "standard_item")
public class StandardItem {
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "delete_yn")
    private String deleteYn;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "expected_text_value")
    private String expectedTextValue;

    @Column(name = "fail_rate")
    private BigDecimal failRate;

    @Column(name = "item_code")
    private String itemCode;

    @Column(name = "item_group")
    private String itemGroup;

    @Column(name = "item_name")
    private String itemName;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "standard_item_id")
    private Long standardItemId;

    @Column(name = "standard_max")
    private BigDecimal standardMax;

    @Column(name = "standard_min")
    private BigDecimal standardMin;

    @Column(name = "standard_set_id")
    private Long standardSetId;

    @Column(name = "target_value")
    private BigDecimal targetValue;

    @Column(name = "unit")
    private String unit;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "use_yn")
    private String useYn;

    @Column(name = "value_type")
    private String valueType;

    public StandardItem() {}

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

    public String getItemGroup() {
        return itemGroup;
    }

    public void setItemGroup(String itemGroup) {
        this.itemGroup = itemGroup;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
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

    public Long getStandardSetId() {
        return standardSetId;
    }

    public void setStandardSetId(Long standardSetId) {
        this.standardSetId = standardSetId;
    }

    public BigDecimal getTargetValue() {
        return targetValue;
    }

    public void setTargetValue(BigDecimal targetValue) {
        this.targetValue = targetValue;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUseYn() {
        return useYn;
    }

    public void setUseYn(String useYn) {
        this.useYn = useYn;
    }

    public String getValueType() {
        return valueType;
    }

    public void setValueType(String valueType) {
        this.valueType = valueType;
    }

}
