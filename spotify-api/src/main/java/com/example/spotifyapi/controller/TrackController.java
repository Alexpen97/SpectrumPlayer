package com.example.spotifyapi.controller;

import com.example.spotifyapi.model.Track;
import com.example.spotifyapi.service.AlbumService;
import com.example.spotifyapi.service.ArtistService;
import com.example.spotifyapi.service.TrackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tracks")
@CrossOrigin(origins = "*")
public class TrackController {

    private final TrackService trackService;
    private final AlbumService albumService;
    private final ArtistService artistService;

    @Autowired
    public TrackController(TrackService trackService, AlbumService albumService, ArtistService artistService) {
        this.trackService = trackService;
        this.albumService = albumService;
        this.artistService = artistService;
    }

    @GetMapping
    public ResponseEntity<List<Track>> getAllTracks() {
        return ResponseEntity.ok(trackService.getAllTracks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Track> getTrackById(@PathVariable Long id) {
        Optional<Track> track = trackService.getTrackById(id);
        return track.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search/title")
    public ResponseEntity<List<Track>> searchTracksByTitle(@RequestParam String query) {
        return ResponseEntity.ok(trackService.searchTracksByTitle(query));
    }
    
    @GetMapping("/album/tracks")
    public ResponseEntity<?> getTracksByLidarrAlbumId(
            @RequestParam(name = "artistId") Integer artistId,
            @RequestParam(name = "albumId") Integer albumId,
            @RequestParam(name = "albumReleaseId", required = false) Integer albumReleaseId,
            @RequestParam(name = "internalId", required = false) Long internalId) {
        return ResponseEntity.ok(trackService.getTracksByLidarrAlbumId(artistId, albumId, albumReleaseId, internalId));
    }
    
    @GetMapping("/lidarr/album/{albumId}")
    public ResponseEntity<?> getTracksByLidarrAlbumIdLegacy(@PathVariable(name = "albumId") Integer albumId) {
        // Legacy endpoint that might not work correctly with the Lidarr API
        return ResponseEntity.ok(trackService.getTracksByLidarrAlbumId(albumId));
    }

    @PostMapping
    public ResponseEntity<Track> createTrack(@RequestBody Track track) {
        // Validate that the album exists
        if (track.getAlbum() != null && track.getAlbum().getId() != null) {
            albumService.getAlbumById(track.getAlbum().getId())
                .orElseThrow(() -> new RuntimeException("Album not found with id: " + track.getAlbum().getId()));
        }
        
        Track savedTrack = trackService.saveTrack(track);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedTrack);
    }
    


    @PutMapping("/{id}")
    public ResponseEntity<Track> updateTrack(@PathVariable Long id, @RequestBody Track track) {
        Optional<Track> existingTrack = trackService.getTrackById(id);
        if (existingTrack.isPresent()) {
            track.setId(id);
            return ResponseEntity.ok(trackService.saveTrack(track));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrack(@PathVariable Long id) {
        Optional<Track> existingTrack = trackService.getTrackById(id);
        if (existingTrack.isPresent()) {
            trackService.deleteTrack(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
