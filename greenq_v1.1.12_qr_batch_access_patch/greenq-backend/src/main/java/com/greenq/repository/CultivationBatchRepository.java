package com.greenq.repository;

import com.greenq.entity.CultivationBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CultivationBatchRepository extends JpaRepository<CultivationBatch, Long> {
    Optional<CultivationBatch> findByQrToken(String qrToken);
}

