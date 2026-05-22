package com.greenq.repository;

import com.greenq.entity.GrowthMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GrowthMeasurementRepository extends JpaRepository<GrowthMeasurement, Long> {
}
