package com.greenq.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "environment_log")
public class EnvironmentLog {
    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "co2")
    private BigDecimal co2;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "data_source")
    private String dataSource;

    @Column(name = "delete_yn")
    private String deleteYn;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "ec")
    private BigDecimal ec;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "env_log_id")
    private Long envLogId;

    @Column(name = "env_status")
    private String envStatus;

    @Column(name = "humidity")
    private BigDecimal humidity;

    @Column(name = "light_intensity")
    private BigDecimal lightIntensity;

    @Column(name = "light_wavelength")
    private String lightWavelength;

    @Column(name = "measured_at")
    private LocalDateTime measuredAt;

    @Column(name = "ph")
    private BigDecimal ph;

    @Column(name = "photoperiod")
    private BigDecimal photoperiod;

    @Column(name = "temperature")
    private BigDecimal temperature;

    @Column(name = "vpd")
    private BigDecimal vpd;

    @Column(name = "water_temp")
    private BigDecimal waterTemp;

    public EnvironmentLog() {}

    public Long getBatchId() {
        return batchId;
    }

    public void setBatchId(Long batchId) {
        this.batchId = batchId;
    }

    public BigDecimal getCo2() {
        return co2;
    }

    public void setCo2(BigDecimal co2) {
        this.co2 = co2;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getDataSource() {
        return dataSource;
    }

    public void setDataSource(String dataSource) {
        this.dataSource = dataSource;
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

    public BigDecimal getEc() {
        return ec;
    }

    public void setEc(BigDecimal ec) {
        this.ec = ec;
    }

    public Long getEnvLogId() {
        return envLogId;
    }

    public void setEnvLogId(Long envLogId) {
        this.envLogId = envLogId;
    }

    public String getEnvStatus() {
        return envStatus;
    }

    public void setEnvStatus(String envStatus) {
        this.envStatus = envStatus;
    }

    public BigDecimal getHumidity() {
        return humidity;
    }

    public void setHumidity(BigDecimal humidity) {
        this.humidity = humidity;
    }

    public BigDecimal getLightIntensity() {
        return lightIntensity;
    }

    public void setLightIntensity(BigDecimal lightIntensity) {
        this.lightIntensity = lightIntensity;
    }

    public String getLightWavelength() {
        return lightWavelength;
    }

    public void setLightWavelength(String lightWavelength) {
        this.lightWavelength = lightWavelength;
    }

    public LocalDateTime getMeasuredAt() {
        return measuredAt;
    }

    public void setMeasuredAt(LocalDateTime measuredAt) {
        this.measuredAt = measuredAt;
    }

    public BigDecimal getPh() {
        return ph;
    }

    public void setPh(BigDecimal ph) {
        this.ph = ph;
    }

    public BigDecimal getPhotoperiod() {
        return photoperiod;
    }

    public void setPhotoperiod(BigDecimal photoperiod) {
        this.photoperiod = photoperiod;
    }

    public BigDecimal getTemperature() {
        return temperature;
    }

    public void setTemperature(BigDecimal temperature) {
        this.temperature = temperature;
    }

    public BigDecimal getVpd() {
        return vpd;
    }

    public void setVpd(BigDecimal vpd) {
        this.vpd = vpd;
    }

    public BigDecimal getWaterTemp() {
        return waterTemp;
    }

    public void setWaterTemp(BigDecimal waterTemp) {
        this.waterTemp = waterTemp;
    }

}
