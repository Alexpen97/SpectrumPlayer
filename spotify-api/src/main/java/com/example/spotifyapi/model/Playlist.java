package com.example.spotifyapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Playlist {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String description;
    private String coverImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isPublic;
    
    // Assuming we would have a User model in a real application
    private String ownerUsername;
    
    @ManyToMany
    @JoinTable(
        name = "playlist_track",
        joinColumns = @JoinColumn(name = "playlist_id"),
        inverseJoinColumns = @JoinColumn(name = "track_id")
    )
    @JsonManagedReference
    private Set<Track> tracks = new HashSet<>();
    
    // Playlists can be in users' recently played list
    @ManyToMany(mappedBy = "recentlyPlayedPlaylists")
    @JsonBackReference(value = "user-playlist-reference")
    private Set<User> recentlyPlayedByUsers = new HashSet<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
