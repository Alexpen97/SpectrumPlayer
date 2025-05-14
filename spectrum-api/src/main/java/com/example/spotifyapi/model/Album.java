package com.example.spotifyapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;



@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Album {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String coverImageUrl;
    private LocalDate releaseDate;
    private String albumType; // e.g., "Single", "Album", "EP"
    private Integer lidarrAlbumId; // To match with Lidarr's album ID
    private Integer albumId;
    private Integer lidarrAlbumReleaseId;
    private String foreignAlbumId;
    private boolean downloaded;
    
    @ManyToOne
    @JoinColumn(name = "artist_id")

    private Artist artist;
    
    @ManyToMany
    @JoinTable(
        name = "album_genre",
        joinColumns = @JoinColumn(name = "album_id"),
        inverseJoinColumns = @JoinColumn(name = "genre_id")
    )
    private Set<Genre> genres = new HashSet<>();
    
    @OneToMany(mappedBy = "album", cascade = CascadeType.ALL)
    @JsonManagedReference
    private Set<Track> tracks = new HashSet<>();
    
    @ManyToMany(mappedBy = "recentlyPlayedAlbums")
    @JsonBackReference(value = "user-album-reference")
    private Set<User> recentlyPlayedByUsers = new HashSet<>();
    
    @ManyToMany(mappedBy = "likedAlbums")
    @JsonBackReference(value = "user-liked-album-reference")
    private Set<User> likedByUsers = new HashSet<>();
}
