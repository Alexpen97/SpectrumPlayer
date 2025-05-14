package com.example.spotifyapi.repository;

import com.example.spotifyapi.model.Album;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlbumRepository extends JpaRepository<Album, Long> {
    List<Album> findByTitleContainingIgnoreCase(String title);
    List<Album> findByArtistId(int artistId);
    Optional<Album> findByLidarrAlbumId(Integer lidarrAlbumId);
}
