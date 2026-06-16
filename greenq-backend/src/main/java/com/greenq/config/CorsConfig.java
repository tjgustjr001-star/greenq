package com.greenq.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Value("${app.cors.allowed-origins:}")
    private String allowedOrigins;

    @Value("${app.cors.allowed-origin-patterns:}")
    private String allowedOriginPatterns;

    private final AuthInterceptor authInterceptor;

    public CorsConfig(AuthInterceptor authInterceptor) {
        this.authInterceptor = authInterceptor;
    }

    @Override
    public void addInterceptors(org.springframework.web.servlet.config.annotation.InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor).addPathPatterns("/api/**");
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        String[] origins = Arrays.stream(allowedOrigins.split(","))
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toArray(String[]::new);

        String[] originPatterns = Arrays.stream(allowedOriginPatterns.split(","))
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toArray(String[]::new);

        CorsConfiguration configuration = new CorsConfiguration();
        if (origins.length > 0) {
            configuration.setAllowedOrigins(List.of(origins));
        }
        if (originPatterns.length > 0) {
            configuration.setAllowedOriginPatterns(List.of(originPatterns));
        }
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
