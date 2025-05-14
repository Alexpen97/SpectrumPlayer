package com.example.spotifyapi.controller;

import com.example.spotifyapi.model.Track;
import com.example.spotifyapi.service.StreamingService;
import com.example.spotifyapi.service.TrackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Optional;

@RestController
@RequestMapping("/api/stream")
@CrossOrigin(origins = "*")
public class StreamingController {

    private final StreamingService streamingService;
    private final TrackService trackService;

    @Autowired
    public StreamingController(StreamingService streamingService, TrackService trackService) {
        this.streamingService = streamingService;
        this.trackService = trackService;
    }

    /**
     * Stream audio file for a track
     * 
     * @param trackId The ID of the track to stream
     * @param range HTTP Range header for partial content streaming
     * @return ResponseEntity with the audio file as a resource
     */
    @GetMapping("/track/{trackId}")
    public ResponseEntity<Resource> streamTrack(
            @PathVariable("trackId") Long trackId,
            @RequestHeader(value = "Range", required = false) String range) {
        
        try {
            // Get track from database
            Optional<Track> trackOpt = trackService.getByLidarrTrackId(trackId);
            if (trackOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Track track = trackOpt.get();
            
            // Check if track has an audio file path
            if (track.getAudioUrl() == null || track.getAudioUrl().isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            // Log the audio URL being accessed
            System.out.println("Streaming audio from URL: " + track.getAudioUrl());
            
            // Get the resource and content length
            Resource audioResource = streamingService.getAudioResource(track);
            long contentLength = audioResource.contentLength();
            
            // Determine content type based on file extension
            String contentType = determineContentType(track.getAudioUrl());
            
            // Handle range requests (for seeking within the audio)
            if (range != null && !range.isEmpty()) {
                return streamingService.prepareRangeResponse(audioResource, range, contentType, contentLength);
            }
            
            // Return the full resource if no range is specified
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(contentLength)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + audioResource.getFilename() + "\"")
                    .body(audioResource);
                    
        } catch (IOException e) {
            System.out.println("Error streaming track: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Determine the content type based on file extension
     * 
     * @param filename The filename or path
     * @return The appropriate content type
     */
    private String determineContentType(String filename) {
        if (filename.toLowerCase().endsWith(".mp3")) {
            return "audio/mpeg";
        } else if (filename.toLowerCase().endsWith(".flac")) {
            return "audio/flac";
        } else if (filename.toLowerCase().endsWith(".wav")) {
            return "audio/wav";
        } else if (filename.toLowerCase().endsWith(".ogg")) {
            return "audio/ogg";
        } else if (filename.toLowerCase().endsWith(".aac")) {
            return "audio/aac";
        } else {
            return "application/octet-stream";
        }
    }
    
    /**
     * Get audio metadata for a track
     * 
     * @param trackId The ID of the track
     * @return ResponseEntity with track metadata
     */
    @GetMapping("/metadata/{id}")
    public ResponseEntity<?> getAudioMetadata(@PathVariable("id") Long trackId) {
        Optional<Track> track = trackService.getTrackById(trackId);
        if (track.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            return ResponseEntity.ok(streamingService.getAudioMetadata(track.get()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error retrieving audio metadata: " + e.getMessage());
        }
    }
}
