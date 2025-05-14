package com.example.spotifyapi.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "lidarr")
public class LidarrProperties {
    private String baseUrl = "http://192.168.0.103:8686/api/v1";
    private String apiKey = "759365b6a6cd444d9d38734199169f0f";

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }
}
