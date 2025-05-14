package com.example.spotifyapi.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class searchResultsDto {
    private List<searchResultDto> albums = new ArrayList<>();
    private List<searchResultDto> artists = new ArrayList<>();
    private List<searchResultDto> tracks = new ArrayList<>();
    private List<searchResultDto> playlists = new ArrayList<>();
}
