package com.greenq.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;
import java.util.TimeZone;

@Configuration
public class TimeConfig {
    public static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    @PostConstruct
    public void setDefaultTimeZone() {
        TimeZone.setDefault(TimeZone.getTimeZone(SEOUL_ZONE));
    }

    @Bean
    public Clock appClock() {
        return Clock.system(SEOUL_ZONE);
    }
}
