package com.example.spotifyapi.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.client.ClientHttpRequestInterceptor;

import java.util.Collections;

@Configuration
@EnableConfigurationProperties(LidarrProperties.class)
public class LidarrConfig {

    @Bean
    public RestTemplate lidarrRestTemplate(LidarrProperties lidarrProperties) {
        RestTemplate restTemplate = new RestTemplate();
        
        // Add API key as a header interceptor
        ClientHttpRequestInterceptor apiKeyInterceptor = (request, body, execution) -> {
            request.getHeaders().add("X-Api-Key", lidarrProperties.getApiKey());
            return execution.execute(request, body);
        };
        
        restTemplate.setInterceptors(Collections.singletonList(apiKeyInterceptor));
        return restTemplate;
    }
}
