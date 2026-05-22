package com.greenq.repository;

import com.greenq.entity.EnvAlert;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnvAlertRepository extends JpaRepository<EnvAlert, Long> {
}
