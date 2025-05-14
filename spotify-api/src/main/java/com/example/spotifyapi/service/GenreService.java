package com.example.spotifyapi.service;

import com.example.spotifyapi.model.Genre;
import com.example.spotifyapi.repository.GenreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GenreService {

    private final GenreRepository genreRepository;
    
    @Autowired
    public GenreService(GenreRepository genreRepository) {
        this.genreRepository = genreRepository;
    }
    
    public List<Genre> getAllGenres() {
        return genreRepository.findAll();
    }
    
    public Optional<Genre> getGenreById(Long id) {
        return genreRepository.findById(id);
    }
    
    public List<Genre> searchGenresByName(String name) {
        return genreRepository.findByNameContainingIgnoreCase(name);
    }
    
    public Genre saveGenre(Genre genre) {
        return genreRepository.save(genre);
    }
    
    public void deleteGenre(Long id) {
        genreRepository.deleteById(id);
    }
}
