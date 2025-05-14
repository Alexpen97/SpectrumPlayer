package com.example.spotifyapi.lidarr.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class LidarrTrackDto {
    private Integer id;
    private String foreignTrackId;
    private String foreignRecordingId;
    private String trackNumber;
    private String title;
    private Integer duration;
    private Integer trackFileId;
    private Boolean hasFile;
    private Integer artistId;
    private Integer albumId;
    private Boolean explicit;
    private Integer absoluteTrackNumber;
    private Integer mediumNumber;
    private Integer discNumber;
    private Ratings ratings;
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Ratings {
        private Integer votes;
        private Integer value;
    }
}
