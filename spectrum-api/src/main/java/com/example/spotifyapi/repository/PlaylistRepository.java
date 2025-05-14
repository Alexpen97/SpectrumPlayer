package com.example.spotifyapi.repository;

import com.example.spotifyapi.model.Playlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaylistRepository extends JpaRepository<Playlist, Long> {
    List<Playlist> findByNameContainingIgnoreCase(String name);
    List<Playlist> findByOwnerUsername(String ownerUsername);
    List<Playlist> findByIsPublicTrue();
    
    @Query("SELECT p FROM Playlist p LEFT JOIN FETCH p.tracks WHERE p.id = :id")
    Optional<Playlist> findByIdWithTracks(@Param("id") Long id);
}
