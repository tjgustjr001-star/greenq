package com.greenq.repository;

import com.greenq.entity.QualityEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QualityEvaluationRepository extends JpaRepository<QualityEvaluation, Long> {
}
