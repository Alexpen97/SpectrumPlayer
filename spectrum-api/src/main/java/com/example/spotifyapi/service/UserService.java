package com.example.spotifyapi.service;

import com.example.spotifyapi.lidarr.LidarrClient;
import com.example.spotifyapi.lidarr.dto.LidarrAlbumDto;
import com.example.spotifyapi.model.Album;
import com.example.spotifyapi.model.Artist;
import com.example.spotifyapi.model.Playlist;
import com.example.spotifyapi.model.Track;
import com.example.spotifyapi.model.User;
import com.example.spotifyapi.repository.AlbumRepository;
import com.example.spotifyapi.repository.ArtistRepository;
import com.example.spotifyapi.repository.PlaylistRepository;
import com.example.spotifyapi.repository.TrackRepository;
import com.example.spotifyapi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import com.example.spotifyapi.lidarr.dto.LidarrArtistDto;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AlbumRepository albumRepository;
    private final TrackRepository trackRepository;
    private final PlaylistRepository playlistRepository;
    private final ArtistRepository artistRepository;
    private final LidarrClient lidarrClient;

    @Autowired
    public UserService(UserRepository userRepository, AlbumRepository albumRepository,
                       TrackRepository trackRepository, PlaylistRepository playlistRepository,
                       ArtistRepository artistRepository, LidarrClient lidarrClient) {
        this.userRepository = userRepository;
        this.albumRepository = albumRepository;
        this.trackRepository = trackRepository;
        this.playlistRepository = playlistRepository;
        this.artistRepository = artistRepository;
        this.lidarrClient = lidarrClient;
    }

    /**
     * Authenticate a user with username and password
     * @param username The username
     * @param password The password
     * @return The authenticated user or null if authentication fails
     */
    public User authenticate(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Simple password check (in a real app, you'd use password hashing)
            if (user.getPassword().equals(password)) {
                return user;
            }
        }
        return null;
    }

    /**
     * Get a user by ID
     * @param id The user ID
     * @return The user if found
     */
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * Get a user by username
     * @param username The username
     * @return The user if found
     */
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Create a new user
     * @param user The user to create
     * @return The created user
     */
    public User createUser(User user) {
        return userRepository.save(user);
    }

    /**
     * Add an album to a user's recently played list
     * @param userId The user ID
     * @param albumId The album ID
     * @return true if successful, false otherwise
     */
    @Transactional
    public boolean addToRecentlyPlayed(Long userId, Long albumId) {
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<Album> albumOpt = albumRepository.findByLidarrAlbumId(albumId.intValue());
        
        if (userOpt.isPresent() && albumOpt.isPresent()) {
            User user = userOpt.get();
            Album album = albumOpt.get();
            
            user.addToRecentlyPlayed(album);
            userRepository.save(user);
            return true;
        }
        return false;
    }
    
    /**
     * Add a track to a user's recently played list
     * @param userId The user ID
     * @param trackId The track ID
     * @return true if successful, false otherwise
     */
    @Transactional
    public boolean addToRecentlyPlayedTracks(Long userId, Long trackId) {
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<Track> trackOpt = trackRepository.findByLidarrTrackId(trackId);
        
        if (userOpt.isPresent() && trackOpt.isPresent()) {
            User user = userOpt.get();
            Track track = trackOpt.get();
            
            user.addToRecentlyPlayedTracks(track);
            userRepository.save(user);
            return true;
        }
        return false;
    }
    
    /**
     * Add a playlist to a user's recently played list
     * @param userId The user ID
     * @param playlistId The playlist ID
     * @return true if successful, false otherwise
     */
    @Transactional
    public boolean addToRecentlyPlayedPlaylists(Long userId, Long playlistId) {
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<Playlist> playlistOpt = playlistRepository.findById(playlistId);
        
        if (userOpt.isPresent() && playlistOpt.isPresent()) {
            User user = userOpt.get();
            Playlist playlist = playlistOpt.get();
            
            user.addToRecentlyPlayedPlaylists(playlist);
            userRepository.save(user);
            return true;
        }
        return false;
    }

    /**
     * Get a user's recently played albums
     * @param userId The user ID
     * @return List of recently played albums
     */
    public List<Album> getRecentlyPlayedAlbums(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            return new ArrayList<>(userOpt.get().getRecentlyPlayedAlbums());
        }
        return new ArrayList<>();
    }
    
    /**
     * Get a user's recently played tracks
     * @param userId The user ID
     * @return List of recently played tracks
     */
    public List<Track> getRecentlyPlayedTracks(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            return new ArrayList<>(userOpt.get().getRecentlyPlayedTracks());
        }
        return new ArrayList<>();
    }
    
    /**
     * Get a user's recently played playlists
     * @param userId The user ID
     * @return List of recently played playlists
     */
    public List<Playlist> getRecentlyPlayedPlaylists(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            return new ArrayList<>(userOpt.get().getRecentlyPlayedPlaylists());
        }
        return new ArrayList<>();
    }
    
    /**
     * Get a user's liked tracks
     * @param userId The user ID
     * @return List of liked tracks
     */
    public List<Track> getLikedTracks(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            return new ArrayList<>(userOpt.get().getLikedTracks());
        }
        return new ArrayList<>();
    }
    
    /**
     * Get a user's liked albums
     * @param userId The user ID
     * @return List of liked albums
     */
    public List<Album> getLikedAlbums(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            return new ArrayList<>(userOpt.get().getLikedAlbums());
        }
        return new ArrayList<>();
    }
    
    /**
     * Get a user's liked artists
     * @param userId The user ID
     * @return List of liked artists
     */
    public List<Artist> getLikedArtists(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            return new ArrayList<>(userOpt.get().getLikedArtists());
        }
        return new ArrayList<>();
    }
    
    /**
     * Toggle like status for a track
     * @param userId The user ID
     * @param trackId The track ID
     * @return true if the track is now liked, false if unliked
     */
    @Transactional
    public boolean toggleLikedTrack(Long userId, Long trackId) {
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<Track> trackOpt = trackRepository.findByLidarrTrackId(trackId);
        
        if (userOpt.isPresent() && trackOpt.isPresent()) {
            User user = userOpt.get();
            Track track = trackOpt.get();
            
            boolean isLiked = user.toggleLikedTrack(track);
            userRepository.save(user);
            return isLiked;
        }
        return false;
    }
    
    /**
     * Toggle like status for an album
     * @param userId The user ID
     * @param albumId The album ID
     * @return true if the album is now liked, false if unliked
     */
    @Transactional
    public boolean toggleLikedAlbum(Long userId, Long albumId) {
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<Album> albumOpt = albumRepository.findByLidarrAlbumId(albumId.intValue());
        
        if (userOpt.isPresent() && albumOpt.isPresent()) {
            User user = userOpt.get();
            Album album = albumOpt.get();
            
            boolean isLiked = user.toggleLikedAlbum(album);
            userRepository.save(user);
            return isLiked;
        }
        return false;
    }
    
    /**
     * Toggle like status for an artist
     * @param userId The user ID
     * @param artistId The artist ID
     * @return true if the artist is now liked, false if unliked
     */
    @Transactional
    public boolean toggleLikedArtist(Long userId, String foreignArtistId) {
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<Artist> artistOpt = artistRepository.findByForeignId(foreignArtistId);
        
        if (userOpt.isPresent() && artistOpt.isPresent()) {
            User user = userOpt.get();
            Artist artist = artistOpt.get();
            
            boolean isLiked = user.toggleLikedArtist(artist);
            userRepository.save(user);
            return isLiked;
        }
        return false;
    }
    
    /**
     * Check if a track is liked by a user
     * @param userId The user ID
     * @param trackId The track ID
     * @return true if the track is liked, false otherwise
     */
    public boolean isTrackLiked(Long userId, Long trackId) {
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<Track> trackOpt = trackRepository.findByLidarrTrackId(trackId);
        
        if (userOpt.isPresent() && trackOpt.isPresent()) {
            User user = userOpt.get();
            Track track = trackOpt.get();
            
            return user.getLikedTracks().contains(track);
        }
        return false;
    }
    
    /**
     * Check if an album is liked by a user
     * @param userId The user ID
     * @param albumId The album ID
     * @return true if the album is liked, false otherwise
     */
    public boolean isAlbumLiked(Long userId, Long albumId) {
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<Album> albumOpt = albumRepository.findByLidarrAlbumId(albumId.intValue());
        
        if (userOpt.isPresent() && albumOpt.isPresent()) {
            User user = userOpt.get();
            Album album = albumOpt.get();
            
            return user.getLikedAlbums().contains(album);
        }
        return false;
    }
    
    /**
     * Check if an artist is liked by a user
     * @param userId The user ID
     * @param foreignArtistId The foreign artist ID
     * @return true if the artist is liked, false otherwise
     */
    public boolean isArtistLiked(Long userId, String foreignArtistId) {
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<Artist> artistOpt = artistRepository.findByForeignId(foreignArtistId);
        
        if (userOpt.isPresent() && artistOpt.isPresent()) {
            User user = userOpt.get();
            Artist artist = artistOpt.get();
            
            return user.getLikedArtists().contains(artist);
        }
        return false;
    }

    /**
     * Initialize the default admin user if it doesn't exist
     */
    @Transactional
    public void initializeDefaultUser() {
        if (!userRepository.existsByUsername("admin")) {
            User adminUser = new User("admin", "admin");
            userRepository.save(adminUser);
        }
    }
    
    /**
     * Get recent releases from artists that the user has recently listened to
     * @param userId The user ID
     * @return List of recent album releases
     */
    public List<LidarrAlbumDto> getRecentReleasesFromListenedArtists(Long userId) {
        System.out.println("DEBUG: Getting recent releases for user ID: " + userId);
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            System.out.println("DEBUG: User not found with ID: " + userId);
            return new ArrayList<>();
        }
        System.out.println("DEBUG: Found user: " + userOpt.get().getUsername());
        
        User user = userOpt.get();
        
        // Create a map to store artists with their recency score (higher = more recently listened to)
        Map<Artist, Integer> artistRecencyMap = new HashMap<>();
        int recentScore = 100; // Start with a high score for most recent
        
        System.out.println("DEBUG: Recently played albums count: " + user.getRecentlyPlayedAlbums().size());
        System.out.println("DEBUG: Recently played tracks count: " + user.getRecentlyPlayedTracks().size());
        System.out.println("DEBUG: Liked artists count: " + user.getLikedArtists().size());
        
        // Get artists from recently played albums (with recency weighting)
        List<Album> recentAlbums = new ArrayList<>(user.getRecentlyPlayedAlbums());
        for (int i = recentAlbums.size() - 1; i >= 0; i--) { // Process in reverse order (most recent first)
            Album album = recentAlbums.get(i);
            if (album.getArtist() != null) {
                Artist artist = album.getArtist();
                // Add or update with higher score if more recent
                artistRecencyMap.put(artist, Math.max(artistRecencyMap.getOrDefault(artist, 0), recentScore - i));
            }
        }
        
        // Get artists from recently played tracks (with recency weighting)
        List<Track> recentTracks = new ArrayList<>(user.getRecentlyPlayedTracks());
        for (int i = recentTracks.size() - 1; i >= 0; i--) { // Process in reverse order (most recent first)
            Track track = recentTracks.get(i);
            if (track.getAlbum() != null && track.getAlbum().getArtist() != null) {
                Artist artist = track.getAlbum().getArtist();
                // Add or update with higher score if more recent
                artistRecencyMap.put(artist, Math.max(artistRecencyMap.getOrDefault(artist, 0), recentScore - i));
            }
        }
        
        // Also include liked artists (with lower recency score)
        for (Artist artist : user.getLikedArtists()) {
            artistRecencyMap.putIfAbsent(artist, 10); // Lower priority than recently played
        }
        
        // Sort artists by recency score (highest first)
        List<Artist> sortedArtists = artistRecencyMap.entrySet().stream()
            .sorted(Map.Entry.<Artist, Integer>comparingByValue().reversed())
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
            
        System.out.println("DEBUG: Found " + sortedArtists.size() + " artists to check for recent releases");
        sortedArtists.forEach(artist -> {
            System.out.println("DEBUG: Artist: " + artist.getName() + ", Lidarr ID: " + artist.getLidarrId());
        });
        
        // Get newest album for each artist
        List<LidarrAlbumDto> allReleases = new ArrayList<>();
        System.out.println("DEBUG: Getting newest album for each artist");
        
        // Process artists in order of recency
        for (Artist artist : sortedArtists) {
            if (artist.getLidarrId() != null) {
                System.out.println("DEBUG: Fetching albums for artist: " + artist.getName());
                List<LidarrAlbumDto> artistAlbums = lidarrClient.getAlbumsByArtistId(artist.getLidarrId());
                System.out.println("DEBUG: Found " + artistAlbums.size() + " total albums for artist: " + artist.getName());
                
                if (!artistAlbums.isEmpty()) {
                    // Find the newest album (with valid release date)
                    Optional<LidarrAlbumDto> newestAlbum = artistAlbums.stream()
                        .filter(album -> album.getReleaseDate() != null && album.getReleaseDateAsLocalDate() != null)
                        .max(Comparator.comparing(LidarrAlbumDto::getReleaseDateAsLocalDate, Comparator.nullsLast(Comparator.naturalOrder())));
                    
                    if (newestAlbum.isPresent()) {
                        LidarrAlbumDto album = newestAlbum.get();
                        System.out.println("DEBUG: Found newest album: " + album.getTitle() + ", Release date: " + album.getReleaseDate());
                        
                        // Ensure artist name is set for display in UI
                        if (album.getArtist() == null) {
                            LidarrArtistDto artistDto = new LidarrArtistDto();
                            artistDto.setArtistName(artist.getName());
                            artistDto.setId(artist.getLidarrId());
                            album.setArtist(artistDto);
                        }
                        
                        // Set artistId for linking in UI
                        album.setArtistId(artist.getLidarrId());
                        
                        allReleases.add(album);
                        System.out.println("DEBUG: Added newest album from artist: " + artist.getName());
                    } else {
                        // If no album has a valid release date, just take the first one
                        if (!artistAlbums.isEmpty()) {
                            LidarrAlbumDto album = artistAlbums.get(0);
                            System.out.println("DEBUG: No album with valid release date found, using first album: " + album.getTitle());
                            
                            // Ensure artist name is set for display in UI
                            if (album.getArtist() == null) {
                                LidarrArtistDto artistDto = new LidarrArtistDto();
                                artistDto.setArtistName(artist.getName());
                                artistDto.setId(artist.getLidarrId());
                                album.setArtist(artistDto);
                            }
                            
                            // Set artistId for linking in UI
                            album.setArtistId(artist.getLidarrId());
                            
                            allReleases.add(album);
                            System.out.println("DEBUG: Added first album from artist: " + artist.getName());
                        }
                    }
                }
            }
        }
        
        // Sort by release date (newest first) and limit to 15
        List<LidarrAlbumDto> result = allReleases.stream()
            .sorted(Comparator.comparing(LidarrAlbumDto::getReleaseDateAsLocalDate, Comparator.nullsLast(Comparator.reverseOrder())))
            .limit(15)
            .collect(Collectors.toList());
            
        System.out.println("DEBUG: Final result contains " + result.size() + " albums");
        result.forEach(album -> {
            System.out.println("DEBUG: Result album: " + album.getTitle() + ", Artist: " + 
                (album.getArtist() != null ? album.getArtist().getArtistName() : "Unknown") + 
                ", Release date: " + album.getReleaseDate());
        });
        
        return result;
    }
}
