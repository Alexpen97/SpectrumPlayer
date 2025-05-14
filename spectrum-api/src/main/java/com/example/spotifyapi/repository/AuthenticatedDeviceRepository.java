package com.example.spotifyapi.repository;

import com.example.spotifyapi.model.AuthenticatedDevice;
import com.example.spotifyapi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuthenticatedDeviceRepository extends JpaRepository<AuthenticatedDevice, Long> {
    
    Optional<AuthenticatedDevice> findByDeviceIdentifierAndIsActiveTrue(String deviceIdentifier);
    
    List<AuthenticatedDevice> findByUser(User user);
    
    List<AuthenticatedDevice> findByUserAndIsActiveTrue(User user);
    
    Optional<AuthenticatedDevice> findByUserAndDeviceIdentifierAndIsActiveTrue(User user, String deviceIdentifier);
    
    boolean existsByDeviceIdentifier(String deviceIdentifier);
}
