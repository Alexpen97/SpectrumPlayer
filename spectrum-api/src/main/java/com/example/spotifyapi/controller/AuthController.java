package com.example.spotifyapi.controller;

import com.example.spotifyapi.model.ApiKey;
import com.example.spotifyapi.model.AuthenticatedDevice;
import com.example.spotifyapi.model.User;
import com.example.spotifyapi.service.AuthService;
import com.example.spotifyapi.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @Autowired
    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    /**
     * Request an API key for a user. The key will be sent via email.
     * @param credentials Map containing username and email
     * @return Success message
     */
    @PostMapping("/request-api-key")
    public ResponseEntity<?> requestApiKey(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String email = credentials.get("email");
        
        if (username == null || email == null) {
            return ResponseEntity.badRequest().body("Username and email are required");
        }
        
        Optional<ApiKey> apiKeyOpt = authService.generateAndSendApiKey(username, email);
        
        if (apiKeyOpt.isPresent()) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "API key has been sent to your email");
            response.put("expiresAt", apiKeyOpt.get().getExpiresAt());
            
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
    }
    
    /**
     * Authenticate a device with username, password, and API key
     * @param authRequest Map containing username, password, apiKey, deviceId, and deviceName
     * @return User details with auth token
     */
    @PostMapping("/authenticate-device")
    public ResponseEntity<?> authenticateDevice(@RequestBody Map<String, String> authRequest) {
        String username = authRequest.get("username");
        String password = authRequest.get("password");
        String apiKey = authRequest.get("apiKey");
        String deviceId = authRequest.get("deviceId");
        String deviceName = authRequest.get("deviceName");
        
        if (username == null || password == null || apiKey == null || deviceId == null || deviceName == null) {
            return ResponseEntity.badRequest().body("All fields are required: username, password, apiKey, deviceId, deviceName");
        }
        
        Optional<AuthenticatedDevice> deviceOpt = authService.authenticateDevice(
            username, password, apiKey, deviceId, deviceName
        );
        
        if (deviceOpt.isPresent()) {
            User user = deviceOpt.get().getUser();
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("deviceId", deviceOpt.get().getDeviceIdentifier());
            response.put("apiKey", apiKey); // Include the API key in the response
            response.put("message", "Device authenticated successfully");
            
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication failed");
        }
    }
    
    /**
     * Authenticate a user with username and password (lightweight check)
     * @param credentials Map containing username and password
     * @return User details
     */
    /**
     * Validate if an API key is still valid and activated
     * @param request Map containing the API key to validate
     * @return Validation result with user information if valid
     */
    
    @PostMapping("/validate-key")
    public ResponseEntity<?> validateApiKey(@RequestBody Map<String, String> request) {
        System.out.println("POST /api/auth/validate-key called with request: " + request);
        String apiKey = request.get("apiKey");
        
        if (apiKey == null || apiKey.isEmpty()) {
            System.out.println("API key validation failed: key is null or empty in request");
            return ResponseEntity.badRequest().body(Map.of(
                "valid", false,
                "message", "API key is required"
            ));
        }
        
        try {
            boolean isValid = authService.validateApiKey(apiKey);
            Optional<User> userOpt = authService.getUserByApiKey(apiKey);
            
            if (isValid && userOpt.isPresent()) {
                User user = userOpt.get();
                Map<String, Object> response = new HashMap<>();
                response.put("id", user.getId());
                response.put("username", user.getUsername());
                response.put("valid", true);
                response.put("message", "API key is valid and activated");
                
                System.out.println("API key validation successful for user: " + user.getUsername());
                return ResponseEntity.ok(response);
            } else {
                String reason = !isValid ? "key is not valid" : "user not found";
                System.out.println("API key validation failed: " + reason);
                
                Map<String, Object> response = new HashMap<>();
                response.put("valid", false);
                response.put("message", "API key is invalid or expired");
                
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
        } catch (Exception e) {
            System.err.println("Exception during API key validation: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "valid", false,
                "message", "Error validating API key: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        String deviceId = credentials.get("deviceId");
        
        if (username == null || password == null) {
            return ResponseEntity.badRequest().body("Username and password are required");
        }
        
        User user = userService.authenticate(username, password);
        
        if (user != null) {
            // If deviceId is provided, check if it's authenticated
            if (deviceId != null && !authService.validateDevice(deviceId)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Device not authenticated");
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("message", "Authentication successful");
            
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }
    
    /**
     * Validate an API key
     * @param apiKey The API key to validate
     * @return Validation result
     */
    @GetMapping("/validate-key")
    public ResponseEntity<?> validateApiKey(@RequestParam String apiKey) {
        boolean isValid = authService.validateApiKey(apiKey);
        Map<String, Object> response = new HashMap<>();
        response.put("valid", isValid);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Validate a device
     * @param deviceId The device ID to validate
     * @return Validation result
     */
    @GetMapping("/validate-device")
    public ResponseEntity<?> validateDevice(@RequestParam String deviceId) {
        boolean isValid = authService.validateDevice(deviceId);
        Map<String, Object> response = new HashMap<>();
        response.put("valid", isValid);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Revoke a device's authentication
     * @param deviceId The device ID to revoke
     * @return Success message
     */
    @PostMapping("/revoke-device")
    public ResponseEntity<?> revokeDevice(@RequestParam String deviceId) {
        boolean success = authService.revokeDevice(deviceId);
        
        if (success) {
            return ResponseEntity.ok("Device authentication revoked");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Device not found");
        }
    }
}
