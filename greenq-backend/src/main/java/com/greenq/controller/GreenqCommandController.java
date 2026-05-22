package com.greenq.controller;

import com.greenq.dto.ApiResponse;
import com.greenq.service.GreenqCommandService;
import com.greenq.service.EnvironmentSimulatorService;
import com.greenq.service.EnvAlertService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class GreenqCommandController {
    private final GreenqCommandService service;
    private final EnvironmentSimulatorService environmentSimulatorService;
    private final EnvAlertService envAlertService;

    public GreenqCommandController(
            GreenqCommandService service,
            EnvironmentSimulatorService environmentSimulatorService,
            EnvAlertService envAlertService
    ) {
        this.service = service;
        this.environmentSimulatorService = environmentSimulatorService;
        this.envAlertService = envAlertService;
    }

    @PostMapping("/crops")
    public ApiResponse<?> createCrop(@RequestBody Map<String, Object> request) {
        return ApiResponse.ok("작물이 저장되었습니다.", service.saveCrop(request));
    }

    @PutMapping("/crops/{cropId}")
    public ApiResponse<?> updateCrop(@PathVariable Long cropId, @RequestBody Map<String, Object> request) {
        request.put("cropId", cropId);
        return ApiResponse.ok("작물이 수정되었습니다.", service.saveCrop(request));
    }

    @DeleteMapping("/crops/{cropId}")
    public ApiResponse<?> deleteCrop(@PathVariable Long cropId) {
        service.softDeleteCrop(cropId);
        return ApiResponse.ok("작물이 임시 삭제되었습니다.", Map.of("cropId", cropId));
    }

    @PostMapping("/zones")
    public ApiResponse<?> createZone(@RequestBody Map<String, Object> request) {
        return ApiResponse.ok("구역이 저장되었습니다.", service.saveZone(request));
    }

    @PutMapping("/zones/{zoneId}")
    public ApiResponse<?> updateZone(@PathVariable Long zoneId, @RequestBody Map<String, Object> request) {
        request.put("zoneId", zoneId);
        return ApiResponse.ok("구역이 수정되었습니다.", service.saveZone(request));
    }

    @DeleteMapping("/zones/{zoneId}")
    public ApiResponse<?> deleteZone(@PathVariable Long zoneId) {
        service.softDeleteZone(zoneId);
        return ApiResponse.ok("구역이 임시 삭제되었습니다.", Map.of("zoneId", zoneId));
    }

    @PostMapping("/users")
    public ApiResponse<?> createUser(@RequestBody Map<String, Object> request) {
        var saved = service.saveUser(request);
        return ApiResponse.ok("사용자가 등록되었습니다.", Map.of(
                "userId", saved.getUserId(),
                "loginId", saved.getLoginId(),
                "userName", saved.getUserName(),
                "roleCode", saved.getRoleCode(),
                "accountStatus", saved.getAccountStatus()
        ));
    }

    @PostMapping("/batches")
    public ApiResponse<?> createBatch(@RequestBody Map<String, Object> request) {
        return ApiResponse.ok("배치가 저장되었습니다.", service.saveBatch(request));
    }

    @PutMapping("/batches/{batchId}")
    public ApiResponse<?> updateBatch(@PathVariable Long batchId, @RequestBody Map<String, Object> request) {
        request.put("batchId", batchId);
        return ApiResponse.ok("배치가 수정되었습니다.", service.saveBatch(request));
    }


    @PostMapping("/batches/{batchId}/qr/regenerate")
    public ApiResponse<?> regenerateBatchQr(@PathVariable Long batchId) {
        var batch = service.regenerateBatchQrToken(batchId);
        return ApiResponse.ok("배치 QR 토큰이 재발급되었습니다.", Map.of(
                "batchId", batch.getBatchId(),
                "batchName", batch.getBatchName(),
                "qrToken", batch.getQrToken()
        ));
    }

    @DeleteMapping("/batches/{batchId}")
    public ApiResponse<?> deleteBatch(@PathVariable Long batchId) {
        service.softDeleteBatch(batchId);
        return ApiResponse.ok("배치가 임시 삭제되었습니다.", Map.of("batchId", batchId));
    }

    @PostMapping("/issues/env/{envNcId}/actions")
    public ApiResponse<?> addEnvironmentAction(@PathVariable Long envNcId, @RequestBody Map<String, Object> request) {
        return ApiResponse.ok("조치 이력이 등록되었습니다.", service.addEnvironmentAction(envNcId, request));
    }

    @PostMapping("/issues/quality/{qualityNcId}/reviews")
    public ApiResponse<?> addQualityReview(@PathVariable Long qualityNcId, @RequestBody Map<String, Object> request) {
        return ApiResponse.ok("품질 검토 이력이 등록되었습니다.", service.addQualityReview(qualityNcId, request));
    }

    @DeleteMapping("/issues/{issueType}/{rawId}")
    public ApiResponse<?> deleteIssue(@PathVariable String issueType, @PathVariable Long rawId) {
        service.softDeleteIssue(issueType, rawId);
        return ApiResponse.ok("부적합 이력이 임시 삭제되었습니다.", Map.of("issueType", issueType, "rawId", rawId));
    }

    @PostMapping("/environment-logs")
    public ApiResponse<?> createEnvironmentLog(@RequestBody Map<String, Object> request) {
        return ApiResponse.ok("환경 로그가 저장되었습니다.", service.saveEnvironmentLog(request));
    }

    @PostMapping("/environment-simulator/run")
    public ApiResponse<?> runEnvironmentSimulator(@RequestBody Map<String, Object> request) {
        Long batchId = request.get("batchId") == null ? null : Long.valueOf(String.valueOf(request.get("batchId")));
        boolean forceAbnormal = Boolean.parseBoolean(String.valueOf(request.getOrDefault("forceAbnormal", "false")));
        return ApiResponse.ok("환경 시뮬레이터 데이터가 생성되었습니다.", environmentSimulatorService.generate(forceAbnormal, batchId));
    }

    @PostMapping("/environment-simulator/catch-up")
    public ApiResponse<?> catchUpEnvironmentSimulator() {
        return ApiResponse.ok("누락된 환경 시뮬레이터 데이터 보충을 실행했습니다.", environmentSimulatorService.catchUpMissingSimulatorLogs("MANUAL"));
    }


    @PutMapping("/env-alerts/{alertId}/read")
    public ApiResponse<?> markEnvAlertRead(@PathVariable Long alertId, @RequestBody(required = false) Map<String, Object> request) {
        Long userId = request == null || request.get("userId") == null ? null : Long.valueOf(String.valueOf(request.get("userId")));
        return ApiResponse.ok("환경 알림을 읽음 처리했습니다.", envAlertService.markRead(alertId, userId));
    }

    @PutMapping("/env-alerts/{alertId}/close")
    public ApiResponse<?> closeEnvAlert(@PathVariable Long alertId, @RequestBody(required = false) Map<String, Object> request) {
        Long userId = request == null || request.get("userId") == null ? null : Long.valueOf(String.valueOf(request.get("userId")));
        return ApiResponse.ok("환경 알림을 닫았습니다.", envAlertService.close(alertId, userId));
    }

    @PutMapping("/issues/env/{envNcId}/alerts/read")
    public ApiResponse<?> markEnvIssueAlertsRead(@PathVariable Long envNcId, @RequestBody(required = false) Map<String, Object> request) {
        Long userId = request == null || request.get("userId") == null ? null : Long.valueOf(String.valueOf(request.get("userId")));
        int count = envAlertService.markReadByNonconformity(envNcId, userId);
        return ApiResponse.ok("환경 부적합 알림을 읽음 처리했습니다.", Map.of("envNcId", envNcId, "updatedCount", count));
    }

    @PutMapping("/issues/env/{envNcId}/alerts/close")
    public ApiResponse<?> closeEnvIssueAlerts(@PathVariable Long envNcId, @RequestBody(required = false) Map<String, Object> request) {
        Long userId = request == null || request.get("userId") == null ? null : Long.valueOf(String.valueOf(request.get("userId")));
        int count = envAlertService.closeByNonconformity(envNcId, userId);
        return ApiResponse.ok("환경 부적합 알림을 닫았습니다.", Map.of("envNcId", envNcId, "updatedCount", count));
    }

    @DeleteMapping("/environment-logs/{envLogId}")
    public ApiResponse<?> deleteEnvironmentLog(@PathVariable Long envLogId) {
        service.softDeleteEnvironmentLog(envLogId);
        return ApiResponse.ok("환경 로그가 임시 삭제되었습니다.", Map.of("envLogId", envLogId));
    }

    @PostMapping("/measurements")
    public ApiResponse<?> createMeasurement(@RequestBody Map<String, Object> request) {
        return ApiResponse.ok("실측 데이터가 등록되었습니다.", service.saveMeasurement(request));
    }

    @DeleteMapping("/measurements/{measurementId}")
    public ApiResponse<?> deleteMeasurement(@PathVariable Long measurementId) {
        service.softDeleteMeasurement(measurementId);
        return ApiResponse.ok("실측 데이터가 임시 삭제되었습니다.", Map.of("measurementId", measurementId));
    }

    @PostMapping("/reports")
    public ApiResponse<?> createReport(@RequestBody Map<String, Object> request) {
        return ApiResponse.ok("리포트가 생성되었습니다.", service.saveReport(request));
    }

    @DeleteMapping("/reports/{reportId}")
    public ApiResponse<?> deleteReport(@PathVariable Long reportId) {
        service.softDeleteReport(reportId);
        return ApiResponse.ok("리포트가 임시 삭제되었습니다.", Map.of("reportId", reportId));
    }

    @PutMapping("/crops/{cropId}/standards/{standardType}")
    public ApiResponse<?> updateCropStandards(@PathVariable Long cropId, @PathVariable String standardType, @RequestBody Map<String, Object> request) {
        service.saveCropStandards(cropId, standardType, request);
        return ApiResponse.ok("기준값이 저장되었습니다.", Map.of("cropId", cropId, "standardType", standardType));
    }

    @PutMapping("/deleted-data/{entityName}/{idValue}/restore")
    public ApiResponse<?> restoreDeletedData(@PathVariable String entityName, @PathVariable Long idValue) {
        service.restoreDeletedData(entityName, idValue);
        return ApiResponse.ok("삭제 데이터가 복원되었습니다.", Map.of("entityName", entityName, "idValue", idValue));
    }

    @DeleteMapping("/deleted-data/{entityName}/{idValue}")
    public ApiResponse<?> permanentDeleteDeletedData(@PathVariable String entityName, @PathVariable Long idValue) {
        service.permanentDeleteDeletedData(entityName, idValue);
        return ApiResponse.ok("삭제 데이터가 영구 삭제되었습니다.", Map.of("entityName", entityName, "idValue", idValue));
    }
}
