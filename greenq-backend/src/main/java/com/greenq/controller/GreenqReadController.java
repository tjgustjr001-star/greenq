package com.greenq.controller;

import com.greenq.dto.ApiResponse;
import com.greenq.service.GreenqQueryService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class GreenqReadController {
    private final GreenqQueryService service;

    public GreenqReadController(GreenqQueryService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        return ApiResponse.ok(Map.of("status", "UP", "time", LocalDateTime.now().toString()));
    }

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> dashboard() {
        return ApiResponse.ok(service.dashboard());
    }

    @GetMapping("/worker-home")
    public ApiResponse<Map<String, Object>> workerHome(@RequestParam(required = false) Long userId) {
        return ApiResponse.ok(service.workerHome(userId));
    }

    @GetMapping("/users")
    public ApiResponse<List<Map<String, Object>>> users() {
        return ApiResponse.ok(service.users());
    }

    @GetMapping("/measurement-items")
    public ApiResponse<List<Map<String, Object>>> measurementItems() {
        return ApiResponse.ok(service.itemMasters());
    }

    @GetMapping("/crops")
    public ApiResponse<List<Map<String, Object>>> crops() {
        return ApiResponse.ok(service.crops());
    }

    @GetMapping("/crops/{cropId}")
    public ApiResponse<Map<String, Object>> crop(@PathVariable Long cropId) {
        return ApiResponse.ok(service.crop(cropId));
    }

    @GetMapping("/crops/{cropId}/standards/{standardType}")
    public ApiResponse<List<Map<String, Object>>> cropStandards(@PathVariable Long cropId, @PathVariable String standardType) {
        return ApiResponse.ok(service.standardItems(cropId, standardType.toUpperCase()));
    }

    @GetMapping("/zones")
    public ApiResponse<List<Map<String, Object>>> zones() {
        return ApiResponse.ok(service.zones());
    }

    @GetMapping("/zones/{zoneId}")
    public ApiResponse<Map<String, Object>> zone(@PathVariable Long zoneId) {
        return ApiResponse.ok(service.zone(zoneId));
    }

    @GetMapping("/batches")
    public ApiResponse<List<Map<String, Object>>> batches() {
        return ApiResponse.ok(service.batches());
    }

    @GetMapping("/batches/{batchId}")
    public ApiResponse<Map<String, Object>> batch(@PathVariable Long batchId) {
        return ApiResponse.ok(service.batch(batchId));
    }


    @GetMapping("/batches/{batchId}/qr")
    public ApiResponse<Map<String, Object>> batchQr(@PathVariable Long batchId) {
        return ApiResponse.ok(service.batchQr(batchId));
    }

    @GetMapping("/scan/batch/{qrToken}")
    public ApiResponse<Map<String, Object>> scanBatch(@PathVariable String qrToken) {
        return ApiResponse.ok(service.scanBatchByQrToken(qrToken));
    }

    @GetMapping("/environment-logs")
    public ApiResponse<List<Map<String, Object>>> environmentLogs(
            @RequestParam(required = false) Long batchId,
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) Integer hours
    ) {
        return ApiResponse.ok(service.environmentLogs(batchId, zoneId, hours));
    }

    @GetMapping("/environment-logs/{envLogId}")
    public ApiResponse<Map<String, Object>> environmentLog(@PathVariable Long envLogId) {
        return ApiResponse.ok(service.environmentLog(envLogId));
    }

    @GetMapping("/issues")
    public ApiResponse<List<Map<String, Object>>> issues() {
        return ApiResponse.ok(service.issues());
    }

    @GetMapping("/issues/env/alerts")
    public ApiResponse<List<Map<String, Object>>> envIssueAlerts() {
        return ApiResponse.ok(service.envIssueAlerts());
    }

    @GetMapping("/env-alerts")
    public ApiResponse<List<Map<String, Object>>> envAlerts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long envNcId
    ) {
        return ApiResponse.ok(service.envAlerts(status, envNcId));
    }

    @GetMapping("/issues/{issueId}")
    public ApiResponse<Map<String, Object>> issue(@PathVariable String issueId) {
        return ApiResponse.ok(service.issue(issueId));
    }

    @GetMapping("/issues/env/{envNcId}/actions")
    public ApiResponse<List<Map<String, Object>>> issueActions(@PathVariable Long envNcId) {
        return ApiResponse.ok(service.issueActions(envNcId));
    }

    @GetMapping("/issues/quality/{qualityNcId}/reviews")
    public ApiResponse<List<Map<String, Object>>> qualityReviews(@PathVariable Long qualityNcId) {
        return ApiResponse.ok(service.qualityReviews(qualityNcId));
    }

    @GetMapping("/measurements")
    public ApiResponse<List<Map<String, Object>>> measurements(@RequestParam(required = false) Long batchId) {
        return ApiResponse.ok(service.measurements(batchId));
    }

    @GetMapping("/measurements/{measurementId}")
    public ApiResponse<Map<String, Object>> measurement(@PathVariable Long measurementId) {
        return ApiResponse.ok(service.measurement(measurementId));
    }

    @GetMapping("/deleted-data")
    public ApiResponse<List<Map<String, Object>>> deletedData() {
        return ApiResponse.ok(service.deletedData());
    }

    @GetMapping("/reports")
    public ApiResponse<List<Map<String, Object>>> reports() {
        return ApiResponse.ok(service.reports());
    }

    @GetMapping("/reports/{reportId}")
    public ApiResponse<Map<String, Object>> report(@PathVariable Long reportId) {
        return ApiResponse.ok(service.report(reportId));
    }
}
