package com.example.spotifyapi.service;

import com.example.spotifyapi.model.ApiKey;
import com.example.spotifyapi.model.AuthenticatedDevice;
import com.example.spotifyapi.model.User;
import com.example.spotifyapi.repository.ApiKeyRepository;
import com.example.spotifyapi.repository.AuthenticatedDeviceRepository;
import com.example.spotifyapi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final AuthenticatedDeviceRepository deviceRepository;
    private final EmailService emailService;
    
    @Value("${app.auth.api-key-validity:30}")
    private int apiKeyValidityMinutes;
    
    @Autowired
    public AuthService(UserRepository userRepository, 
                        ApiKeyRepository apiKeyRepository,
                        AuthenticatedDeviceRepository deviceRepository,
                        EmailService emailService) {
        this.userRepository = userRepository;
        this.apiKeyRepository = apiKeyRepository;
        this.deviceRepository = deviceRepository;
        this.emailService = emailService;
    }
    
    /**
     * Generate a new API key for a user and send it via email
     * @param username the username of the user
     * @param email the email to send the key to
     * @return the generated API key if successful, empty optional otherwise
     */
    @Transactional
    public Optional<ApiKey> generateAndSendApiKey(String username, String email) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Update user's email if it has changed
            if (email != null && !email.equals(user.getEmail())) {
                user.setEmail(email);
                userRepository.save(user);
            }
            
            // Generate a new API key
            String keyValue = generateRandomKey();
            ApiKey apiKey = new ApiKey(keyValue, user, apiKeyValidityMinutes);
            apiKeyRepository.save(apiKey);
            
            // Send the key via email
            emailService.sendApiKey(email, keyValue, apiKeyValidityMinutes);
            
            return Optional.of(apiKey);
        }
        
        return Optional.empty();
    }
    
    /**
     * Authenticate a user with username, password, and API key
     * @param username the username
     * @param password the password
     * @param apiKeyValue the API key value
     * @param deviceIdentifier the device identifier
     * @param deviceName the device name
     * @return the authenticated device if successful, empty optional otherwise
     */
    @Transactional
    public Optional<AuthenticatedDevice> authenticateDevice(String username, String password, 
                                                           String apiKeyValue, String deviceIdentifier, 
                                                           String deviceName) {
        // First check username and password
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(password)) {
            return Optional.empty();
        }
        
        User user = userOpt.get();
        
        // Then verify API key
        Optional<ApiKey> apiKeyOpt = apiKeyRepository.findByKeyValueAndIsActiveTrue(apiKeyValue);
        if (apiKeyOpt.isEmpty() || !apiKeyOpt.get().isValid() || !apiKeyOpt.get().getUser().getId().equals(user.getId())) {
            return Optional.empty();
        }
        
        // Update API key usage and activate it
        ApiKey apiKey = apiKeyOpt.get();
        apiKey.updateLastUsed();
        apiKey.setActivated(true); // Mark the key as activated so it won't expire
        apiKeyRepository.save(apiKey);
        
        // Check if device already exists
        Optional<AuthenticatedDevice> existingDeviceOpt = 
            deviceRepository.findByUserAndDeviceIdentifierAndIsActiveTrue(user, deviceIdentifier);
        
        if (existingDeviceOpt.isPresent()) {
            // Update existing device
            AuthenticatedDevice device = existingDeviceOpt.get();
            device.updateLastAuthenticated();
            deviceRepository.save(device);
            return Optional.of(device);
        } else {
            // Create new authenticated device
            AuthenticatedDevice device = new AuthenticatedDevice(user, deviceIdentifier, deviceName);
            deviceRepository.save(device);
            return Optional.of(device);
        }
    }
    
    /**
     * Validate an API key
     * @param apiKeyValue the API key value
     * @return true if the key is valid, false otherwise
     */
    public boolean validateApiKey(String apiKeyValue) {
        if (apiKeyValue == null || apiKeyValue.isEmpty()) {
            System.out.println("API key validation failed: key is null or empty");
            return false;
        }
        
        try {
            System.out.println("Validating API key: " + apiKeyValue.substring(0, 5) + "...");
            Optional<ApiKey> apiKeyOpt = apiKeyRepository.findByKeyValueAndIsActiveTrue(apiKeyValue);
            
            if (apiKeyOpt.isEmpty()) {
                System.out.println("API key validation failed: key not found or not active");
                return false;
            }
            
            boolean isValid = apiKeyOpt.get().isValid();
            System.out.println("API key validation result: " + (isValid ? "valid" : "expired"));
            
            if (isValid) {
                // Update last used timestamp
                ApiKey apiKey = apiKeyOpt.get();
                apiKey.updateLastUsed();
                apiKeyRepository.save(apiKey);
            }
            
            return isValid;
        } catch (Exception e) {
            System.err.println("Error during API key validation: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Find a user by API key
     * @param apiKeyValue the API key value
     * @return the user if found and key is valid, empty optional otherwise
     */
    public Optional<User> getUserByApiKey(String apiKeyValue) {
        Optional<ApiKey> apiKeyOpt = apiKeyRepository.findByKeyValueAndIsActiveTrue(apiKeyValue);
        if (apiKeyOpt.isPresent() && apiKeyOpt.get().isValid()) {
            return Optional.of(apiKeyOpt.get().getUser());
        }
        return Optional.empty();
    }
    
    /**
     * Validate a device's authentication
     * @param deviceIdentifier the device identifier
     * @return true if the device is authenticated, false otherwise
     */
    public boolean validateDevice(String deviceIdentifier) {
        if (deviceIdentifier == null || deviceIdentifier.isEmpty()) {
            return false;
        }
        
        try {
            Optional<AuthenticatedDevice> deviceOpt = deviceRepository.findByDeviceIdentifierAndIsActiveTrue(deviceIdentifier);
            return deviceOpt.isPresent();
        } catch (Exception e) {
            // Log the error and return false instead of propagating the exception
            System.err.println("Error validating device: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Revoke a device's authentication
     * @param deviceIdentifier the device identifier
     * @return true if the device was revoked, false otherwise
     */
    @Transactional
    public boolean revokeDevice(String deviceIdentifier) {
        Optional<AuthenticatedDevice> deviceOpt = deviceRepository.findByDeviceIdentifierAndIsActiveTrue(deviceIdentifier);
        if (deviceOpt.isPresent()) {
            AuthenticatedDevice device = deviceOpt.get();
            device.setActive(false);
            deviceRepository.save(device);
            return true;
        }
        return false;
    }
    
    /**
     * Generate a random API key
     * @return the generated key
     */
    private String generateRandomKey() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32]; // 256 bits
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    
    /**
     * Clean up expired API keys
     * @return the number of keys cleaned up
     */
    @Transactional
    public int cleanupExpiredApiKeys() {
        LocalDateTime now = LocalDateTime.now();
        var expiredKeys = apiKeyRepository.findByExpiresAtBefore(now);
        
        for (ApiKey key : expiredKeys) {
            key.setActive(false);
        }
        
        apiKeyRepository.saveAll(expiredKeys);
        return expiredKeys.size();
    }
}
