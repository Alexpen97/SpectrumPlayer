package com.example.spotifyapi.lidarr.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class LidarrAlbumDto {
    private Integer id;
    private Integer internalID;
    private String title;
    private String disambiguation;
    private String overview;
    private Integer artistId;
    private String foreignAlbumId;
    private Boolean monitored;
    private Boolean anyReleaseOk;
    private Integer profileId;
    private Integer duration;
    private String albumType;
    private List<String> secondaryTypes = new ArrayList<>();
    private Integer mediumCount;
    private Ratings ratings;
    private String releaseDate;
    private List<Release> releases = new ArrayList<>();
    private List<String> genres = new ArrayList<>();
    private List<Medium> media = new ArrayList<>();
    private LidarrArtistDto artist;
    private List<Image> images = new ArrayList<>();
    private List<Link> links = new ArrayList<>();
    private Statistics statistics;
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Ratings {
        private Integer votes;
        private Double value;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Release {
        private Integer id;
        private Integer albumId;
        private String foreignReleaseId;
        private String title;
        private String status;
        private Integer duration;
        private Integer trackCount;
        private List<Medium> media = new ArrayList<>();
        private Integer mediumCount;
        private String disambiguation;
        private List<String> country = new ArrayList<>();
        private List<String> label = new ArrayList<>();
        private String format;
        private Boolean monitored;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Medium {
        private Integer mediumNumber;
        private String mediumName;
        private String mediumFormat;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Image {
        private String url;
        private String coverType;
        private String extension;
        private String remoteUrl;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Link {
        private String url;
        private String name;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Statistics {
        private Integer trackFileCount;
        private Integer trackCount;
        private Integer totalTrackCount;
        private Long sizeOnDisk;
        private Integer percentOfTracks;
    }
    
    // Helper method to convert releaseDate string to LocalDate
    public LocalDate getReleaseDateAsLocalDate() {
        if (releaseDate != null && !releaseDate.isEmpty()) {
            try {
                // Handle ISO format with time component: "2018-10-26T00:00:00Z"
                if (releaseDate.contains("T")) {
                    return LocalDate.parse(releaseDate.substring(0, 10));
                }
                return LocalDate.parse(releaseDate);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
    
    // Helper method to get year from releaseDate
    public Integer getReleaseYear() {
        LocalDate date = getReleaseDateAsLocalDate();
        return date != null ? date.getYear() : null;
    }
    
    // Helper method to get cover art URL
    public String getCoverArt() {
        if (images != null && !images.isEmpty()) {
            for (Image image : images) {
                if ("cover".equals(image.getCoverType()) && image.getRemoteUrl() != null) {
                    return image.getRemoteUrl();
                }
            }
            // Fallback to any image if no cover found
            if (images.get(0).getRemoteUrl() != null) {
                return images.get(0).getRemoteUrl();
            }
        }
        return null;
    }
}
