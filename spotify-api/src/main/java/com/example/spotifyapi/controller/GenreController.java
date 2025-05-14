package com.example.spotifyapi.controller;

import com.example.spotifyapi.model.Genre;
import com.example.spotifyapi.service.GenreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/genres")
@CrossOrigin(origins = "*")
public class GenreController {

    private final GenreService genreService;

    @Autowired
    public GenreController(GenreService genreService) {
        this.genreService = genreService;
    }

    @GetMapping
    public ResponseEntity<List<Genre>> getAllGenres() {
        return ResponseEntity.ok(genreService.getAllGenres());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Genre> getGenreById(@PathVariable Long id) {
        return genreService.getGenreById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Genre>> searchGenresByName(@RequestParam String name) {
        return ResponseEntity.ok(genreService.searchGenresByName(name));
    }

    @PostMapping
    public ResponseEntity<Genre> createGenre(@RequestBody Genre genre) {
        Genre savedGenre = genreService.saveGenre(genre);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedGenre);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Genre> updateGenre(@PathVariable Long id, @RequestBody Genre genre) {
        return genreService.getGenreById(id)
                .map(existingGenre -> {
                    genre.setId(id);
                    return ResponseEntity.ok(genreService.saveGenre(genre));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGenre(@PathVariable Long id) {
        return genreService.getGenreById(id)
                .map(genre -> {
                    genreService.deleteGenre(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
