package com.example.spotifyapi;

import com.example.spotifyapi.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SpotifyApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpotifyApiApplication.class, args);
    }
    
    /**
     * Initialize default data when the application starts
     */
    @Bean
    public CommandLineRunner initData(UserService userService) {
        return args -> {
            // Initialize default admin user
            userService.initializeDefaultUser();
        };
    }
}
