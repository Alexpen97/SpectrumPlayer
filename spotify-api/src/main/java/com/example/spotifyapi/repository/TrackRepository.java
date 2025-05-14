package com.example.spotifyapi.repository;

import com.example.spotifyapi.model.Album;
import com.example.spotifyapi.model.Track;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrackRepository extends JpaRepository<Track, Long> {
    List<Track> findByTitleContainingIgnoreCase(String title);
    List<Track> findByAlbum(Album album);
    List<Track> findByAlbumId(Long albumId);
    List<Track> findByAudioUrlIsNull();
    Track findByLidarrTrackId(Integer id);
    Optional<Track> findByLidarrTrackId(Long trackId);
}
