package com.greenq.controller;

import com.greenq.dto.ApiResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler({IllegalArgumentException.class, MethodArgumentNotValidException.class, ConstraintViolationException.class})
    public ResponseEntity<ApiResponse<Map<String, Object>>> badRequest(Exception e) {
        return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), Map.of()));
    }

    @ExceptionHandler({NoSuchElementException.class, EntityNotFoundException.class})
    public ResponseEntity<ApiResponse<Map<String, Object>>> notFound(Exception e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse<>(false, "데이터를 찾을 수 없습니다.", Map.of()));
    }
}
