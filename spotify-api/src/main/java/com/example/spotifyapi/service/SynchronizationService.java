package com.example.spotifyapi.service;

import com.example.spotifyapi.lidarr.LidarrClient;
import com.example.spotifyapi.lidarr.dto.LidarrAlbumDto;
import com.example.spotifyapi.lidarr.dto.LidarrTrackDto;
import com.example.spotifyapi.lidarr.dto.LidarrAlbumDto.Release;
import com.example.spotifyapi.model.Album;
import com.example.spotifyapi.model.Artist;
import com.example.spotifyapi.model.Genre;
import com.example.spotifyapi.model.Track;
import com.example.spotifyapi.repository.AlbumRepository;
import com.example.spotifyapi.repository.ArtistRepository;
import com.example.spotifyapi.repository.GenreRepository;
import com.example.spotifyapi.repository.TrackRepository;
import jakarta.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

/**
 * Service responsible for synchronizing data between the local database and external services like Lidarr.
 * Performs initial synchronization at startup and scheduled synchronization at regular intervals.
 */
@Service
public class SynchronizationService {

    private static final Logger logger = LoggerFactory.getLogger(SynchronizationService.class);

    private final ArtistRepository artistRepository;
    private final AlbumRepository albumRepository;
    private final TrackRepository trackRepository;
    private final GenreRepository genreRepository;
    private final LidarrClient lidarrClient;
    

    @Value("${lidarr.FileRoot}")
    private String mediaRoot;

    @Autowired
    public SynchronizationService(
            ArtistRepository artistRepository,
            AlbumRepository albumRepository,
            TrackRepository trackRepository,
            GenreRepository genreRepository,
            LidarrClient lidarrClient) {
        this.artistRepository = artistRepository;
        this.albumRepository = albumRepository;
        this.trackRepository = trackRepository;
        this.genreRepository = genreRepository;
        this.lidarrClient = lidarrClient;
    }

    /**
     * Initialize synchronization when the application starts.
     * This method runs once after the service is constructed.
     */
    @PostConstruct
    public void initialize() {
        logger.info("Initializing synchronization service...");
        try {
            performFullSynchronization();
            logger.info("Initial synchronization completed successfully");
        } catch (Exception e) {
            logger.error("Error during initial synchronization", e);
        }
    }

    /**
     * Scheduled synchronization job that runs every 30 seconds.
     * Updates local database with changes from external services.
     */
    @Scheduled(fixedRate = 30000) // 30 seconds in milliseconds
    public void scheduledSynchronization() {
        logger.info("Starting scheduled synchronization...");
        try {
            performIncrementalSynchronization();
            logger.info("Scheduled synchronization completed successfully");
        } catch (Exception e) {
            logger.error("Error during scheduled synchronization", e);
        }
    }

    /**
     * Performs a full synchronization of all data.
     * This is a more intensive operation typically done at startup.
     * 
     * Note: This method is currently not called automatically but is kept for manual synchronization if needed.
     * You can call this method through a REST endpoint or other trigger mechanism.
     */
    private void performFullSynchronization() {
        logger.info("Performing full synchronization...");
        
        // Synchronize artists
        syncArtists();
        
        // Synchronize albums
        syncAlbums();
        
        // Synchronize tracks
        syncTracks();
        
        logger.info("Full synchronization completed");
    }

    /**
     * Performs an incremental synchronization, focusing only on recently changed data.
     * This is less intensive and suitable for frequent updates.
     */
    private void performIncrementalSynchronization() {
        logger.info("Performing incremental synchronization...");
        

        
        logger.info("Incremental synchronization completed");
    }
    
    /**
     * Synchronizes all artists from Lidarr to the local database.
     */
    private void syncArtists() {
        logger.info("Synchronizing artists...");
        try {
            // Fetch artists from Lidarr API
            var lidarrArtists = lidarrClient.getAllArtists();
            logger.info("Retrieved {} artists from Lidarr", lidarrArtists.size());
            
            // Process each artist and update/save to local database
            for (var lidarrArtist : lidarrArtists) {
                // Check if artist already exists in database
                var existingArtist = artistRepository.findByLidarrId(lidarrArtist.getId());
                
                if (existingArtist.isPresent()) {
                    // Update existing artist
                    logger.debug("Updating existing artist: {}", lidarrArtist.getArtistName());
                    // Update logic here
                } else {
                    // Create new artist
                    Artist newArtist = new Artist(
                        0, 
                        lidarrArtist.getArtistName(),
                        lidarrArtist.getOverview(), 
                        lidarrArtist.getImages().get(0).getRemoteUrl(),
                        lidarrArtist.getId(),
                        lidarrArtist.getForeignArtistId(),
                        lidarrArtist.getGenres()
                    );
                    artistRepository.save(newArtist);
                }
            }
        } catch (Exception e) {
            logger.error("Error synchronizing artists", e);
        }
    }
    
