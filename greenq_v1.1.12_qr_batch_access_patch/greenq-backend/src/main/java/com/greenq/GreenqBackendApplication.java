package com.greenq;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class GreenqBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(GreenqBackendApplication.class, args);
    }
}
