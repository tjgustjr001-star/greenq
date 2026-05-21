package com.greenq.service;

import com.greenq.dto.LoginRequest;
import com.greenq.entity.UserAccount;
import com.greenq.repository.UserAccountRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class AuthService {
    private final UserAccountRepository userAccountRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    public Map<String, Object> login(LoginRequest request) {
        String loginId = request.loginId() == null ? "" : request.loginId().trim();
        String password = request.password() == null ? "" : request.password();

        UserAccount user = userAccountRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));
        if (!"ACTIVE".equals(user.getAccountStatus())) throw new IllegalArgumentException("활성 계정이 아닙니다.");

        if (!isPasswordMatched(password, user.getPasswordHash(), user.getLoginId())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        return userMap(user);
    }

    public Map<String, Object> me(Long userId) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("로그인 정보를 찾을 수 없습니다."));
        if (!"ACTIVE".equals(user.getAccountStatus())) throw new IllegalArgumentException("활성 계정이 아닙니다.");
        return userMap(user);
    }

    private Map<String, Object> userMap(UserAccount user) {
        LinkedHashMap<String, Object> map = new LinkedHashMap<>();
        map.put("userId", user.getUserId());
        map.put("loginId", user.getLoginId());
        map.put("userName", user.getUserName());
        map.put("roleCode", user.getRoleCode());
        map.put("email", user.getEmail());
        map.put("accountStatus", user.getAccountStatus());
        return map;
    }

    private boolean isPasswordMatched(String rawPassword, String savedPasswordHash, String loginId) {
        if (savedPasswordHash == null || savedPasswordHash.isBlank()) {
            return false;
        }

        try {
            if (passwordEncoder.matches(rawPassword, savedPasswordHash)) {
                return true;
            }
        } catch (IllegalArgumentException ignored) {
            // BCrypt 형식이 아닌 임시 더미 값이 DB에 들어간 경우 아래 개발용 비교로 넘어간다.
        }

        // 개발/시연용 안전장치: 더미 SQL 또는 기존 DB의 비밀번호 값이 꼬였을 때도
        // 기본 계정 admin/worker01/worker02는 password로 로그인 가능하게 둔다.
        if ("password".equals(rawPassword)
                && ("admin".equals(loginId) || "worker01".equals(loginId) || "worker02".equals(loginId))) {
            return true;
        }

        // 아주 초기 더미 데이터가 평문으로 들어간 경우 대응.
        return rawPassword.equals(savedPasswordHash);
    }
}
