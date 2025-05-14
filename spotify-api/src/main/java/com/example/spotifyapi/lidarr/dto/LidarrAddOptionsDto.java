package com.example.spotifyapi.lidarr.dto;

import lombok.Data;

@Data
public class LidarrAddOptionsDto {
    private String monitor;
    private boolean searchForMissingAlbums;
    private boolean monitored;

    // Default constructor
    public LidarrAddOptionsDto() {
        this.monitor = "none";
        this.searchForMissingAlbums = false;
        this.monitored = true;
    }

}
