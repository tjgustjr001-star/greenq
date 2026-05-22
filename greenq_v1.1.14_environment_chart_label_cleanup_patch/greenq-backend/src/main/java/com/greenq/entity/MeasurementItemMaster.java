package com.greenq.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "measurement_item_master")
public class MeasurementItemMaster {
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "default_use_yn")
    private String defaultUseYn;

    @Column(name = "entity_field")
    private String entityField;

    @Id
    @Column(name = "item_code")
    private String itemCode;

    @Column(name = "item_group")
    private String itemGroup;

    @Column(name = "item_name")
    private String itemName;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "standard_type")
    private String standardType;

    @Column(name = "unit")
    private String unit;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "use_yn")
    private String useYn;

    @Column(name = "value_type")
    private String valueType;

    public MeasurementItemMaster() {}

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getDefaultUseYn() {
        return defaultUseYn;
    }

    public void setDefaultUseYn(String defaultUseYn) {
        this.defaultUseYn = defaultUseYn;
    }

    public String getEntityField() {
        return entityField;
    }

    public void setEntityField(String entityField) {
        this.entityField = entityField;
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

    public String getStandardType() {
        return standardType;
    }

    public void setStandardType(String standardType) {
        this.standardType = standardType;
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
