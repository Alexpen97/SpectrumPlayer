package com.example.spotifyapi.controller;

import com.example.spotifyapi.lidarr.dto.LidarrArtistDto;
import com.example.spotifyapi.model.Artist;
import com.example.spotifyapi.service.ArtistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;   

import java.util.List;

@RestController
@RequestMapping("/api/artists")
public class ArtistController {

    private final ArtistService artistService;

    @Autowired
    public ArtistController(ArtistService artistService) {
        this.artistService = artistService;
    }


    @GetMapping("/{name}/{foreignId}")
    public ResponseEntity<LidarrArtistDto> loadArtistPage(@PathVariable("name") String name, @PathVariable("foreignId") String foreignId) {
        return ResponseEntity.ok(artistService.loadArtistPage(name,foreignId));
    }

   
}
