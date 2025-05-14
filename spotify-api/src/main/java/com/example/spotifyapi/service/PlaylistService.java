package com.example.spotifyapi.service;

import com.example.spotifyapi.model.Playlist;
import com.example.spotifyapi.model.Track;
import com.example.spotifyapi.repository.PlaylistRepository;
import com.example.spotifyapi.repository.TrackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final TrackRepository trackRepository;
    
    @Autowired
    public PlaylistService(PlaylistRepository playlistRepository, TrackRepository trackRepository) {
        this.playlistRepository = playlistRepository;
        this.trackRepository = trackRepository;
    }
    
    public List<Playlist> getAllPlaylists() {
        return playlistRepository.findAll();
    }
    
    @Transactional
    public Optional<Playlist> getPlaylistById(Long id) {
        // Use the custom repository method that eagerly loads tracks
        return playlistRepository.findByIdWithTracks(id);
    }
    
    public List<Playlist> searchPlaylistsByName(String name) {
        return playlistRepository.findByNameContainingIgnoreCase(name);
    }
    
    public List<Playlist> getPlaylistsByOwner(String ownerUsername) {
        return playlistRepository.findByOwnerUsername(ownerUsername);
    }
    
    public List<Playlist> getPublicPlaylists() {
        return playlistRepository.findByIsPublicTrue();
    }
    
    public Playlist createPlaylist(Playlist playlist) {
        playlist.setCreatedAt(LocalDateTime.now());
        playlist.setUpdatedAt(LocalDateTime.now());
        return playlistRepository.save(playlist);
    }
    
    public Playlist updatePlaylist(Long id, Playlist playlistDetails) {
        return playlistRepository.findById(id)
                .map(existingPlaylist -> {
                    existingPlaylist.setName(playlistDetails.getName());
                    existingPlaylist.setDescription(playlistDetails.getDescription());
                    existingPlaylist.setCoverImageUrl(playlistDetails.getCoverImageUrl());
                    existingPlaylist.setPublic(playlistDetails.isPublic());
                    existingPlaylist.setUpdatedAt(LocalDateTime.now());
                    return playlistRepository.save(existingPlaylist);
                })
                .orElse(null);
    }
    
    @Transactional
    public boolean addTrackToPlaylist(Long playlistId, Long trackId) {
        Optional<Playlist> optionalPlaylist = playlistRepository.findById(playlistId);
        
        // First try to find by ID, then by lidarrTrackId if that fails
        Optional<Track> optionalTrack = trackRepository.findById(trackId);
        if (optionalTrack.isEmpty()) {
            optionalTrack = trackRepository.findByLidarrTrackId(trackId);
        }
        
        if (optionalPlaylist.isEmpty() || optionalTrack.isEmpty()) {
            System.out.println("Failed to add track to playlist. Playlist found: " + !optionalPlaylist.isEmpty() + 
                               ", Track found: " + !optionalTrack.isEmpty());
            return false;
        }
        
        Playlist playlist = optionalPlaylist.get();
        Track track = optionalTrack.get();
        
        // Add track to playlist
        playlist.getTracks().add(track);
        playlist.setUpdatedAt(LocalDateTime.now());
        playlistRepository.save(playlist);
        
        System.out.println("Added track " + track.getId() + " to playlist " + playlist.getId() + 
                           ". Playlist now has " + playlist.getTracks().size() + " tracks.");
        
        return true;
    }
    
    @Transactional
    public boolean removeTrackFromPlaylist(Long playlistId, Long trackId) {
        Optional<Playlist> optionalPlaylist = playlistRepository.findById(playlistId);
        
        // First try to find by ID, then by lidarrTrackId if that fails
        Optional<Track> optionalTrack = trackRepository.findById(trackId);
        if (optionalTrack.isEmpty()) {
            optionalTrack = trackRepository.findByLidarrTrackId(trackId);
        }
        
        if (optionalPlaylist.isEmpty() || optionalTrack.isEmpty()) {
            System.out.println("Failed to remove track from playlist. Playlist found: " + !optionalPlaylist.isEmpty() + 
                               ", Track found: " + !optionalTrack.isEmpty());
            return false;
        }
        
        Playlist playlist = optionalPlaylist.get();
        Track track = optionalTrack.get();
        
        boolean removed = playlist.getTracks().remove(track);
        if (removed) {
            playlist.setUpdatedAt(LocalDateTime.now());
            playlistRepository.save(playlist);
            System.out.println("Removed track " + track.getId() + " from playlist " + playlist.getId() + 
                               ". Playlist now has " + playlist.getTracks().size() + " tracks.");
        } else {
            System.out.println("Track " + track.getId() + " was not found in playlist " + playlist.getId());
        }
        
        return removed;
    }
    
    public void deletePlaylist(Long id) {
        playlistRepository.deleteById(id);
    }
}
