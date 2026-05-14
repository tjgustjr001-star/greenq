package com.greenq.repository;

import com.greenq.entity.EnvActionLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnvActionLogRepository extends JpaRepository<EnvActionLog, Long> {
}
