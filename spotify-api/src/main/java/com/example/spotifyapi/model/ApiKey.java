package com.example.spotifyapi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "api_keys")
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String keyValue;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime lastUsedAt;

    @Column(nullable = false)
    private boolean isActive = true;
    
    @Column(nullable = false)
    private boolean isActivated = false;

    // Default constructor
    public ApiKey() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructor with key and user
    public ApiKey(String keyValue, User user, int expirationMinutes) {
        this.keyValue = keyValue;
        this.user = user;
        this.createdAt = LocalDateTime.now();
        this.expiresAt = this.createdAt.plusMinutes(expirationMinutes);
        this.isActive = true;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getKeyValue() {
        return keyValue;
    }

    public void setKeyValue(String keyValue) {
        this.keyValue = keyValue;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastUsedAt() {
        return lastUsedAt;
    }

    public void setLastUsedAt(LocalDateTime lastUsedAt) {
        this.lastUsedAt = lastUsedAt;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
    
    public boolean isActivated() {
        return isActivated;
    }

    public void setActivated(boolean activated) {
        isActivated = activated;
    }

    // Method to check if API key is valid
    public boolean isValid() {
        // If the key is activated, it only needs to be active (doesn't expire)
        // If not activated, check if it's active AND hasn't expired yet
        return isActive && (isActivated || LocalDateTime.now().isBefore(expiresAt));
    }

    // Method to update last used timestamp
    public void updateLastUsed() {
        this.lastUsedAt = LocalDateTime.now();
    }
    
    // Method to extend expiration time
    public void extendExpiration(int minutes) {
        this.expiresAt = LocalDateTime.now().plusMinutes(minutes);
    }
}
