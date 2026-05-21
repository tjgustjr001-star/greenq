package com.greenq.repository;

import com.greenq.entity.EnvironmentLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnvironmentLogRepository extends JpaRepository<EnvironmentLog, Long> {
}
