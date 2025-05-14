package com.example.spotifyapi.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.example.spotifyapi.dto.searchResultDto;
import com.example.spotifyapi.dto.searchResultsDto;
import com.example.spotifyapi.lidarr.LidarrClient;
import com.example.spotifyapi.lidarr.dto.LidarrArtistDto;
import com.example.spotifyapi.model.Album;
import com.example.spotifyapi.model.Playlist;
import com.example.spotifyapi.model.Track;
import com.example.spotifyapi.repository.AlbumRepository;
import com.example.spotifyapi.repository.PlaylistRepository;
import com.example.spotifyapi.repository.TrackRepository;


@Service
public class SearchService {
    @Autowired
    private LidarrClient lidarrClient;
    
    @Autowired
    private AlbumRepository albumRepository;
    
    @Autowired
    private TrackRepository trackRepository;
    
    @Autowired
    private PlaylistRepository playlistRepository;
    
    // Cache to store search results with timestamp
    private final Map<String, CacheEntry<searchResultsDto>> searchCache = new ConcurrentHashMap<>();
    
    // Cache expiration time in milliseconds (5 minutes)
    private static final long CACHE_EXPIRATION_MS = TimeUnit.MINUTES.toMillis(5);

    public searchResultsDto search(String query) {
        // Normalize query for cache lookup (trim and lowercase)
        String normalizedQuery = query.trim().toLowerCase();
        
        // Return cached results if available and not expired
        if (searchCache.containsKey(normalizedQuery)) {
            CacheEntry<searchResultsDto> cacheEntry = searchCache.get(normalizedQuery);
            if (!cacheEntry.isExpired()) {
                return cacheEntry.getValue();
            } else {
                // Remove expired entry
                searchCache.remove(normalizedQuery);
            }
        }
        
        // If no valid cache entry exists, perform the search
        ArrayList<searchResultDto> artists = getArtists(query);
        ArrayList<searchResultDto> albums = getAlbums(query);
        ArrayList<searchResultDto> tracks = getTracks(query);
        ArrayList<searchResultDto> playlists = getPlaylists(query);

        searchResultsDto results = new searchResultsDto();
        results.setArtists(artists);
        results.setAlbums(albums);
        results.setTracks(tracks);
        results.setPlaylists(playlists);
        
        // Cache the results
        searchCache.put(normalizedQuery, new CacheEntry<>(results, CACHE_EXPIRATION_MS));
        
        return results;
    }
    
    // Scheduled task to clean up expired cache entries (runs every hour)
    @Scheduled(fixedRate = 3600000)
    public void cleanupCache() {
        searchCache.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }

    private ArrayList<searchResultDto> getArtists(String query) {
        List<LidarrArtistDto> artists = lidarrClient.searchArtists(query);
        ArrayList<searchResultDto> results = new ArrayList<>();
        artists.forEach(artist -> {
            String imageUrl = null;
            
            // Check if the artist has images before trying to access them
            if (artist.getImages() != null && !artist.getImages().isEmpty() && 
                artist.getImages().get(0) != null && artist.getImages().get(0).getRemoteUrl() != null) {
                imageUrl = artist.getImages().get(0).getRemoteUrl();
            } else if (artist.getImages() != null && !artist.getImages().isEmpty() && 
                       artist.getImages().get(0) != null && artist.getImages().get(0).getUrl() != null) {
                // Fallback to URL if remoteUrl is not available
                imageUrl = artist.getImages().get(0).getUrl();
            } else {
                // Default image if no images are available
                imageUrl = "/img/default-artist.jpg";
            }
            
            // Only add artists with an ID to avoid null pointer exceptions
            if (artist.getId() != null) {
                results.add(new searchResultDto(
                    artist.getArtistName(),
                    imageUrl,
                    artist.getForeignArtistId(),
                    artist.getId().toString()
                ));
            } else if (artist.getForeignArtistId() != null) {
                // For artists without an ID but with a foreignArtistId
                results.add(new searchResultDto(
                    artist.getArtistName(),
                    imageUrl,
                    artist.getForeignArtistId(),
                    "0" // Default ID
                ));
            }
        });
        
        return results;
    }
    
