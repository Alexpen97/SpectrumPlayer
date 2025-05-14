package com.example.spotifyapi.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;
    
    @Column(nullable = true, unique = true)
    private String email;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_recently_played",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "album_id")
    )
    @JsonManagedReference(value = "user-album-reference")
    private Set<Album> recentlyPlayedAlbums = new HashSet<>();
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_recently_played_tracks",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "track_id")
    )
    @JsonManagedReference(value = "user-track-reference")
    private Set<Track> recentlyPlayedTracks = new HashSet<>();
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_recently_played_playlists",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "playlist_id")
    )
    @JsonManagedReference(value = "user-playlist-reference")
    private Set<Playlist> recentlyPlayedPlaylists = new HashSet<>();
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_liked_tracks",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "track_id")
    )
    @JsonManagedReference(value = "user-liked-track-reference")
    private Set<Track> likedTracks = new HashSet<>();
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_liked_albums",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "album_id")
    )
    @JsonManagedReference(value = "user-liked-album-reference")
    private Set<Album> likedAlbums = new HashSet<>();
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_liked_artists",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "artist_id")
    )
    @JsonManagedReference(value = "user-liked-artist-reference")
    private Set<Artist> likedArtists = new HashSet<>();

    // Default constructor
    public User() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructor with username and password
    public User(String username, String password) {
        this.username = username;
        this.password = password;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Set<Album> getRecentlyPlayedAlbums() {
        return recentlyPlayedAlbums;
    }

    public void setRecentlyPlayedAlbums(Set<Album> recentlyPlayedAlbums) {
        this.recentlyPlayedAlbums = recentlyPlayedAlbums;
    }
    
    public Set<Track> getRecentlyPlayedTracks() {
        return recentlyPlayedTracks;
    }

    public void setRecentlyPlayedTracks(Set<Track> recentlyPlayedTracks) {
        this.recentlyPlayedTracks = recentlyPlayedTracks;
    }
    
    public Set<Playlist> getRecentlyPlayedPlaylists() {
        return recentlyPlayedPlaylists;
    }

    public void setRecentlyPlayedPlaylists(Set<Playlist> recentlyPlayedPlaylists) {
        this.recentlyPlayedPlaylists = recentlyPlayedPlaylists;
    }
    
    public Set<Track> getLikedTracks() {
        return likedTracks;
    }

    public void setLikedTracks(Set<Track> likedTracks) {
        this.likedTracks = likedTracks;
    }
    
    public Set<Album> getLikedAlbums() {
        return likedAlbums;
    }

    public void setLikedAlbums(Set<Album> likedAlbums) {
        this.likedAlbums = likedAlbums;
    }
    
    public Set<Artist> getLikedArtists() {
        return likedArtists;
    }

    public void setLikedArtists(Set<Artist> likedArtists) {
        this.likedArtists = likedArtists;
    }

    // Method to add an album to recently played
    public void addToRecentlyPlayed(Album album) {
        // Remove the album if it already exists to update its position
        this.recentlyPlayedAlbums.remove(album);
        this.recentlyPlayedAlbums.add(album);
        
        // Limit the size to 10 most recent albums
        if (this.recentlyPlayedAlbums.size() > 10) {
            // Remove the oldest album (this is simplified - in a real app you'd track timestamps)
            Album oldest = this.recentlyPlayedAlbums.iterator().next();
            this.recentlyPlayedAlbums.remove(oldest);
        }
    }
    
    // Method to add a track to recently played
    public void addToRecentlyPlayedTracks(Track track) {
        // Remove the track if it already exists to update its position
        this.recentlyPlayedTracks.remove(track);
        this.recentlyPlayedTracks.add(track);
        
        // Limit the size to 20 most recent tracks
        if (this.recentlyPlayedTracks.size() > 20) {
            // Remove the oldest track
            Track oldest = this.recentlyPlayedTracks.iterator().next();
            this.recentlyPlayedTracks.remove(oldest);
        }
    }
    
    // Method to add a playlist to recently played
    public void addToRecentlyPlayedPlaylists(Playlist playlist) {
        // Remove the playlist if it already exists to update its position
        this.recentlyPlayedPlaylists.remove(playlist);
        this.recentlyPlayedPlaylists.add(playlist);
        
        // Limit the size to 10 most recent playlists
        if (this.recentlyPlayedPlaylists.size() > 10) {
            // Remove the oldest playlist
            Playlist oldest = this.recentlyPlayedPlaylists.iterator().next();
            this.recentlyPlayedPlaylists.remove(oldest);
        }
    }
    
    /**
     * Toggle a track's liked status
     * @param track The track to toggle
     * @return true if the track is now liked, false if unliked
     */
    public boolean toggleLikedTrack(Track track) {
        if (this.likedTracks.contains(track)) {
            this.likedTracks.remove(track);
            return false; // Track was unliked
        } else {
            this.likedTracks.add(track);
            return true; // Track was liked
        }
    }
    
    /**
     * Toggle an album's liked status
     * @param album The album to toggle
     * @return true if the album is now liked, false if unliked
     */
    public boolean toggleLikedAlbum(Album album) {
        if (this.likedAlbums.contains(album)) {
            this.likedAlbums.remove(album);
            return false; // Album was unliked
        } else {
            this.likedAlbums.add(album);
            return true; // Album was liked
        }
    }
    
    /**
     * Toggle an artist's liked status
     * @param artist The artist to toggle
     * @return true if the artist is now liked, false if unliked
     */
    public boolean toggleLikedArtist(Artist artist) {
        if (this.likedArtists.contains(artist)) {
            this.likedArtists.remove(artist);
            return false; // Artist was unliked
        } else {
            this.likedArtists.add(artist);
            return true; // Artist was liked
        }
    }
}
