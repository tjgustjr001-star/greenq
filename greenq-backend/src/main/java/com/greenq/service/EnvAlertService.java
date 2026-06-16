package com.greenq.service;

import com.greenq.entity.EnvAlert;
import com.greenq.entity.EnvNonconformity;
import com.greenq.repository.EnvAlertRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class EnvAlertService {
    private final EnvAlertRepository envAlertRepository;
    private final Clock appClock;

    @PersistenceContext
    private EntityManager em;

    public EnvAlertService(EnvAlertRepository envAlertRepository, Clock appClock) {
        this.envAlertRepository = envAlertRepository;
        this.appClock = appClock;
    }
    public EnvAlert createOrRefreshAlert(EnvNonconformity nc, boolean createdNonconformity) {
        if (nc == null || nc.getEnvNcId() == null) {
            throw new IllegalArgumentException("환경 부적합이 저장된 뒤 알림을 생성할 수 있습니다.");
        }

        EnvAlert alert = findLatestActiveAlert(nc.getEnvNcId());
        if (alert == null) {
            alert = new EnvAlert();
            alert.setEnvNcId(nc.getEnvNcId());
            alert.setBatchId(nc.getBatchId());
            alert.setZoneId(nc.getZoneId());
            alert.setNotifiedRole("ALL");
            alert.setCreatedAt(now());
        }

        alert.setAlertLevel(normalizeLevel(nc.getSeverity()));
        alert.setAlertStatus("UNREAD");
        alert.setAlertTitle(alertTitle(nc));
        alert.setAlertMessage(alertMessage(nc, createdNonconformity));
        alert.setBatchId(nc.getBatchId());
        alert.setZoneId(nc.getZoneId());
        alert.setReadAt(null);
        alert.setReadBy(null);
        return envAlertRepository.save(alert);
    }

    public EnvAlert markRead(Long alertId, Long userId) {
        EnvAlert alert = envAlertRepository.findById(alertId).orElseThrow();
        if (!"CLOSED".equalsIgnoreCase(String.valueOf(alert.getAlertStatus()))) {
            alert.setAlertStatus("READ");
        }
        alert.setReadAt(now());
        alert.setReadBy(defaultUserId(userId));
        return alert;
    }

    public EnvAlert close(Long alertId, Long userId) {
        EnvAlert alert = envAlertRepository.findById(alertId).orElseThrow();
        alert.setAlertStatus("CLOSED");
        if (alert.getReadAt() == null) {
            alert.setReadAt(now());
        }
        if (alert.getReadBy() == null) {
            alert.setReadBy(defaultUserId(userId));
        }
        return alert;
    }

    public int markReadByNonconformity(Long envNcId, Long userId) {
        List<EnvAlert> alerts = activeAlertsByNonconformity(envNcId);
        for (EnvAlert alert : alerts) {
            if (!"CLOSED".equalsIgnoreCase(String.valueOf(alert.getAlertStatus()))) {
                alert.setAlertStatus("READ");
            }
            alert.setReadAt(now());
            alert.setReadBy(defaultUserId(userId));
        }
        return alerts.size();
    }

    public int closeByNonconformity(Long envNcId, Long userId) {
        List<EnvAlert> alerts = activeAlertsByNonconformity(envNcId);
        LocalDateTime now = now();
        for (EnvAlert alert : alerts) {
            alert.setAlertStatus("CLOSED");
            if (alert.getReadAt() == null) alert.setReadAt(now);
            if (alert.getReadBy() == null) alert.setReadBy(defaultUserId(userId));
        }
        return alerts.size();
    }

    public int closeResolvedAlerts(Long envNcId) {
        List<EnvAlert> alerts = activeAlertsByNonconformity(envNcId);
        LocalDateTime now = now();
        for (EnvAlert alert : alerts) {
            alert.setAlertStatus("CLOSED");
            if (alert.getReadAt() == null) alert.setReadAt(now);
        }
        return alerts.size();
    }

    private EnvAlert findLatestActiveAlert(Long envNcId) {
        @SuppressWarnings("unchecked")
        List<Number> ids = em.createNativeQuery("""
                select alert_id
                from env_alert
                where env_nc_id = :envNcId
                  and alert_status <> 'CLOSED'
                order by created_at desc, alert_id desc
                limit 1
                """)
                .setParameter("envNcId", envNcId)
                .getResultList();
        if (ids.isEmpty()) return null;
        return envAlertRepository.findById(ids.get(0).longValue()).orElse(null);
    }

    private List<EnvAlert> activeAlertsByNonconformity(Long envNcId) {
        @SuppressWarnings("unchecked")
        List<Number> ids = em.createNativeQuery("""
                select alert_id
                from env_alert
                where env_nc_id = :envNcId
                  and alert_status <> 'CLOSED'
                order by created_at desc, alert_id desc
                """)
                .setParameter("envNcId", envNcId)
                .getResultList();
        return ids.stream()
                .map(id -> envAlertRepository.findById(id.longValue()).orElse(null))
                .filter(alert -> alert != null)
                .toList();
    }

    private String alertTitle(EnvNonconformity nc) {
        String zone = nc.getZoneId() == null ? "구역" : "구역 #" + nc.getZoneId();
        String item = nc.getItemName() == null ? nc.getItemCode() : nc.getItemName();
        return zone + " " + item + " 기준 이탈";
    }

    private String alertMessage(EnvNonconformity nc, boolean createdNonconformity) {
        String statusWord = createdNonconformity ? "발생" : "지속/갱신";
        String value = plainNumber(nc.getMeasuredValue());
        String range = (nc.getStandardMin() == null && nc.getStandardMax() == null)
                ? "-"
                : (nc.getStandardMin() == null ? "" : plainNumber(nc.getStandardMin()))
                    + " ~ "
                    + (nc.getStandardMax() == null ? "" : plainNumber(nc.getStandardMax()));
        return "환경 부적합이 " + statusWord + "했습니다. 항목: " + safe(nc.getItemName(), nc.getItemCode())
                + ", 측정값: " + value + ", 기준: " + range
                + ", 심각도: " + normalizeLevel(nc.getSeverity()) + ".";
    }

    private String plainNumber(BigDecimal value) {
        if (value == null) return "-";
        return value.setScale(2, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
    }

    private String normalizeLevel(String severity) {
        return "FAIL".equalsIgnoreCase(String.valueOf(severity)) ? "FAIL" : "CAUTION";
    }

    private Long defaultUserId(Long userId) {
        return userId == null ? 1L : userId;
    }

    private String safe(String value, String fallback) {
        return value == null || value.isBlank() ? String.valueOf(fallback) : value;
    }

    private LocalDateTime now() {
        return LocalDateTime.now(appClock).withNano(0);
    }
}
