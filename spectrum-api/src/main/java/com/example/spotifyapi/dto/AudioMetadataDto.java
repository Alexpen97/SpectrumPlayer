package com.example.spotifyapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Data Transfer Object for audio file metadata
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AudioMetadataDto {
    private Long trackId;
    private String title;
    private String artist;
    private String album;
    private String trackNumber;
    private String year;
    private String format;
    private String sampleRate;
    private String channels;
    private int duration;
    private long fileSize;
    private Map<String, String> additionalProperties;
}
