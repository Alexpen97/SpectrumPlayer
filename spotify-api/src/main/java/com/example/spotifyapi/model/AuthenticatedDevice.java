package com.example.spotifyapi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "authenticated_devices")
public class AuthenticatedDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String deviceIdentifier;

    @Column(nullable = false)
    private String deviceName;

    @Column(nullable = false)
    private LocalDateTime lastAuthenticated;

    @Column(nullable = false)
    private boolean isActive = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // Default constructor
    public AuthenticatedDevice() {
        this.createdAt = LocalDateTime.now();
        this.lastAuthenticated = LocalDateTime.now();
    }

    // Constructor with user and device info
    public AuthenticatedDevice(User user, String deviceIdentifier, String deviceName) {
        this.user = user;
        this.deviceIdentifier = deviceIdentifier;
        this.deviceName = deviceName;
        this.lastAuthenticated = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
        this.isActive = true;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getDeviceIdentifier() {
        return deviceIdentifier;
    }

    public void setDeviceIdentifier(String deviceIdentifier) {
        this.deviceIdentifier = deviceIdentifier;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public LocalDateTime getLastAuthenticated() {
        return lastAuthenticated;
    }

    public void setLastAuthenticated(LocalDateTime lastAuthenticated) {
        this.lastAuthenticated = lastAuthenticated;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // Method to update last authenticated time
    public void updateLastAuthenticated() {
        this.lastAuthenticated = LocalDateTime.now();
    }
}
