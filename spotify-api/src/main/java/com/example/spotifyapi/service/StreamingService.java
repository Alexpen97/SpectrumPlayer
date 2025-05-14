package com.example.spotifyapi.service;

import com.example.spotifyapi.dto.AudioMetadataDto;
import com.example.spotifyapi.model.Track;
import org.apache.commons.io.FilenameUtils;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@Service
public class StreamingService {

    @Value("${audio.storage.path}")
    private String audioStoragePath;
    
    /**
     * Get the audio file as a resource
     * 
     * @param track The track entity
     * @return Resource representing the audio file
     * @throws IOException If the file cannot be accessed
     */
    public Resource getAudioResource(Track track) throws IOException {
        String audioUrl = track.getAudioUrl();
        
        // Check if the URL is a full path or just a filename
        if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
            // Handle remote URLs
            return new UrlResource(audioUrl);
        } else {
            // Handle local files
            Path filePath = getAudioFilePath(track);
            Resource resource = new FileSystemResource(filePath.toFile());
            
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new IOException("Could not read audio file: " + audioUrl);
            }
        }
    }
    
    /**
     * Get the full path to the audio file
     * 
     * @param track The track entity
     * @return Path to the audio file
     */
    private Path getAudioFilePath(Track track) {
        String audioUrl = track.getAudioUrl();
        
        // If it's already a full path, use it directly
        if (audioUrl.startsWith("/") || audioUrl.contains(":\\")) {
            return Paths.get(audioUrl);
        }
        
        // Otherwise, combine with the base storage path
        return Paths.get(audioStoragePath, audioUrl);
    }
    
    /**
     * Prepare a response for range requests (for seeking in audio)
     * 
     * @param resource The audio resource
     * @param range The HTTP Range header value
     * @param contentType The content type of the audio
     * @param contentLength The total length of the audio file
     * @return ResponseEntity with partial content
     * @throws IOException If the file cannot be accessed
     */
    public ResponseEntity<Resource> prepareRangeResponse(
            Resource resource, String range, String contentType, long contentLength) throws IOException {
        
        // Parse the range header
        String[] ranges = range.replace("bytes=", "").split("-");
        long start = Long.parseLong(ranges[0]);
        long end = ranges.length > 1 && !ranges[1].isEmpty() 
                ? Long.parseLong(ranges[1]) 
                : contentLength - 1;
        
        // Ensure the range is valid
        if (start > end || start < 0 || end >= contentLength) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    .header(HttpHeaders.CONTENT_RANGE, "bytes */" + contentLength)
                    .build();
        }
        
        // Calculate the content length for this range
        long rangeLength = end - start + 1;
        
        // Return partial content response
        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(rangeLength)
                .header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + contentLength)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
    
    /**
     * Extract metadata from the audio file
     * 
     * @param track The track entity
     * @return AudioMetadataDto containing the metadata
     * @throws Exception If metadata extraction fails
     */
    public AudioMetadataDto getAudioMetadata(Track track) throws Exception {
        Path filePath = getAudioFilePath(track);
        File file = filePath.toFile();
        
        if (!file.exists()) {
            throw new IOException("Audio file not found: " + filePath);
        }
        
        String extension = FilenameUtils.getExtension(file.getName()).toLowerCase();
        
        // Create a metadata object based on the file type
        AudioMetadataDto metadata = new AudioMetadataDto();
        metadata.setTrackId(track.getId());
        metadata.setTitle(track.getTitle());
        metadata.setDuration(track.getDurationInSeconds());
        metadata.setFormat(extension);
        
        // For MP3 files, we can extract more detailed metadata
        if ("mp3".equals(extension)) {
            extractMp3Metadata(file, metadata);
        } else if ("flac".equals(extension)) {
            // For FLAC files, we could use a FLAC-specific parser
            extractFlacMetadata(file, metadata);
        }
        
        return metadata;
    }
    
    /**
     * Extract metadata from MP3 files using Apache Tika
     * 
     * @param file The MP3 file
     * @param metadataDto The DTO to populate with metadata
     * @throws Exception If metadata extraction fails
     */
    private void extractMp3Metadata(File file, AudioMetadataDto metadataDto) throws Exception {
        Tika tika = new Tika();
        
        try (InputStream input = new FileInputStream(file)) {
            // Use Tika's facade to detect the content type
            String mediaType = tika.detect(file);
            metadataDto.setFormat(mediaType);
            
            // Set basic file metadata
            metadataDto.setFileSize(file.length());
            
            // If we have track data from the database, use it
            if (metadataDto.getTitle() == null || metadataDto.getTitle().isEmpty()) {
                // Try to extract the title from the filename if not set
                String filename = file.getName();
                String title = FilenameUtils.getBaseName(filename);
                metadataDto.setTitle(title);
            }
            
            // Create a simple map for additional properties
            Map<String, String> additionalProps = new HashMap<>();
            additionalProps.put("mediaType", mediaType);
            additionalProps.put("fileSize", String.valueOf(file.length()));
            additionalProps.put("fileName", file.getName());
            metadataDto.setAdditionalProperties(additionalProps);
        }
    }
    
    /**
     * Extract metadata from FLAC files
     * 
     * @param file The FLAC file
     * @param metadataDto The DTO to populate with metadata
     * @throws Exception If metadata extraction fails
     */
    private void extractFlacMetadata(File file, AudioMetadataDto metadataDto) throws Exception {
        // For a production app, you would use a library like jaudiotagger or JavaFLAC
        // For simplicity, we'll just get basic file information
        
        // Get file size
        long fileSize = Files.size(file.toPath());
        metadataDto.setFileSize(fileSize);
        
        // Add this as an additional property
        Map<String, String> additionalProps = new HashMap<>();
        additionalProps.put("fileSize", String.valueOf(fileSize));
        metadataDto.setAdditionalProperties(additionalProps);
    }
}
