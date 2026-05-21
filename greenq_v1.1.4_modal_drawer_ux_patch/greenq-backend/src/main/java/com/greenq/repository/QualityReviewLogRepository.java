package com.greenq.repository;

import com.greenq.entity.QualityReviewLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QualityReviewLogRepository extends JpaRepository<QualityReviewLog, Long> {
}
