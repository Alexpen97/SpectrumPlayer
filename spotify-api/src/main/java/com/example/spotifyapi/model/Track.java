package com.example.spotifyapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Track {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long lidarrTrackId;
    private String title;
    private String audioUrl;
    private int durationInSeconds;
    private int trackNumber;
    private int discNumber;
    private boolean explicit;
    
    @ManyToOne
    @JoinColumn(name = "album_id")
    @JsonBackReference
    @JsonIgnore
    private Album album;
    
    // Many tracks can be part of many playlists
    @ManyToMany(mappedBy = "tracks")
    @JsonBackReference
    private Set<Playlist> playlists = new HashSet<>();
    
    // Tracks can be in users' recently played list
    @ManyToMany(mappedBy = "recentlyPlayedTracks")
    @JsonBackReference(value = "user-track-reference")
    private Set<User> recentlyPlayedByUsers = new HashSet<>();
    
    // Tracks can be liked by users
    @ManyToMany(mappedBy = "likedTracks")
    @JsonBackReference(value = "user-liked-track-reference")
    private Set<User> likedByUsers = new HashSet<>();
}
