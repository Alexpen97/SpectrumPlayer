package com.example.spotifyapi.controller;

import com.example.spotifyapi.model.Playlist;
import com.example.spotifyapi.model.Track;
import com.example.spotifyapi.model.User;
import com.example.spotifyapi.repository.TrackRepository;
import com.example.spotifyapi.service.PlaylistService;
import com.example.spotifyapi.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/playlists")
@CrossOrigin(origins = "*")
public class PlaylistController {

    private final PlaylistService playlistService;
    private final TrackRepository trackRepository;
    private final UserService userService;

    @Autowired
    public PlaylistController(PlaylistService playlistService, TrackRepository trackRepository, UserService userService) {
        this.playlistService = playlistService;
        this.trackRepository = trackRepository;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<Playlist>> getAllPlaylists() {
        return ResponseEntity.ok(playlistService.getAllPlaylists());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Playlist> getPlaylistById(@PathVariable(name = "id") Long id) {
        return playlistService.getPlaylistById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<Playlist>> getPlaylistsByOwner(@PathVariable(name = "username") String username) {
        return ResponseEntity.ok(playlistService.getPlaylistsByOwner(username));
    }

    @GetMapping("/public")
    public ResponseEntity<List<Playlist>> getPublicPlaylists() {
        return ResponseEntity.ok(playlistService.getPublicPlaylists());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Playlist>> searchPlaylistsByName(@RequestParam(name = "name") String name) {
        return ResponseEntity.ok(playlistService.searchPlaylistsByName(name));
    }

    @PostMapping
    public ResponseEntity<Playlist> createPlaylist(@RequestBody Playlist playlist) {
        Playlist createdPlaylist = playlistService.createPlaylist(playlist);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPlaylist);
    }
    
    @PostMapping("/create")
    public ResponseEntity<?> createPlaylistByNameAndUserId(
            @RequestParam(name = "name") String name, 
            @RequestParam(name = "userId") Long userId) {
        // Find the user
        User user = userService.getUserById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found with id: " + userId);
        }
        
        // Create a new playlist with default values
        Playlist playlist = new Playlist();
        playlist.setName(name);
        playlist.setDescription("");
        playlist.setCoverImageUrl("https://placehold.co/300x300/gray/white?text=Playlist");
        // For boolean fields with 'is' prefix, Lombok generates setters without duplicating the 'is'
        playlist.setPublic(true);
        playlist.setOwnerUsername(user.getUsername());
        
        // Save the playlist
        Playlist createdPlaylist = playlistService.createPlaylist(playlist);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPlaylist);
    }
    
    @PostMapping("/simple")
    public ResponseEntity<Playlist> createSimplePlaylist(@RequestParam String name) {
        // Create a new playlist with default values and admin owner
        Playlist playlist = new Playlist();
        playlist.setName(name);
        playlist.setDescription("");
        playlist.setCoverImageUrl("https://placehold.co/300x300/gray/white?text=Playlist");
        playlist.setPublic(true);
        playlist.setOwnerUsername("admin"); // Default owner
        
        // Save the playlist
        Playlist createdPlaylist = playlistService.createPlaylist(playlist);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPlaylist);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Playlist> updatePlaylist(@PathVariable(name = "id") Long id, @RequestBody Playlist playlist) {
        Playlist updatedPlaylist = playlistService.updatePlaylist(id, playlist);
        if (updatedPlaylist != null) {
            return ResponseEntity.ok(updatedPlaylist);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{playlistId}/tracks/{trackId}")
    public ResponseEntity<Void> addTrackToPlaylist(@PathVariable(name = "playlistId") Long playlistId, @PathVariable(name = "trackId") Long trackId) {
        boolean added = playlistService.addTrackToPlaylist(playlistId, trackId);
        if (added) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{playlistId}/tracks/{trackId}")
    public ResponseEntity<Void> removeTrackFromPlaylist(@PathVariable(name = "playlistId") Long playlistId, @PathVariable(name = "trackId") Long trackId) {
        boolean removed = playlistService.removeTrackFromPlaylist(playlistId, trackId);
        if (removed) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlaylist(@PathVariable(name = "id") Long id) {
        playlistService.getPlaylistById(id)
                .orElseThrow(() -> new RuntimeException("Playlist not found with id: " + id));
        
        playlistService.deletePlaylist(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/debug/{id}")
    public ResponseEntity<Map<String, Object>> debugPlaylist(@PathVariable(name = "id") Long id) {
        Map<String, Object> debug = new HashMap<>();
        
        // Get playlist information
        Optional<Playlist> playlist = playlistService.getPlaylistById(id);
        if (playlist.isEmpty()) {
            debug.put("error", "Playlist not found with id: " + id);
            return ResponseEntity.ok(debug);
        }
        
        // Add playlist info to debug
        debug.put("playlist_id", playlist.get().getId());
        debug.put("playlist_name", playlist.get().getName());
        debug.put("tracks_count", playlist.get().getTracks().size());
        
        // Get all tracks
        List<Track> allTracks = trackRepository.findAll();
        debug.put("total_tracks_in_db", allTracks.size());
        
        // List all tracks in the database
        List<Map<String, Object>> allTrackDetails = new ArrayList<>();
        for (Track track : allTracks) {
            Map<String, Object> trackInfo = new HashMap<>();
            trackInfo.put("id", track.getId());
            trackInfo.put("lidarrTrackId", track.getLidarrTrackId());
            trackInfo.put("title", track.getTitle());
            allTrackDetails.add(trackInfo);
        }
        debug.put("all_tracks", allTrackDetails);
        
        // Get track details if any exist in the playlist
        if (!playlist.get().getTracks().isEmpty()) {
            List<Map<String, Object>> trackDetails = new ArrayList<>();
            for (Track track : playlist.get().getTracks()) {
                Map<String, Object> trackInfo = new HashMap<>();
                trackInfo.put("id", track.getId());
                trackInfo.put("lidarrTrackId", track.getLidarrTrackId());
                trackInfo.put("title", track.getTitle());
                trackDetails.add(trackInfo);
            }
            debug.put("track_details", trackDetails);
        }
        
        return ResponseEntity.ok(debug);
    }
    
    @PostMapping("/debug/{playlistId}/add-track/{trackId}")
    public ResponseEntity<Map<String, Object>> manuallyAddTrackToPlaylist(
            @PathVariable(name = "playlistId") Long playlistId,
            @PathVariable(name = "trackId") Long trackId) {
        
        Map<String, Object> result = new HashMap<>();
        
        // Get the playlist
        Optional<Playlist> optionalPlaylist = playlistService.getPlaylistById(playlistId);
        if (optionalPlaylist.isEmpty()) {
            result.put("error", "Playlist not found with id: " + playlistId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(result);
        }
        
        // Get the track
        Optional<Track> optionalTrack = trackRepository.findById(trackId);
        if (optionalTrack.isEmpty()) {
            result.put("error", "Track not found with id: " + trackId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(result);
        }
        
        // Add track to playlist directly
        Playlist playlist = optionalPlaylist.get();
        Track track = optionalTrack.get();
        
        // Add track to playlist
        playlist.getTracks().add(track);
        playlist.setUpdatedAt(java.time.LocalDateTime.now());
        
        // Save the playlist
        Playlist updatedPlaylist = playlistService.createPlaylist(playlist);
        
        // Return result
        result.put("success", true);
        result.put("message", "Track " + track.getTitle() + " added to playlist " + playlist.getName());
        result.put("playlist_id", updatedPlaylist.getId());
        result.put("track_id", track.getId());
        result.put("tracks_count", updatedPlaylist.getTracks().size());
        
        return ResponseEntity.ok(result);
    }
}
