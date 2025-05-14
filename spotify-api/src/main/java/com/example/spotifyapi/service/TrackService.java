package com.example.spotifyapi.service;

import com.example.spotifyapi.lidarr.LidarrClient;
import com.example.spotifyapi.lidarr.dto.LidarrTrackDto;
import com.example.spotifyapi.model.Album;
import com.example.spotifyapi.model.Track;
import com.example.spotifyapi.repository.AlbumRepository;
import com.example.spotifyapi.repository.TrackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class TrackService {

    private final TrackRepository trackRepository;
    private final AlbumRepository albumRepository;
    private final LidarrClient lidarrClient;

    @Autowired
    public TrackService(TrackRepository trackRepository, AlbumRepository albumRepository, LidarrClient lidarrClient) {
        this.trackRepository = trackRepository;
        this.albumRepository = albumRepository;
        this.lidarrClient = lidarrClient;
    }

    public List<Track> getAllTracks() {
        return trackRepository.findAll();
    }

    public Optional<Track> getTrackById(Long id) {
        return trackRepository.findById(id);
    }

    public List<Track> searchTracksByTitle(String title) {
        return trackRepository.findByTitleContainingIgnoreCase(title);
    }

    public List<Track> getTracksByAlbumId(Long albumId) {
        Optional<Album> album = albumRepository.findById(albumId);
        if (album.isPresent()) {
            return new ArrayList<>(album.get().getTracks());
        }
        return Collections.emptyList();
    }


    /**
     * Get tracks for an album from Lidarr API
     * @param artistId Artist ID in Lidarr
     * @param albumId Album ID in Lidarr
     * @param albumReleaseId Album Release ID in Lidarr (optional)
     * @param internalId Internal database ID for the album (optional)
     * @return List of tracks for the album
     */
    public List<LidarrTrackDto> getTracksByLidarrAlbumId(Integer artistId, Integer albumId, Integer albumReleaseId, Long internalId) {
        // Get album from database if internalId is provided
        Optional<Album> album = internalId != null ? albumRepository.findById(internalId) : Optional.empty();
           if(albumReleaseId == null){
            albumReleaseId = albumRepository.findByLidarrAlbumId(albumId).get().getLidarrAlbumReleaseId();
        }
        // Get tracks from Lidarr API
        List<LidarrTrackDto> trackDtos = lidarrClient.getTracksByAlbumId(artistId, albumId, albumReleaseId);
     
        
        // If album exists in database, match tracks by lidarrTrackId
        if (album.isPresent()) {
            
            // Match tracks from database with lidarr tracks by lidarrTrackId
            for (LidarrTrackDto lidarrTrack : trackDtos) {
                for (Track localTrack : album.get().getTracks()) {
                    // Match tracks based on lidarrTrackId
                    if (localTrack.getLidarrTrackId() != null && 
                        lidarrTrack.getId() != null &&
                        localTrack.getLidarrTrackId().equals(lidarrTrack.getId().longValue())) {
                        // Set hasFile to true when a match is found
                        lidarrTrack.setHasFile(true);
                        break; // Found a match, no need to continue inner loop
                    }
                }
            }
        }
        
        return trackDtos;
    }
    
    /**
     * Get tracks for an album from Lidarr API (legacy method)
     * @param albumId Album ID in Lidarr
     * @return List of tracks for the album
     */
    public List<LidarrTrackDto> getTracksByLidarrAlbumId(Integer albumId) {
        // This is a fallback method that might not work correctly with the Lidarr API
        // For legacy calls, we don't have artistId or albumReleaseId, so we pass null
        return lidarrClient.getTracksByAlbumId(null, albumId, null);
    }
    
    public Track saveTrack(Track track) {
        return trackRepository.save(track);
    }

    public void deleteTrack(Long id) {
        trackRepository.deleteById(id);
    }

    public Optional<Track> getByLidarrTrackId(Long trackId) {
        return trackRepository.findByLidarrTrackId(trackId);
    }
}
