package com.greenq.controller;

import com.greenq.dto.ApiResponse;
import com.greenq.dto.LoginRequest;
import com.greenq.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("로그인 성공", authService.login(request));
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> me(@RequestHeader("X-GreenQ-User-Id") Long userId) {
        return ApiResponse.ok(authService.me(userId));
    }
}