    /**
     * Synchronizes all albums from Lidarr to the local database.
     */
    private void syncAlbums() {
        logger.info("Synchronizing albums...");
        // Get all artists from local database
        List<Artist> artists = artistRepository.findAll();
        logger.info("Found {} artists in database to sync albums for", artists.size());
        
        // Process each artist individually so one failure doesn't stop the entire process
        for (Artist artist : artists) {
            try {
                // Skip artists without Lidarr ID
                if (artist.getLidarrId() == null) {
                    logger.debug("Skipping artist without Lidarr ID: {}", artist.getName());
                    continue;
                }
                
                logger.info("Processing albums for artist: {} (ID: {})", artist.getName(), artist.getLidarrId());
                
                // Fetch albums for this artist from Lidarr
                List<LidarrAlbumDto> lidarrAlbums = lidarrClient.getAlbumsByArtistId(artist.getLidarrId());
                logger.debug("Retrieved {} albums for artist: {}", lidarrAlbums.size(), artist.getName());
                
                // Process each album individually
                for (LidarrAlbumDto lidarrAlbum : lidarrAlbums) {
                    try {
                        // Check if album already exists
                        Optional<Album> existingAlbum = albumRepository.findByLidarrAlbumId(lidarrAlbum.getId());
                        
                        if (existingAlbum.isPresent()) {
                            if(lidarrAlbum.getStatistics().getTrackFileCount() == lidarrAlbum.getStatistics().getTrackCount()){
                                existingAlbum.get().setDownloaded(true);
                                albumRepository.save(existingAlbum.get());
                            }
                        } else {
                            // Create new album
                            logger.debug("Creating new album: {}", lidarrAlbum.getTitle());

                            Album album = new Album();
                            album.setLidarrAlbumId(lidarrAlbum.getId());
                            album.setArtist(artist);
                            album.setTitle(lidarrAlbum.getTitle());
                            album.setAlbumType(lidarrAlbum.getAlbumType());
                            album.setReleaseDate(lidarrAlbum.getReleaseDateAsLocalDate());
                            album.setCoverImageUrl(lidarrAlbum.getCoverArt());
                            
                            // Safely set albumId from releases if available
                            if (lidarrAlbum.getReleases() != null && !lidarrAlbum.getReleases().isEmpty() && 
                                lidarrAlbum.getReleases().get(0) != null && 
                                lidarrAlbum.getReleases().get(0).getAlbumId() != null) {
                                album.setAlbumId(lidarrAlbum.getReleases().get(0).getAlbumId());
                            }
                            
                            album.setForeignAlbumId(lidarrAlbum.getForeignAlbumId());
                            
                            // Set downloaded status based on statistics if available
                            if (lidarrAlbum.getStatistics() != null && 
                                lidarrAlbum.getStatistics().getTrackFileCount() != null && 
                                lidarrAlbum.getStatistics().getTrackCount() != null) {
                                album.setDownloaded(lidarrAlbum.getStatistics().getTrackFileCount() > 0);
                            } else {
                                album.setDownloaded(false);
                            }
                            album.setGenres(new HashSet<>());

                            for (Release releases : lidarrAlbum.getReleases()) {
                            if(releases.getMonitored()){
                                album.setLidarrAlbumReleaseId(releases.getId());
                                break;
                            }
                            }
                            
                            // Save the album first to get an ID
                            Album savedAlbum = albumRepository.save(album);
                            logger.debug("Saved new album with ID: {}", savedAlbum.getId());


                            
                            // Process genres - fetch each genre separately to avoid LazyInitializationException
                            if (lidarrAlbum.getGenres() != null && !lidarrAlbum.getGenres().isEmpty()) {
                                for (String genreName : lidarrAlbum.getGenres()) {
                                    try {
                                        // Find or create the genre
                                        Genre genre = genreRepository.findByNameIgnoreCase(genreName)
                                                .orElseGet(() -> {
                                                    Genre newGenre = new Genre();
                                                    newGenre.setName(genreName);
                                                    return genreRepository.save(newGenre);
                                                });
                                        
                                        // Add genre to album's genres
                                        savedAlbum.getGenres().add(genre);
                                    } catch (Exception e) {
                                        logger.error("Error processing genre '{}' for album '{}'", genreName, lidarrAlbum.getTitle(), e);
                                    }
                                }
                                // Save the album again with updated genres
                                albumRepository.save(savedAlbum);
                            }
                        }
                    } catch (Exception e) {
                        logger.error("Error processing album: {}", lidarrAlbum.getTitle(), e);
                        // Continue with next album
                    }
                }
                
                logger.info("Finished processing albums for artist: {}", artist.getName());
                
            } catch (Exception e) {
                logger.error("Error synchronizing albums for artist: {}", artist.getName(), e);
                // Continue with next artist
            }
        }
        
        logger.info("Album synchronization completed");
    }
    
