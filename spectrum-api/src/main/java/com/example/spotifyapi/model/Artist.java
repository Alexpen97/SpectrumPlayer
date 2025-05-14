package com.example.spotifyapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity 
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Artist {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    
    @Lob
    @Column(columnDefinition = "TEXT")
    private String biography;
    
    private String imageUrl;
    private Integer lidarrId; // To match with Lidarr's artist ID
    private String foreignId;
    
    @ManyToMany
    @JoinTable(
        name = "artist_genre",
        joinColumns = @JoinColumn(name = "artist_id"),
        inverseJoinColumns = @JoinColumn(name = "genre_id")
    )
    private Set<Genre> genres = new HashSet<>();
    
    @OneToMany(mappedBy = "artist", cascade = CascadeType.ALL)
    @JsonIgnore
    private Set<Album> albums = new HashSet<>();
    
    // Artists can be liked by users
    @ManyToMany(mappedBy = "likedArtists")
    @JsonBackReference(value = "user-liked-artist-reference")
    private Set<User> likedByUsers = new HashSet<>();
    
    /**
     * Constructor for creating an Artist from Lidarr API data
     * 
     * @param id The ID (0 for new artists)
     * @param name The artist name
     * @param biography The artist overview/biography
     * @param imageUrl The URL to the artist's image
     * @param lidarrId The Lidarr system ID
     * @param foreignId The external/foreign ID (e.g., MusicBrainz ID)
     * @param genres List of genre names
     */
    public Artist(long id, String name, String biography, String imageUrl, Integer lidarrId, String foreignId, List<String> genres) {
        this.id = id == 0 ? null : id; // Use null for new entities to let JPA generate the ID
        this.name = name;
        this.biography = biography;
        this.imageUrl = imageUrl;
        this.lidarrId = lidarrId;
        this.foreignId = foreignId;
        // Genres will need to be set separately as they require Genre entities
    }
}
