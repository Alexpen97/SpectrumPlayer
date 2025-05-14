package com.example.spotifyapi.lidarr.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.ZonedDateTime;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class LidarrArtistDto {
    private Integer id;
    private String artistName;
    private String foreignArtistId;
    private String overview;
    private String artistType;
    private String disambiguation;
    private List<String> genres;
    private List<LinkDto> links;
    private List<LidarrImageDto> images;
    private String path;
    private boolean monitored;
    private String status;
    private boolean ended;
    private Integer qualityProfileId;
    private Integer metadataProfileId;
    private String monitorNewItems;
    private String folder;
    private List<String> tags;
    private ZonedDateTime added;
    private RatingsDto ratings;
    private String cleanName;
    private String sortName;
    private Integer tadbId;
    private Integer discogsId;
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LidarrImageDto {
        private String url;
        private String coverType;
        private String extension;
        private String remoteUrl;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LinkDto {
        private String url;
        private String name;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RatingsDto {
        private Integer votes;
        private Double value;
    }
}
