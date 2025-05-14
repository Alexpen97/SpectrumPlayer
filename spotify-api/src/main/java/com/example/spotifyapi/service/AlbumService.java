package com.example.spotifyapi.service;

import com.example.spotifyapi.lidarr.LidarrClient;
import com.example.spotifyapi.lidarr.dto.LidarrAlbumDto;
import com.example.spotifyapi.lidarr.dto.LidarrTrackDto;
import com.example.spotifyapi.lidarr.dto.TrackImportDTO;
import com.example.spotifyapi.model.Album;
import com.example.spotifyapi.model.Artist;
import com.example.spotifyapi.model.Genre;
import com.example.spotifyapi.model.Track;
import com.example.spotifyapi.repository.AlbumRepository;
import com.example.spotifyapi.repository.ArtistRepository;
import com.example.spotifyapi.repository.GenreRepository;
import com.example.spotifyapi.repository.TrackRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AlbumService {
    
    private final Logger logger = LoggerFactory.getLogger(AlbumService.class);

    private final AlbumRepository albumRepository;
    private final ArtistRepository artistRepository;
    private final TrackRepository trackRepository;
    private final GenreRepository genreRepository;
    private final LidarrClient lidarrClient;
    
    @Autowired
    public AlbumService(AlbumRepository albumRepository,
                        ArtistRepository artistRepository,
                        TrackRepository trackRepository,
                        GenreRepository genreRepository,
                        LidarrClient lidarrClient) {
        this.albumRepository = albumRepository;
        this.artistRepository = artistRepository;
        this.trackRepository = trackRepository;
        this.genreRepository = genreRepository;
        this.lidarrClient = lidarrClient;
    }

    public LidarrAlbumDto LoadAlbum(int artistId, int albumId) {
        LidarrAlbumDto album = lidarrClient.getAlbumById(albumId);

        Optional<Album> albumEntity = albumRepository.findByLidarrAlbumId(albumId);

        if (albumEntity.isPresent()) {
            album.setInternalID(albumEntity.get().getId().intValue());
        }

       return album;
    }
    
    /**
     * Request an album download from Lidarr by setting the monitored flag to true
     * and triggering a search for the album
     * @param artistId Artist ID in Lidarr
     * @param albumId Album ID in Lidarr
     * @return true if the request was successful, false otherwise
     */
    public boolean requestAlbumDownload(Integer artistId, Integer albumId) {
        logger.info("Requesting album download for artistId={}, albumId={}", artistId, albumId);
        return lidarrClient.requestAlbumDownload(artistId, albumId);
    }
    
    public List<Album> getAllAlbums() {
        return albumRepository.findAll();
    }
    
    public Optional<Album> getAlbumById(Long id) {
        return albumRepository.findById(id);
    }
    
    public List<LidarrAlbumDto> getAlbumsByArtistId(int artistId) {
        List<LidarrAlbumDto> albums = lidarrClient.getAlbumsByArtistId(artistId);

        return albums;
    }
    
    public List<Album> searchAlbumsByTitle(String title) {
        return albumRepository.findByTitleContainingIgnoreCase(title);
    }
    
    public Album saveAlbum(Album album) {
        return albumRepository.save(album);
    }
    
    public void deleteAlbum(Long id) {
        albumRepository.deleteById(id);
    }

    /**
     * Get the download status of an album from Lidarr
     * @param albumId Album ID in Lidarr
     * @return Map containing status information, or null if not in queue
     */
    public Map<String, Object> getAlbumDownloadStatus(Integer albumId) {
        return lidarrClient.getAlbumDownloadStatus(albumId);
    }
    
    /**
     * Sync albums for an artist from Lidarr to the local database
     * @param artistId Local artist ID
     * @return Number of albums synchronized
     */
    @Transactional
    public int syncAlbumsFromLidarr(Long artistId) {
        Optional<Artist> optionalArtist = artistRepository.findById(artistId);
        if (optionalArtist.isEmpty() || optionalArtist.get().getLidarrId() == null) {
            return 0;
        }
        
        Artist artist = optionalArtist.get();
        List<LidarrAlbumDto> lidarrAlbums = lidarrClient.getAlbumsByArtistId(artist.getLidarrId());
        int count = 0;
        
        for (LidarrAlbumDto lidarrAlbum : lidarrAlbums) {
            // Check if album already exists in our database
            Optional<Album> existingAlbum = albumRepository.findByLidarrAlbumId(lidarrAlbum.getId());
            
            Album album;
            if (existingAlbum.isPresent()) {
                album = existingAlbum.get();
            } else {
                album = new Album();
                album.setLidarrAlbumId(lidarrAlbum.getId());
                album.setArtist(artist);
                count++;
            }
            
            // Update album properties
            album.setTitle(lidarrAlbum.getTitle());
            album.setAlbumType(lidarrAlbum.getAlbumType());
            album.setReleaseDate(lidarrAlbum.getReleaseDateAsLocalDate());
            
            // Get cover image URL
            if (lidarrAlbum.getImages() != null && !lidarrAlbum.getImages().isEmpty()) {
                // Prefer cover art if available, otherwise use first image
                Optional<LidarrAlbumDto.Image> coverArt = lidarrAlbum.getImages().stream()
                        .filter(img -> "cover".equalsIgnoreCase(img.getCoverType()))
                        .findFirst();
                
                album.setCoverImageUrl(coverArt.isPresent() 
                        ? (coverArt.get().getRemoteUrl() != null ? coverArt.get().getRemoteUrl() : coverArt.get().getUrl())
                        : (lidarrAlbum.getImages().get(0).getRemoteUrl() != null ? lidarrAlbum.getImages().get(0).getRemoteUrl() : lidarrAlbum.getImages().get(0).getUrl()));
            }
            // Or use the helper method
            else if (lidarrAlbum.getCoverArt() != null) {
                album.setCoverImageUrl(lidarrAlbum.getCoverArt());
            }
            
            // Process genres
            if (lidarrAlbum.getGenres() != null && !lidarrAlbum.getGenres().isEmpty()) {
                Set<Genre> genres = new HashSet<>();
                
                for (String genreName : lidarrAlbum.getGenres()) {
                    // Find or create the genre
                    Genre genre = genreRepository.findByNameIgnoreCase(genreName)
                            .orElseGet(() -> {
                                Genre newGenre = new Genre();
                                newGenre.setName(genreName);
                                return genreRepository.save(newGenre);
                            });
                    
                    genres.add(genre);
                }
                
                album.setGenres(genres);
            }
            
            // Save the album
            Album savedAlbum = albumRepository.save(album);
            
            // Sync tracks for this album
            syncTracksFromLidarr(savedAlbum, lidarrAlbum.getId());
        }
        
        return count;
    }
    
    /**
     * Sync tracks for an album from Lidarr to the local database
     * @param album Local album entity
     * @param lidarrAlbumId Lidarr album ID
     * @return Number of tracks synchronized
     */
    @Transactional
    public int syncTracksFromLidarr(Album album, Integer lidarrAlbumId) {
        List<LidarrTrackDto> lidarrTracks = lidarrClient.getTracksByAlbumId(lidarrAlbumId);
        int count = 0;
        
        for (LidarrTrackDto lidarrTrack : lidarrTracks) {
            // Check if the track already exists by comparing absolute track number
            Optional<Track> existingTrack = album.getTracks().stream()
                    .filter(t -> lidarrTrack.getAbsoluteTrackNumber() != null && 
                           t.getTrackNumber() == lidarrTrack.getAbsoluteTrackNumber() && 
                           t.getDiscNumber() == (lidarrTrack.getMediumNumber() != null ? lidarrTrack.getMediumNumber() : 1))
                    .findFirst();
            
            Track track;
            if (existingTrack.isPresent()) {
                track = existingTrack.get();
            } else {
                track = new Track();
                count++;
            }
            
            // Update track properties
            track.setTitle(lidarrTrack.getTitle());
            track.setTrackNumber(lidarrTrack.getAbsoluteTrackNumber() != null ? lidarrTrack.getAbsoluteTrackNumber() : 0);
            track.setDiscNumber(lidarrTrack.getMediumNumber() != null ? lidarrTrack.getMediumNumber() : 1);
            track.setDurationInSeconds(lidarrTrack.getDuration() != null ? lidarrTrack.getDuration() / 1000 : 0);
            track.setExplicit(lidarrTrack.getExplicit() != null && lidarrTrack.getExplicit());
            track.setAlbum(album);
            
            // If track has a file in Lidarr, we could set audio URL here
            // For now, we'll just use a dummy URL
            if (lidarrTrack.getHasFile() != null && lidarrTrack.getHasFile()) {
                track.setAudioUrl("/api/tracks/" + track.getId() + "/stream");
            }
            
            // Save the track
            trackRepository.save(track);
        }
        
        return count;
    }
    
    /**
     * Get album details from Lidarr
     * @param lidarrAlbumId Lidarr album ID
     * @return Album details from Lidarr
     */
    public LidarrAlbumDto getAlbumDetailsFromLidarr(Integer lidarrAlbumId) {
        return lidarrClient.getAlbumById(lidarrAlbumId);
    }
    
    /**
     * Get files available for manual import from a specific folder
     * @param folder Path to the folder containing files to import
     * @param albumId Optional album ID to filter files for a specific album
     * @param filterExistingFiles Whether to filter out files already in the library
     * @param replaceExisting Whether to replace existing files
     * @return List of TrackImportDTO objects available for import
     */
    public List<TrackImportDTO> getFilesForManualImport(String folder, Integer albumId, boolean filterExistingFiles, boolean replaceExisting) {
        // Get files from Lidarr client
        List<TrackImportDTO> files = lidarrClient.getFilesForManualImport(folder, albumId, filterExistingFiles, replaceExisting);
        List<TrackImportDTO> filteredFiles = new ArrayList<>();
    
        Optional<Album> repAlbum = albumRepository.findByLidarrAlbumId(albumId);
        if (repAlbum.isPresent() && repAlbum.get().getLidarrAlbumReleaseId() != null) {
            // Get the monitored release ID from the album
            int releaseId = repAlbum.get().getLidarrAlbumReleaseId();
            
            // Filter and modify files
            for (TrackImportDTO file : files) {
                if (  file.getTracks().get(0).getAlbumId().equals(albumId)) {
                    // Add the release ID to the file
                    file.setAlbumReleaseId(releaseId);
                    filteredFiles.add(file);
                }
            }
    
            // Import files with the updated albumReleaseId
            manuallyImportFiles(filteredFiles, "Move",albumId);
            
            return filteredFiles;
        }
        return new ArrayList<>();
    }
    
    /**
     * Manually import files into Lidarr
     * @param files List of TrackImportDTO objects to import
     * @param importMode Import mode (Move, Copy, or Hard Link)
     * @return Result of the import operation
     */
    public Map<String, Object> manuallyImportFiles(List<TrackImportDTO> files, String importMode,int albumId) {
        return lidarrClient.manuallyImportFiles(files, importMode,albumId);
    }
}
