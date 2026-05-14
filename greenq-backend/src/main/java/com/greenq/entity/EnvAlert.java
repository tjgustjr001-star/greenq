package com.greenq.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "env_alert")
public class EnvAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alert_id")
    private Long alertId;

    @Column(name = "alert_level")
    private String alertLevel;

    @Column(name = "alert_message")
    private String alertMessage;

    @Column(name = "alert_status")
    private String alertStatus;

    @Column(name = "alert_title")
    private String alertTitle;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "env_nc_id")
    private Long envNcId;

    @Column(name = "notified_role")
    private String notifiedRole;

    @Column(name = "notified_user_id")
    private Long notifiedUserId;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "read_by")
    private Long readBy;

    @Column(name = "zone_id")
    private Long zoneId;

    public EnvAlert() {}

    public Long getAlertId() {
        return alertId;
    }

    public void setAlertId(Long alertId) {
        this.alertId = alertId;
    }

    public String getAlertLevel() {
        return alertLevel;
    }

    public void setAlertLevel(String alertLevel) {
        this.alertLevel = alertLevel;
    }

    public String getAlertMessage() {
        return alertMessage;
    }

    public void setAlertMessage(String alertMessage) {
        this.alertMessage = alertMessage;
    }

    public String getAlertStatus() {
        return alertStatus;
    }

    public void setAlertStatus(String alertStatus) {
        this.alertStatus = alertStatus;
    }

    public String getAlertTitle() {
        return alertTitle;
    }

    public void setAlertTitle(String alertTitle) {
        this.alertTitle = alertTitle;
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

    public Long getEnvNcId() {
        return envNcId;
    }

    public void setEnvNcId(Long envNcId) {
        this.envNcId = envNcId;
    }

    public String getNotifiedRole() {
        return notifiedRole;
    }

    public void setNotifiedRole(String notifiedRole) {
        this.notifiedRole = notifiedRole;
    }

    public Long getNotifiedUserId() {
        return notifiedUserId;
    }

    public void setNotifiedUserId(Long notifiedUserId) {
        this.notifiedUserId = notifiedUserId;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }

    public Long getReadBy() {
        return readBy;
    }

    public void setReadBy(Long readBy) {
        this.readBy = readBy;
    }

    public Long getZoneId() {
        return zoneId;
    }

    public void setZoneId(Long zoneId) {
        this.zoneId = zoneId;
    }

}