    /**
     * Search for albums matching the query
     * 
     * @param query The search query
     * @return List of album search results
     */
    private ArrayList<searchResultDto> getAlbums(String query) {
        List<Album> albums = albumRepository.findByTitleContainingIgnoreCase(query);
        ArrayList<searchResultDto> results = new ArrayList<>();
        
        albums.forEach(album -> {
            String imageUrl = album.getCoverImageUrl() != null ? album.getCoverImageUrl() : "/img/default-album.jpg";
            String foreignId = album.getForeignAlbumId() != null ? album.getForeignAlbumId() : "";
            String lidarrId = album.getLidarrAlbumId() != null ? album.getLidarrAlbumId().toString() : "0";
            
            // Include artist ID in metadata for proper navigation
            String metadata = "";
            if (album.getArtist() != null) {
                metadata = String.valueOf(album.getArtist().getId());
            }
            
            results.add(new searchResultDto(
                album.getTitle(),
                imageUrl,
                foreignId,
                lidarrId,
                metadata
            ));
        });
        
        return results;
    }
    
    /**
     * Search for tracks matching the query
     * 
     * @param query The search query
     * @return List of track search results
     */
    private ArrayList<searchResultDto> getTracks(String query) {
        List<Track> tracks = trackRepository.findByTitleContainingIgnoreCase(query);
        ArrayList<searchResultDto> results = new ArrayList<>();
        
        tracks.forEach(track -> {
            // For tracks, use the album cover as the image if available
            String imageUrl = "/img/default-track.jpg";
            if (track.getAlbum() != null && track.getAlbum().getCoverImageUrl() != null) {
                imageUrl = track.getAlbum().getCoverImageUrl();
            }
            
            String lidarrId = track.getLidarrTrackId() != null ? track.getLidarrTrackId().toString() : "0";
            
            // Store album and artist information in metadata for proper navigation
            // Format: albumId|artistId
            String metadata = "";
            if (track.getAlbum() != null) {
                String albumId = track.getAlbum().getLidarrAlbumId() != null ? 
                    track.getAlbum().getLidarrAlbumId().toString() : 
                    (track.getAlbum().getId() != null ? track.getAlbum().getId().toString() : "");
                
                String artistId = "";
                if (track.getAlbum().getArtist() != null) {
                    artistId = String.valueOf(track.getAlbum().getArtist().getId());
                }
                
                metadata = albumId + "|" + artistId;
            }
            
            results.add(new searchResultDto(
                track.getTitle(),
                imageUrl,
                track.getId().toString(), // Use track ID as foreignId for tracks
                lidarrId,
                metadata
            ));
        });
        
        return results;
    }
    
    /**
     * Search for playlists matching the query
     * 
     * @param query The search query
     * @return List of playlist search results
     */
    private ArrayList<searchResultDto> getPlaylists(String query) {
        List<Playlist> playlists = playlistRepository.findByNameContainingIgnoreCase(query);
        ArrayList<searchResultDto> results = new ArrayList<>();
        
        playlists.forEach(playlist -> {
            String imageUrl = playlist.getCoverImageUrl() != null ? playlist.getCoverImageUrl() : "/img/default-playlist.jpg";
            
            results.add(new searchResultDto(
                playlist.getName(),
                imageUrl,
                playlist.getId().toString(), // Use playlist ID as foreignId
                "0" // Playlists don't have Lidarr IDs
            ));
        });
        
        return results;
    }
    
    /**
     * Generic cache entry class to store values with expiration time
     */
    private static class CacheEntry<T> {
        private final T value;
        private final long expirationTime;
        
        public CacheEntry(T value, long ttlMs) {
            this.value = value;
            this.expirationTime = System.currentTimeMillis() + ttlMs;
        }
        
        public T getValue() {
            return value;
        }
        
        public boolean isExpired() {
            return System.currentTimeMillis() > expirationTime;
        }
    }
}
