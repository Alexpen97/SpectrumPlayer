package com.example.spotifyapi.controller;

import com.example.spotifyapi.lidarr.dto.LidarrAlbumDto;
import com.example.spotifyapi.model.Album;
import com.example.spotifyapi.service.AlbumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

import com.example.spotifyapi.lidarr.dto.TrackImportDTO;

@RestController
@RequestMapping("/api/albums")
@CrossOrigin(origins = "*")
public class AlbumController {

    private final AlbumService albumService;

    @Autowired
    public AlbumController(AlbumService albumService) {
        this.albumService = albumService;
    }

    @GetMapping
    public ResponseEntity<List<Album>> getAllAlbums() {
        return ResponseEntity.ok(albumService.getAllAlbums());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Album> getAlbumById(@PathVariable Long id) {
        return albumService.getAlbumById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/artist/{artistId}")
    public ResponseEntity<List<LidarrAlbumDto>> getAlbumsByArtistId(@PathVariable("artistId") int artistId) {
        return ResponseEntity.ok(albumService.getAlbumsByArtistId(artistId));
    }
    @GetMapping("/{artistId}/{albumId}")
    public ResponseEntity<LidarrAlbumDto> getAlbumsByArtistId(@PathVariable("artistId") int artistId, @PathVariable("albumId") int albumId) {
        return ResponseEntity.ok(albumService.LoadAlbum(artistId,albumId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Album>> searchAlbumsByTitle(@RequestParam String title) {
        return ResponseEntity.ok(albumService.searchAlbumsByTitle(title));
    }
    
    @PostMapping("/request-download")
    public ResponseEntity<?> requestAlbumDownload(@RequestBody Map<String, Integer> requestBody) {
        Integer artistId = requestBody.get("artistId");
        Integer albumId = requestBody.get("albumId");
        
        if (artistId == null || albumId == null) {
            return ResponseEntity.badRequest().body("Artist ID and Album ID are required");
        }
        
        boolean success = albumService.requestAlbumDownload(artistId, albumId);
        
        if (success) {
            return ResponseEntity.ok().body(Map.of("message", "Album download requested successfully"));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to request album download"));
        }
    }

    @PostMapping
    public ResponseEntity<Album> createAlbum(@RequestBody Album album) {
        Album savedAlbum = albumService.saveAlbum(album);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedAlbum);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Album> updateAlbum(@PathVariable Long id, @RequestBody Album album) {
        return albumService.getAlbumById(id)
                .map(existingAlbum -> {
                    album.setId(id);
                    return ResponseEntity.ok(albumService.saveAlbum(album));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlbum(@PathVariable Long id) {
        return albumService.getAlbumById(id)
                .map(album -> {
                    albumService.deleteAlbum(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/download-status/{albumId}")
    public ResponseEntity<?> getAlbumDownloadStatus(@PathVariable(name = "albumId") Integer albumId) {
        Map<String, Object> status = albumService.getAlbumDownloadStatus(albumId);
        if (status == null) {
            return ResponseEntity.ok(Map.of("status", "not_in_queue"));
        }
        return ResponseEntity.ok(status);
    }

    // Lidarr integration endpoints
    
    @GetMapping("/lidarr/{lidarrAlbumId}")
    public ResponseEntity<LidarrAlbumDto> getAlbumDetailsFromLidarr(@PathVariable Integer lidarrAlbumId) {
        LidarrAlbumDto albumDetails = albumService.getAlbumDetailsFromLidarr(lidarrAlbumId);
        if (albumDetails != null) {
            return ResponseEntity.ok(albumDetails);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/sync/artist/{artistId}")
    public ResponseEntity<String> syncAlbumsForArtist(@PathVariable Long artistId) {
        int count = albumService.syncAlbumsFromLidarr(artistId);
        return ResponseEntity.ok("Synchronized " + count + " albums for artist ID: " + artistId);
    }
    
    /**
     * Get files available for manual import from a specific folder
     * @param requestBody Map containing folder path and import options
     * @return List of files available for import
     */
    @PostMapping("/manual-import/files")
    public ResponseEntity<?> getFilesForManualImport(@RequestBody Map<String, Object> requestBody) {
        String folder = (String) requestBody.get("folder");
        Integer albumId = (Integer) requestBody.get("albumId");
        Boolean filterExistingFiles = (Boolean) requestBody.getOrDefault("filterExistingFiles", false);
        Boolean replaceExisting = (Boolean) requestBody.getOrDefault("replaceExisting", false);
        
        if (folder == null || folder.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Folder path is required"));
        }
        
        List<TrackImportDTO> files = albumService.getFilesForManualImport(folder, albumId, filterExistingFiles, replaceExisting);
        return ResponseEntity.ok(files);
    }
    
    /**
     * Manually import files into Lidarr
     * @param requestBody Map containing files to import and import mode
     * @return Result of the import operation
     */
    @PostMapping("/manual-import")
    public ResponseEntity<?> manuallyImportFiles(@RequestBody Map<String, Object> requestBody) {
        return ResponseEntity.ok(null);
    }
}
