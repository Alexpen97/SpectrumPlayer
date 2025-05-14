package com.example.spotifyapi.repository;

import com.example.spotifyapi.model.ApiKey;
import com.example.spotifyapi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    
    Optional<ApiKey> findByKeyValue(String keyValue);
    
    List<ApiKey> findByUser(User user);
    
    List<ApiKey> findByUserAndIsActiveTrue(User user);
    
    List<ApiKey> findByExpiresAtBefore(LocalDateTime dateTime);
    
    Optional<ApiKey> findByKeyValueAndIsActiveTrue(String keyValue);
    
    boolean existsByKeyValue(String keyValue);
}
