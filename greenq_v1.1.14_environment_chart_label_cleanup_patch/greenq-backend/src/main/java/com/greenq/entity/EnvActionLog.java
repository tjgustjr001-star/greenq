package com.greenq.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "env_action_log")
public class EnvActionLog {
    @Column(name = "action_at")
    private LocalDateTime actionAt;

    @Column(name = "action_by")
    private Long actionBy;

    @Column(name = "action_content")
    private String actionContent;

    @Column(name = "action_status_after")
    private String actionStatusAfter;

    @Column(name = "action_type")
    private String actionType;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "env_action_id")
    private Long envActionId;

    @Column(name = "env_nc_id")
    private Long envNcId;

    @Column(name = "result_note")
    private String resultNote;

    public EnvActionLog() {}

    public LocalDateTime getActionAt() {
        return actionAt;
    }

    public void setActionAt(LocalDateTime actionAt) {
        this.actionAt = actionAt;
    }

    public Long getActionBy() {
        return actionBy;
    }

    public void setActionBy(Long actionBy) {
        this.actionBy = actionBy;
    }

    public String getActionContent() {
        return actionContent;
    }

    public void setActionContent(String actionContent) {
        this.actionContent = actionContent;
    }

    public String getActionStatusAfter() {
        return actionStatusAfter;
    }

    public void setActionStatusAfter(String actionStatusAfter) {
        this.actionStatusAfter = actionStatusAfter;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getEnvActionId() {
        return envActionId;
    }

    public void setEnvActionId(Long envActionId) {
        this.envActionId = envActionId;
    }

    public Long getEnvNcId() {
        return envNcId;
    }

    public void setEnvNcId(Long envNcId) {
        this.envNcId = envNcId;
    }

    public String getResultNote() {
        return resultNote;
    }

    public void setResultNote(String resultNote) {
        this.resultNote = resultNote;
    }

}
