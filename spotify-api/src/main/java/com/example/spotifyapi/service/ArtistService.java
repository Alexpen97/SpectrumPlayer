package com.example.spotifyapi.service;

import com.example.spotifyapi.lidarr.LidarrClient;
import com.example.spotifyapi.lidarr.dto.LidarrAddArtistrequestDto;
import com.example.spotifyapi.lidarr.dto.LidarrAddOptionsDto;
import com.example.spotifyapi.lidarr.dto.LidarrArtistDto;
import com.example.spotifyapi.model.Artist;
import com.example.spotifyapi.model.Genre;
import com.example.spotifyapi.repository.ArtistRepository;
import com.example.spotifyapi.repository.GenreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ArtistService {

    private final ArtistRepository artistRepository;
    private final GenreRepository genreRepository;
    private final LidarrClient lidarrClient;
    
    @Autowired
    public ArtistService(ArtistRepository artistRepository, 
                         GenreRepository genreRepository,
                         LidarrClient lidarrClient) {
        this.artistRepository = artistRepository;
        this.genreRepository = genreRepository;
        this.lidarrClient = lidarrClient;
    }

    public LidarrArtistDto loadArtistPage(String name, String foreignId) {
        Optional<Artist> artist = artistRepository.findByForeignId(foreignId);
        if(artist.isPresent()) {
            return lidarrClient.getArtistById(artist.get().getLidarrId());
        }
        LidarrArtistDto artistDto = addArtistToLidarr(name,foreignId);
        
        // Handle potential null values and create the artist entity
        String artistName = artistDto.getArtistName() != null ? artistDto.getArtistName() : name;
        String biography = artistDto.getOverview();
        String imageUrl = null;
        
        if (artistDto.getImages() != null && !artistDto.getImages().isEmpty()) {
            imageUrl = artistDto.getImages().get(0).getRemoteUrl();
        }
        
        Artist newArtist = new Artist(
            0, 
            artistName,
            biography,  // The @Lob annotation will now handle long text
            imageUrl,
            artistDto.getId(),
            artistDto.getForeignArtistId(),
            artistDto.getGenres()
        );
        
        artistRepository.save(newArtist);
        
        // Return the artist data from Lidarr
        return artistDto;
    }

    private LidarrArtistDto addArtistToLidarr(String name, String foreignId) {
        return lidarrClient.addArtistToLidarr(new LidarrAddArtistrequestDto(name,foreignId,1,1,"/media",new LidarrAddOptionsDto()));
    }
    
    
    
    /**
     * Sync artists from Lidarr to the local database
     * @return Number of artists synchronized
     */
    @Transactional
    public int syncArtistsFromLidarr() {
        List<LidarrArtistDto> lidarrArtists = lidarrClient.getAllArtists();
        int count = 0;
        
        for (LidarrArtistDto lidarrArtist : lidarrArtists) {
            // Check if artist already exists in our database
            Optional<Artist> existingArtist = artistRepository.findByLidarrId(lidarrArtist.getId());
            
            Artist artist;
            if (existingArtist.isPresent()) {
                artist = existingArtist.get();
            } else {
                artist = new Artist();
                artist.setLidarrId(lidarrArtist.getId());
                count++;
            }
            
            // Update artist properties
            artist.setName(lidarrArtist.getArtistName());
            artist.setBiography(lidarrArtist.getOverview());
            
            // Get image URL
            if (lidarrArtist.getImages() != null && !lidarrArtist.getImages().isEmpty()) {
                // Prefer cover art if available, otherwise use first image
                Optional<LidarrArtistDto.LidarrImageDto> coverArt = lidarrArtist.getImages().stream()
                        .filter(img -> "cover".equalsIgnoreCase(img.getCoverType()))
                        .findFirst();
                
                artist.setImageUrl(coverArt.isPresent() 
                        ? coverArt.get().getUrl() 
                        : lidarrArtist.getImages().get(0).getUrl());
            }
            
            // Process genres
            if (lidarrArtist.getGenres() != null && !lidarrArtist.getGenres().isEmpty()) {
                Set<Genre> genres = new HashSet<>();
                
                for (String genreName : lidarrArtist.getGenres()) {
                    // Find or create the genre
                    Genre genre = genreRepository.findByNameIgnoreCase(genreName)
                            .orElseGet(() -> {
                                Genre newGenre = new Genre();
                                newGenre.setName(genreName);
                                return genreRepository.save(newGenre);
                            });
                    
                    genres.add(genre);
                }
                
                artist.setGenres(genres);
            }
            
            // Save the artist
            artistRepository.save(artist);
        }
        
        return count;
    }
    
    /**
     * Get artist details from Lidarr
     * @param lidarrId Lidarr artist ID
     * @return Artist details from Lidarr
     */
    public LidarrArtistDto getArtistDetailsFromLidarr(Integer lidarrId) {
        return lidarrClient.getArtistById(lidarrId);
    }
    
    /**
     * Search artists in Lidarr
     * @param term Search term
     * @return List of artists matching the search term
     */
    public List<LidarrArtistDto> searchArtistsInLidarr(String term) {
        return lidarrClient.searchArtists(term);
    }
}
