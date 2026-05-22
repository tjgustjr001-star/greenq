package com.greenq.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quality_review_log")
public class QualityReviewLog {
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "quality_eval_id")
    private Long qualityEvalId;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "quality_review_id")
    private Long qualityReviewId;

    @Column(name = "review_at")
    private LocalDateTime reviewAt;

    @Column(name = "review_content")
    private String reviewContent;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    public QualityReviewLog() {}

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getQualityEvalId() {
        return qualityEvalId;
    }

    public void setQualityEvalId(Long qualityEvalId) {
        this.qualityEvalId = qualityEvalId;
    }

    public Long getQualityReviewId() {
        return qualityReviewId;
    }

    public void setQualityReviewId(Long qualityReviewId) {
        this.qualityReviewId = qualityReviewId;
    }

    public LocalDateTime getReviewAt() {
        return reviewAt;
    }

    public void setReviewAt(LocalDateTime reviewAt) {
        this.reviewAt = reviewAt;
    }

    public String getReviewContent() {
        return reviewContent;
    }

    public void setReviewContent(String reviewContent) {
        this.reviewContent = reviewContent;
    }

    public Long getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(Long reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

}
