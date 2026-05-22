package com.greenq.config;

import com.greenq.entity.UserAccount;
import com.greenq.repository.UserAccountRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;

@Component
public class AuthInterceptor implements HandlerInterceptor {
    private final UserAccountRepository userAccountRepository;

    public AuthInterceptor(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String method = request.getMethod();
        String path = request.getRequestURI();

        if ("OPTIONS".equalsIgnoreCase(method) || isPublicPath(path)) {
            return true;
        }

        UserAccount user = currentUser(request);
        String role = normalizeRole(user.getRoleCode());

        if (isWorkerOnlyPath(path) && !"WORKER".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "작업자 계정만 접근할 수 있습니다.");
        }

        if (isAdminOnlyPath(method, path) && !"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 권한이 필요한 기능입니다.");
        }

        request.setAttribute("greenqUserId", user.getUserId());
        request.setAttribute("greenqRole", role);
        return true;
    }

    private boolean isPublicPath(String path) {
        return "/api/health".equals(path) || "/api/auth/login".equals(path);
    }

    private UserAccount currentUser(HttpServletRequest request) {
        String userIdHeader = request.getHeader("X-GreenQ-User-Id");
        String loginIdHeader = request.getHeader("X-GreenQ-Login-Id");
        String roleHeader = normalizeRole(request.getHeader("X-GreenQ-Role"));

        if ((userIdHeader == null || userIdHeader.isBlank()) && (loginIdHeader == null || loginIdHeader.isBlank())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }

        Optional<UserAccount> found = Optional.empty();
        if (userIdHeader != null && !userIdHeader.isBlank()) {
            try {
                found = userAccountRepository.findById(Long.valueOf(userIdHeader));
            } catch (NumberFormatException ignored) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 정보가 올바르지 않습니다.");
            }
        }

        UserAccount user = found.orElseGet(() -> userAccountRepository.findByLoginId(loginIdHeader)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 정보를 찾을 수 없습니다.")));

        if (!"ACTIVE".equalsIgnoreCase(String.valueOf(user.getAccountStatus()))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "활성 계정이 아닙니다.");
        }

        if (roleHeader != null && !roleHeader.isBlank() && !roleHeader.equals(normalizeRole(user.getRoleCode()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "권한 정보가 현재 계정과 일치하지 않습니다.");
        }

        return user;
    }

    private boolean isWorkerOnlyPath(String path) {
        return path.equals("/api/worker-home") || path.startsWith("/api/worker-home/");
    }

    private boolean isAdminOnlyPath(String method, String path) {
        if (path.equals("/api/dashboard") || path.startsWith("/api/dashboard/")) return true;
        if (path.equals("/api/users") || path.startsWith("/api/users/")) return true;
        if (path.equals("/api/measurement-items") || path.startsWith("/api/measurement-items/")) return true;
        if (path.equals("/api/deleted-data") || path.startsWith("/api/deleted-data/")) return true;
        if (path.equals("/api/reports") || path.startsWith("/api/reports/")) return true;
        if (path.equals("/api/environment-simulator/run") || path.equals("/api/environment-simulator/catch-up")) return true;
        if (path.matches("^/api/crops/\\d+$") || path.startsWith("/api/crops/") || (path.equals("/api/crops") && !"GET".equalsIgnoreCase(method))) return true;
        if (path.matches("^/api/zones/\\d+$") || path.startsWith("/api/zones/") || (path.equals("/api/zones") && !"GET".equalsIgnoreCase(method))) return true;
        if (path.matches("^/api/batches/\\d+$") || path.startsWith("/api/batches/") || (path.equals("/api/batches") && !"GET".equalsIgnoreCase(method))) return true;
        if (path.equals("/api/environment-logs") && !"GET".equalsIgnoreCase(method)) return true;
        if (path.matches("^/api/environment-logs/\\d+$") && !"GET".equalsIgnoreCase(method)) return true;
        if (path.matches("^/api/issues/quality/\\d+/reviews$") && !"GET".equalsIgnoreCase(method)) return true;
        if (path.matches("^/api/issues/[^/]+/\\d+$") && "DELETE".equalsIgnoreCase(method)) return true;
        if (path.matches("^/api/measurements/\\d+$") && "DELETE".equalsIgnoreCase(method)) return true;
        return false;
    }

    private String normalizeRole(String role) {
        if (role == null) return "";
        String normalized = role.trim().toUpperCase();
        return "ADMIN".equals(normalized) ? "ADMIN" : "WORKER".equals(normalized) ? "WORKER" : normalized;
    }
}
