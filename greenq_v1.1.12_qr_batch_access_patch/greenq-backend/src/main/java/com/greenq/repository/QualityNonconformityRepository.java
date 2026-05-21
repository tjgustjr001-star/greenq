package com.greenq.repository;

import com.greenq.entity.QualityNonconformity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QualityNonconformityRepository extends JpaRepository<QualityNonconformity, Long> {
}
