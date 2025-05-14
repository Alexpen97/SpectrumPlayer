package com.example.spotifyapi.lidarr.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TrackImportDTO {
    private String path;
    private String name;
    private long size;
    private String importMode;
    private Integer albumReleaseId;
    private Integer albumId;
    private List<Track> tracks;
    private Quality quality;
    private boolean replaceExistingFiles;
    private boolean disableReleaseSwitching;

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Track {
        private Integer artistId;
        private String foreignTrackId;
        private String foreignRecordingId;
        private Integer trackFileId;
        private Integer albumId;
        private boolean explicit;
        private Integer absoluteTrackNumber;
        private String trackNumber;
        private String title;
        private Integer duration;
        private Integer mediumNumber;
        private boolean hasFile;
        private Ratings ratings;
        private Integer id;

        public Integer getArtistId() {
            return artistId;
        }

        public void setArtistId(Integer artistId) {
            this.artistId = artistId;
        }

        public String getForeignTrackId() {
            return foreignTrackId;
        }

        public void setForeignTrackId(String foreignTrackId) {
            this.foreignTrackId = foreignTrackId;
        }

        public String getForeignRecordingId() {
            return foreignRecordingId;
        }

        public void setForeignRecordingId(String foreignRecordingId) {
            this.foreignRecordingId = foreignRecordingId;
        }

        public Integer getTrackFileId() {
            return trackFileId;
        }

        public void setTrackFileId(Integer trackFileId) {
            this.trackFileId = trackFileId;
        }

        public Integer getAlbumId() {
            return albumId;
        }

        public void setAlbumId(Integer albumId) {
            this.albumId = albumId;
        }

        public boolean isExplicit() {
            return explicit;
        }

        public void setExplicit(boolean explicit) {
            this.explicit = explicit;
        }

        public Integer getAbsoluteTrackNumber() {
            return absoluteTrackNumber;
        }

        public void setAbsoluteTrackNumber(Integer absoluteTrackNumber) {
            this.absoluteTrackNumber = absoluteTrackNumber;
        }

        public String getTrackNumber() {
            return trackNumber;
        }

        public void setTrackNumber(String trackNumber) {
            this.trackNumber = trackNumber;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public Integer getDuration() {
            return duration;
        }

        public void setDuration(Integer duration) {
            this.duration = duration;
        }

        public Integer getMediumNumber() {
            return mediumNumber;
        }

        public void setMediumNumber(Integer mediumNumber) {
            this.mediumNumber = mediumNumber;
        }

        public boolean isHasFile() {
            return hasFile;
        }

        public void setHasFile(boolean hasFile) {
            this.hasFile = hasFile;
        }

        public Ratings getRatings() {
            return ratings;
        }

        public void setRatings(Ratings ratings) {
            this.ratings = ratings;
        }

        public Integer getId() {
            return id;
        }

        public void setId(Integer id) {
            this.id = id;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Ratings {
        private Integer votes;
        private Integer value;

        public Integer getVotes() {
            return votes;
        }

        public void setVotes(Integer votes) {
            this.votes = votes;
        }

        public Integer getValue() {
            return value;
        }

        public void setValue(Integer value) {
            this.value = value;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Quality {
        private QualityInfo quality;
        private Revision revision;

        public QualityInfo getQuality() {
            return quality;
        }

        public void setQuality(QualityInfo quality) {
            this.quality = quality;
        }

        public Revision getRevision() {
            return revision;
        }

        public void setRevision(Revision revision) {
            this.revision = revision;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class QualityInfo {
        private Integer id;
        private String name;

        public Integer getId() {
            return id;
        }

        public void setId(Integer id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Revision {
        private Integer version;
        private Integer real;
        private boolean isRepack;

        public Integer getVersion() {
            return version;
        }

        public void setVersion(Integer version) {
            this.version = version;
        }

        public Integer getReal() {
            return real;
        }

        public void setReal(Integer real) {
            this.real = real;
        }

        public boolean isRepack() {
            return isRepack;
        }

        public void setRepack(boolean isRepack) {
            this.isRepack = isRepack;
        }
    }

    // Getters and Setters
    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public String getImportMode() {
        return importMode;
    }

    public void setImportMode(String importMode) {
        this.importMode = importMode;
    }

    public Integer getAlbumReleaseId() {
        return albumReleaseId;
    }

    public void setAlbumReleaseId(Integer albumReleaseId) {
        this.albumReleaseId = albumReleaseId;
    }

    public Integer getAlbumId() {
        return albumId;
    }

    public void setAlbumId(Integer albumId) {
        this.albumId = albumId;
    }

    public List<Track> getTracks() {
        return tracks;
    }

    public void setTracks(List<Track> tracks) {
        this.tracks = tracks;
    }

    public Quality getQuality() {
        return quality;
    }

    public void setQuality(Quality quality) {
        this.quality = quality;
    }

    public boolean isReplaceExistingFiles() {
        return replaceExistingFiles;
    }

    public void setReplaceExistingFiles(boolean replaceExistingFiles) {
        this.replaceExistingFiles = replaceExistingFiles;
    }

    public boolean isDisableReleaseSwitching() {
        return disableReleaseSwitching;
    }

    public void setDisableReleaseSwitching(boolean disableReleaseSwitching) {
        this.disableReleaseSwitching = disableReleaseSwitching;
    }
}
