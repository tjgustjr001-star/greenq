package com.greenq.repository;

import com.greenq.entity.GrowthMeasurementSample;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GrowthMeasurementSampleRepository extends JpaRepository<GrowthMeasurementSample, Long> {
}
