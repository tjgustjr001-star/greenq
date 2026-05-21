package com.greenq.repository;

import com.greenq.entity.QualityEvaluationItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QualityEvaluationItemRepository extends JpaRepository<QualityEvaluationItem, Long> {
}
