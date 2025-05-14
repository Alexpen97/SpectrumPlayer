
package com.example.spotifyapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class searchResultDto {
    private String name;
    private String imageUrl;
    private String foreignId;
    private String lidarrId;
    private String metadata;
    
    // Constructor without metadata for backward compatibility
    public searchResultDto(String name, String imageUrl, String foreignId, String lidarrId) {
        this.name = name;
        this.imageUrl = imageUrl;
        this.foreignId = foreignId;
        this.lidarrId = lidarrId;
        this.metadata = "";
    }
}
