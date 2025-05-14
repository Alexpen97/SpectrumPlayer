package com.example.spotifyapi.controller;

import com.example.spotifyapi.lidarr.dto.LidarrAlbumDto;
import com.example.spotifyapi.model.Album;
import com.example.spotifyapi.model.Artist;
import com.example.spotifyapi.model.Playlist;
import com.example.spotifyapi.model.Track;
import com.example.spotifyapi.model.User;
import com.example.spotifyapi.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Authenticate a user
     * @param credentials Map containing username and password
     * @return User details with authentication token
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        
        if (username == null || password == null) {
            return ResponseEntity.badRequest().body("Username and password are required");
        }
        
        User user = userService.authenticate(username, password);
        if (user != null) {
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("message", "Authentication successful");
            
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }

    /**
     * Get a user's recently played albums
     * @param userId The user ID
     * @return List of recently played albums
     */
    @GetMapping("/{userId}/recently-played")
    public ResponseEntity<?> getRecentlyPlayed(@PathVariable(name = "userId") Long userId) {
        Optional<User> userOpt = userService.getUserById(userId);
        if (userOpt.isPresent()) {
            List<Album> recentlyPlayed = userService.getRecentlyPlayedAlbums(userId);
            return ResponseEntity.ok(recentlyPlayed);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Add an album to a user's recently played list
     * @param userId The user ID
     * @param albumId The album ID
     * @return Success message
     */
    @PostMapping("/{userId}/recently-played/{albumId}")
    public ResponseEntity<?> addToRecentlyPlayed(
            @PathVariable(name = "userId") Long userId,
            @PathVariable(name = "albumId") Long albumId) {
        
        boolean success = userService.addToRecentlyPlayed(userId, albumId);
        if (success) {
            return ResponseEntity.ok("Album added to recently played");
        } else {
            return ResponseEntity.badRequest().body("Failed to add album to recently played");
        }
    }
    
    /**
     * Add a track to a user's recently played list
     * @param userId The user ID
     * @param trackId The track ID
     * @return Success message
     */
    @PostMapping("/{userId}/recently-played/tracks/{trackId}")
    public ResponseEntity<?> addToRecentlyPlayedTracks(
            @PathVariable(name = "userId") Long userId,
            @PathVariable(name = "trackId") Long trackId) {
        
        boolean success = userService.addToRecentlyPlayedTracks(userId, trackId);
        if (success) {
            return ResponseEntity.ok("Track added to recently played");
        } else {
            return ResponseEntity.badRequest().body("Failed to add track to recently played");
        }
    }
    
    /**
     * Add a playlist to a user's recently played list
     * @param userId The user ID
     * @param playlistId The playlist ID
     * @return Success message
     */
    @PostMapping("/{userId}/recently-played/playlists/{playlistId}")
    public ResponseEntity<?> addToRecentlyPlayedPlaylists(
            @PathVariable(name = "userId") Long userId,
            @PathVariable(name = "playlistId") Long playlistId) {
        
        boolean success = userService.addToRecentlyPlayedPlaylists(userId, playlistId);
        if (success) {
            return ResponseEntity.ok("Playlist added to recently played");
        } else {
            return ResponseEntity.badRequest().body("Failed to add playlist to recently played");
        }
    }
    
    /**
     * Get a user's recently played tracks
     * @param userId The user ID
     * @return List of recently played tracks
     */
    @GetMapping("/{userId}/recently-played/tracks")
    public ResponseEntity<?> getRecentlyPlayedTracks(@PathVariable(name = "userId") Long userId) {
        Optional<User> userOpt = userService.getUserById(userId);
        if (userOpt.isPresent()) {
            List<Track> recentlyPlayed = userService.getRecentlyPlayedTracks(userId);
            return ResponseEntity.ok(recentlyPlayed);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get a user's recently played playlists
     * @param userId The user ID
     * @return List of recently played playlists
     */
    @GetMapping("/{userId}/recently-played/playlists")
    public ResponseEntity<?> getRecentlyPlayedPlaylists(@PathVariable(name = "userId") Long userId) {
        Optional<User> userOpt = userService.getUserById(userId);
        if (userOpt.isPresent()) {
            List<Playlist> recentlyPlayed = userService.getRecentlyPlayedPlaylists(userId);
            return ResponseEntity.ok(recentlyPlayed);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get a user's liked tracks
     * @param userId The user ID
     * @return List of liked tracks
     */
    @GetMapping("/{userId}/liked/tracks")
    public ResponseEntity<?> getLikedTracks(@PathVariable(name = "userId") Long userId) {
        Optional<User> userOpt = userService.getUserById(userId);
        if (userOpt.isPresent()) {
            List<Track> likedTracks = userService.getLikedTracks(userId);
            return ResponseEntity.ok(likedTracks);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get a user's liked albums
     * @param userId The user ID
     * @return List of liked albums
     */
    @GetMapping("/{userId}/liked/albums")
    public ResponseEntity<?> getLikedAlbums(@PathVariable(name = "userId") Long userId) {
        Optional<User> userOpt = userService.getUserById(userId);
        if (userOpt.isPresent()) {
            List<Album> likedAlbums = userService.getLikedAlbums(userId);
            return ResponseEntity.ok(likedAlbums);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get a user's liked artists
     * @param userId The user ID
     * @return List of liked artists
     */
    @GetMapping("/{userId}/liked/artists")
    public ResponseEntity<?> getLikedArtists(@PathVariable(name = "userId") Long userId) {
        Optional<User> userOpt = userService.getUserById(userId);
        if (userOpt.isPresent()) {
            List<Artist> likedArtists = userService.getLikedArtists(userId);
            return ResponseEntity.ok(likedArtists);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Toggle like status for a track
     * @param userId The user ID
     * @param trackId The track ID
     * @return Success message
     */
    @PostMapping("/{userId}/liked/tracks/{trackId}")
    public ResponseEntity<?> toggleLikedTrack(
            @PathVariable(name = "userId") Long userId,
            @PathVariable(name = "trackId") Long trackId) {
        
        boolean isLiked = userService.toggleLikedTrack(userId, trackId);
        String message = isLiked ? "Track added to liked tracks" : "Track removed from liked tracks";
        return ResponseEntity.ok(Map.of("liked", isLiked, "message", message));
    }
    
    /**
     * Toggle like status for an album
     * @param userId The user ID
     * @param albumId The album ID
     * @return Success message
     */
    @PostMapping("/{userId}/liked/albums/{albumId}")
    public ResponseEntity<?> toggleLikedAlbum(
            @PathVariable(name = "userId") Long userId,
            @PathVariable(name = "albumId") Long albumId) {
        
        boolean isLiked = userService.toggleLikedAlbum(userId, albumId);
        String message = isLiked ? "Album added to liked albums" : "Album removed from liked albums";
        return ResponseEntity.ok(Map.of("liked", isLiked, "message", message));
    }
    
    /**
     * Toggle like status for an artist
     * @param userId The user ID
     * @param foreignArtistId The foreign artist ID
     * @return Success message
     */
    @PostMapping("/{userId}/liked/artists/{foreignArtistId}")
    public ResponseEntity<?> toggleLikedArtist(
            @PathVariable(name = "userId") Long userId,
            @PathVariable(name = "foreignArtistId") String foreignArtistId) {
        
        boolean isLiked = userService.toggleLikedArtist(userId, foreignArtistId);
        String message = isLiked ? "Artist added to liked artists" : "Artist removed from liked artists";
        return ResponseEntity.ok(Map.of("liked", isLiked, "message", message));
    }
    
    /**
     * Check if a track is liked by a user
     * @param userId The user ID
     * @param trackId The track ID
     * @return True if the track is liked, false otherwise
     */
    @GetMapping("/{userId}/liked/tracks/{trackId}")
    public ResponseEntity<?> isTrackLiked(
            @PathVariable(name = "userId") Long userId,
            @PathVariable(name = "trackId") Long trackId) {
        
        boolean isLiked = userService.isTrackLiked(userId, trackId);
        return ResponseEntity.ok(Map.of("liked", isLiked));
    }
    
    /**
     * Check if an album is liked by a user
     * @param userId The user ID
     * @param albumId The album ID
     * @return True if the album is liked, false otherwise
     */
    @GetMapping("/{userId}/liked/albums/{albumId}")
    public ResponseEntity<?> isAlbumLiked(
            @PathVariable(name = "userId") Long userId,
            @PathVariable(name = "albumId") Long albumId) {
        
        boolean isLiked = userService.isAlbumLiked(userId, albumId);
        return ResponseEntity.ok(Map.of("liked", isLiked));
    }
    
    /**
     * Check if an artist is liked by a user
     * @param userId The user ID
     * @param foreignArtistId The foreign artist ID
     * @return True if the artist is liked, false otherwise
     */
    @GetMapping("/{userId}/liked/artists/{foreignArtistId}")
    public ResponseEntity<?> isArtistLiked(
            @PathVariable(name = "userId") Long userId,
            @PathVariable(name = "foreignArtistId") String foreignArtistId) {
        
        boolean isLiked = userService.isArtistLiked(userId, foreignArtistId);
        return ResponseEntity.ok(Map.of("liked", isLiked));
    }
    
    /**
     * Get recent releases from artists that the user has recently listened to
     * @param userId The user ID
     * @return List of recent album releases
     */
    @GetMapping("/{userId}/release-radar")
    public ResponseEntity<List<LidarrAlbumDto>> getReleaseRadar(@PathVariable(name = "userId") Long userId) {
        Optional<User> userOpt = userService.getUserById(userId);
        if (userOpt.isPresent()) {
            List<LidarrAlbumDto> recentReleases = userService.getRecentReleasesFromListenedArtists(userId);
            return ResponseEntity.ok(recentReleases);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