    /**
     * Synchronizes all tracks from Lidarr to the local database.
     */
    private void syncTracks() {
        logger.info("Synchronizing tracks...");
        List<Album> albums = albumRepository.findAll();
        for (Album album : albums) {
            if (!album.isDownloaded()) {
                continue;
            }
            Artist artist = album.getArtist();
            // Skip if either artist or artist's Lidarr ID is null
            if (artist == null || artist.getLidarrId() == null) {
                logger.debug("Skipping album without valid artist: {}", album.getTitle());
                continue;
            }
            
            // Use lidarrAlbumId instead of albumId
            if (album.getLidarrAlbumId() == null) {
                logger.debug("Skipping album without Lidarr album ID: {}", album.getTitle());
                continue;
            }
            
            try {
                // Fetch tracks using the correct Lidarr album ID
                List<LidarrTrackDto> tracks = lidarrClient.getTracksByAlbumId(artist.getLidarrId(), album.getLidarrAlbumId(), album.getLidarrAlbumReleaseId());
                logger.debug("Retrieved {} tracks for album: {}", tracks.size(), album.getTitle());
                
                tracks.forEach(lidarrTrack -> {
                    try {
                        Track track = trackRepository.findByLidarrTrackId(lidarrTrack.getId());
                        if (track == null) {
                            track = new Track();
                            track.setLidarrTrackId(lidarrTrack.getId().longValue());
                            track.setTitle(lidarrTrack.getTitle());
                            track.setDurationInSeconds(lidarrTrack.getDuration());
                            // Convert string track number to integer, using absoluteTrackNumber as fallback
                            track.setTrackNumber(lidarrTrack.getAbsoluteTrackNumber() != null ? lidarrTrack.getAbsoluteTrackNumber() : 0);
                            // Use mediumNumber as discNumber, or default to 1
                            Integer discNumber = lidarrTrack.getMediumNumber();
                            track.setDiscNumber(discNumber != null ? discNumber : 1);
                            track.setExplicit(lidarrTrack.getExplicit());
                            track.setAlbum(album);
                            track.setAudioUrl(generateStreamUrl(artist.getName(), album.getTitle(), lidarrTrack.getTitle(), lidarrTrack.getAbsoluteTrackNumber()));
                            trackRepository.save(track);
                            logger.debug("Created new track: {}", lidarrTrack.getTitle());
                        }
                    } catch (Exception e) {
                        logger.error("Error processing track: {}", lidarrTrack.getTitle(), e);
                    }
                });
            } catch (Exception e) {
                logger.error("Error fetching tracks for album: {}", album.getTitle(), e);
            }
            
        }
    }
    private String generateStreamUrl(String artistName, String albumTitle, String trackTitle, int trackNumber) {
        // Format track number as two digits (e.g., 1 -> 01, 10 -> 10)
        String formattedTrackNumber = String.format("%02d", trackNumber);
        String basePath = mediaRoot + "/" + sanitizeArtistName(artistName) + "/" + albumTitle + "/" + formattedTrackNumber + " - " + trackTitle;
        
        // Check for file extensions and append the correct one
        // Prioritize FLAC files since that's what we have in the media folder
        String[] possibleExtensions = {".flac", ".mp3", ".wav", ".m4a", ".ogg"};
        
        for (String ext : possibleExtensions) {
            java.io.File file = new java.io.File(basePath + ext);
            if (file.exists()) {
                logger.info("Found audio file with extension: {} at path: {}", ext, basePath + ext);
                return basePath + ext;
            }
        }
        
        // If no file is found with the exact name, try a case-insensitive search for FLAC files
        java.io.File directory = new java.io.File(mediaRoot + "/" + sanitizeArtistName(artistName) + "/" + albumTitle);
        if (directory.exists() && directory.isDirectory()) {
            String trackFilePrefix = formattedTrackNumber + " - ";
            java.io.File[] files = directory.listFiles();
            if (files != null) {
                for (java.io.File file : files) {
                    String fileName = file.getName().toLowerCase();
                    if (fileName.startsWith(trackFilePrefix.toLowerCase()) && fileName.endsWith(".flac")) {
                        logger.info("Found FLAC file with case-insensitive match: {}", file.getAbsolutePath());
                        return mediaRoot + "/" + sanitizeArtistName(artistName) + "/" + albumTitle + "/" + file.getName();
                    }
                }
            }
        }
        
        // Default to flac if no file is found (since that's what we have in the folder)
        logger.warn("No audio file found for track: {}, defaulting to .flac extension", trackTitle);
        return basePath + ".flac";
    }

    private String sanitizeArtistName(String artistName) {
        return artistName.replaceAll("\\s+", "+");
    }
    
    /**
     * Synchronizes only recently updated artists.
     */
    private void syncRecentlyUpdatedArtists() {
        logger.info("Checking for recently updated artists...");
        // Implementation would fetch only recently updated artists
        // This is a placeholder for the actual implementation
    }
    
    /**
     * Synchronizes only recently updated albums.
     */
    private void syncRecentlyUpdatedAlbums() {
        logger.info("Checking for recently updated albums...");
        // Implementation would fetch only recently updated albums
        // This is a placeholder for the actual implementation
    }
    
    /**
     * Synchronizes only recently updated tracks.
     */
    private void syncRecentlyUpdatedTracks() {
        logger.info("Checking for recently updated tracks...");
        // Implementation would fetch only recently updated tracks
        // This is a placeholder for the actual implementation
    }
    
}
