package com.example.spotifyapi.lidarr.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LidarrAddArtistrequestDto {
    private String artistName;
    private String foreignArtistId;
    private Integer qualityProfileId;
    private Integer metadataProfileId;
    private String rootFolderPath;
    private LidarrAddOptionsDto addOptions;

}