package com.example.spotifyapi.config;

import com.example.spotifyapi.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final AuthService authService;
    
    // List of endpoints that don't require authentication
    private final List<String> publicEndpoints = Arrays.asList(
        "/api/auth/login", 
        "/api/auth/request-api-key", 
        "/api/auth/authenticate-device",
        "/api/auth/validate-key",
        "/api/auth/validate-device",
        "/api/auth/revoke-device",
        "/api/stream/",
        "/h2-console/",
        "/error"
    );
    
    @Autowired
    public ApiKeyAuthFilter(AuthService authService) {
        this.authService = authService;
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request, 
        @NonNull HttpServletResponse response, 
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        String path = request.getRequestURI();
        String method = request.getMethod();
        
        // Log the request details for debugging
        System.out.println("Request: " + method + " " + path);
        
        // Special handling for API key validation endpoint
        if (path.equals("/api/auth/validate-key") && method.equals("POST")) {
            // Let the request through without checking headers
            // The endpoint itself will validate the API key in the request body
            filterChain.doFilter(request, response);
            return;
        }
        
        // Skip authentication for public endpoints
        if (isPublicEndpoint(path)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Check for API key in header
        String apiKey = request.getHeader("X-API-Key");
        
        if (apiKey != null && authService.validateApiKey(apiKey)) {
            // Valid API key provided
            filterChain.doFilter(request, response);
        } else {
            // No or invalid API key
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Unauthorized: Valid API key required");
        }
    }
    
    private boolean isPublicEndpoint(String path) {
        return publicEndpoints.stream().anyMatch(path::startsWith);
    }
}
