package com.example.spotifyapi.lidarr;

import com.example.spotifyapi.config.LidarrProperties;
import com.example.spotifyapi.lidarr.dto.LidarrAddArtistrequestDto;
import com.example.spotifyapi.lidarr.dto.LidarrAlbumDto;
import com.example.spotifyapi.lidarr.dto.LidarrArtistDto;
import com.example.spotifyapi.lidarr.dto.LidarrTrackDto;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.example.spotifyapi.lidarr.dto.TrackImportDTO;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Client for interacting with Lidarr API
 */
@Service
public class LidarrClient {
    
    private final LidarrProperties lidarrProperties;
    private final RestTemplate lidarrRestTemplate;
    private final Logger logger = LoggerFactory.getLogger(LidarrClient.class);

    @Autowired
    public LidarrClient(LidarrProperties lidarrProperties, RestTemplate lidarrRestTemplate) {
        this.lidarrProperties = lidarrProperties;
        this.lidarrRestTemplate = lidarrRestTemplate;
    }
    
    /**
     * Get all artists from Lidarr
     * @return List of artists
     */
    public List<LidarrArtistDto> getAllArtists() {
        try {
            String url = lidarrProperties.getBaseUrl() + "/artist";
            ResponseEntity<List<LidarrArtistDto>> response = lidarrRestTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<LidarrArtistDto>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            logger.error("Error fetching artists from Lidarr: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
    
    /**
     * Get a specific artist by ID from Lidarr
     * @param artistId Artist ID in Lidarr
     * @return The artist data
     */
    public LidarrArtistDto getArtistById(Integer artistId) {
        try {
            String url = lidarrProperties.getBaseUrl() + "/artist/" + artistId;
            return lidarrRestTemplate.getForObject(url, LidarrArtistDto.class);
        } catch (Exception e) {
            logger.error("Error fetching artist with ID {} from Lidarr: {}", artistId, e.getMessage());
            return null;
        }
    }
    
    /**
     * Get all albums for an artist from Lidarr
     * @param artistId Artist ID in Lidarr
     * @return List of albums for the artist
     */
    public List<LidarrAlbumDto> getAlbumsByArtistId(Integer artistId) {
        try {
            String url = UriComponentsBuilder
                    .fromUriString(lidarrProperties.getBaseUrl() + "/album")
                    .queryParam("artistId", artistId)
                    .build()
                    .toUriString();
            
            ResponseEntity<List<LidarrAlbumDto>> response = lidarrRestTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<LidarrAlbumDto>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            logger.error("Error fetching albums for artist ID {} from Lidarr: {}", artistId, e.getMessage());
            return Collections.emptyList();
        }
    }
    
    /**
     * Get a specific album by ID from Lidarr
     * @param albumId Album ID in Lidarr
     * @return The album data
     */
    public LidarrAlbumDto getAlbumById(Integer albumId) {
        try {
            String url = lidarrProperties.getBaseUrl() + "/album/" + albumId;
            return lidarrRestTemplate.getForObject(url, LidarrAlbumDto.class);
        } catch (Exception e) {
            logger.error("Error fetching album with ID {} from Lidarr: {}", albumId, e.getMessage());
            return null;
        }
    }
    
    /**
     * Get tracks for an album from Lidarr
     * @param artistId Artist ID in Lidarr
     * @param albumId Album ID in Lidarr
     * @param albumReleaseId Album Release ID in Lidarr (optional)
     * @return List of tracks for the album
     */
    public List<LidarrTrackDto> getTracksByAlbumId(Integer artistId, Integer albumId, Integer albumReleaseId) {
        try {
            UriComponentsBuilder builder = UriComponentsBuilder
                    .fromUriString(lidarrProperties.getBaseUrl() + "/track");
            
            // Add artistId if provided
            if (artistId != null) {
                builder.queryParam("artistId", artistId);
            }
            
            // Always add albumId as it's required
            builder.queryParam("albumId", albumId);
            
            // Add albumReleaseId if provided
            if (albumReleaseId != null) {
                builder.queryParam("albumReleaseId", albumReleaseId);
            }
            
            String url = builder.build().toUriString();
            logger.info("Fetching tracks from URL: {}", url);
            
            ResponseEntity<List<LidarrTrackDto>> response = lidarrRestTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<LidarrTrackDto>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            logger.error("Error fetching tracks for artist ID {}, album ID {} from Lidarr: {}", artistId, albumId, e.getMessage());
            return Collections.emptyList();
        }
    }
    
    /**
     * Get tracks for an album from Lidarr (legacy method)
     * @param albumId Album ID in Lidarr
     * @return List of tracks for the album
     */
    public List<LidarrTrackDto> getTracksByAlbumId(Integer albumId) {
        logger.warn("Using legacy getTracksByAlbumId method with only albumId parameter. This may not work correctly.");
        try {
            String url = UriComponentsBuilder
                    .fromUriString(lidarrProperties.getBaseUrl() + "/track")
                    .queryParam("albumId", albumId)
                    .build()
                    .toUriString();
            
            ResponseEntity<List<LidarrTrackDto>> response = lidarrRestTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<LidarrTrackDto>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            logger.error("Error fetching tracks for album ID {} from Lidarr: {}", albumId, e.getMessage());
            return Collections.emptyList();
        }
    }
    
    /**
     * Search for artists in Lidarr
     * @param term Search term
     * @return List of artists matching the search term
     */
    public List<LidarrArtistDto> searchArtists(String term) {
        try {
            String url = UriComponentsBuilder
                    .fromUriString(lidarrProperties.getBaseUrl() + "/artist/lookup")
                    .queryParam("term", term)
                    .build()
                    .toUriString();
            
            ResponseEntity<List<LidarrArtistDto>> response = lidarrRestTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<LidarrArtistDto>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            logger.error("Error searching for artists with term '{}' in Lidarr: {}", term, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Create headers with API key for Lidarr requests
     * @return HttpHeaders with API key
     */
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Api-Key", lidarrProperties.getApiKey());
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
    
    /**
     * Request an album download from Lidarr by setting the monitored flag to true
     * @param artistId Artist ID in Lidarr
     * @param albumId Album ID in Lidarr
     * @return true if the request was successful, false otherwise
     */
    public boolean requestAlbumDownload(Integer artistId, Integer albumId) {
        logger.info("Requesting download for album ID {} from Lidarr by setting monitored flag", albumId);
        
        try {
            // First, get the album from Lidarr
            String albumUrl = lidarrProperties.getBaseUrl() + "/album/" + albumId;
            ResponseEntity<LidarrAlbumDto> albumResponse = lidarrRestTemplate.exchange(
                    albumUrl,
                    HttpMethod.GET,
                    new HttpEntity<>(createHeaders()),
                    LidarrAlbumDto.class
            );

            if (!albumResponse.getStatusCode().is2xxSuccessful() || albumResponse.getBody() == null) {
                logger.error("Failed to get album from Lidarr, status: {}", albumResponse.getStatusCode());
                return false;
            }
            
            // Get the album and set monitored to true
            LidarrAlbumDto album = albumResponse.getBody();
            if (album == null) {
                logger.error("Album response body is null");
                return false;
            }
            
            // Set monitored to true
            album.setMonitored(true);
            
            // Set artist to null to avoid DateTime serialization issues
            // The API doesn't need the full artist object for updates
            album.setArtist(null);
            
            // Update the album in Lidarr
            ResponseEntity<LidarrAlbumDto> updateResponse = lidarrRestTemplate.exchange(
                    albumUrl,
                    HttpMethod.PUT,
                    new HttpEntity<>(album, createHeaders()),
                    LidarrAlbumDto.class
            );

            if (!updateResponse.getStatusCode().is2xxSuccessful()) {
                logger.error("Failed to update album monitored status in Lidarr, status: {}", updateResponse.getStatusCode());
                return false;
            }
            
            // Trigger a search for the album to start the download
            String searchUrl = lidarrProperties.getBaseUrl() + "/command";
            Map<String, Object> searchRequest = new HashMap<>();
            searchRequest.put("name", "AlbumSearch");
            Map<String, Object> searchOptions = new HashMap<>();
            searchOptions.put("albumIds", new Integer[]{albumId});
            searchRequest.put("albumIds", new Integer[]{albumId});
            
            ResponseEntity<Void> searchResponse = lidarrRestTemplate.exchange(
                    searchUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(searchRequest, createHeaders()),
                    Void.class
            );
            
            if (!searchResponse.getStatusCode().is2xxSuccessful()) {
                logger.error("Failed to trigger album search in Lidarr, status: {}", searchResponse.getStatusCode());
                // We still return true because the monitored status was updated successfully
                logger.info("Album is now monitored, but search command failed");
            }

            return true;
        } catch (Exception e) {
            logger.error("Error requesting album download from Lidarr: {}", e.getMessage());
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            logger.error("Stack trace: {}", sw.toString());
            return false;
        }
    }

    public List<LidarrArtistDto> getArtistForForeignId(String foreignId) {
        try {
            String url = lidarrProperties.getBaseUrl() + "/artist?mbId=" + foreignId;
            ResponseEntity<List<LidarrArtistDto>> response = lidarrRestTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<LidarrArtistDto>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            logger.error("Error fetching artist with foreign ID {} from Lidarr: {}", foreignId, e.getMessage());
            return Collections.emptyList();
        }
    }

    public LidarrArtistDto addArtistToLidarr(LidarrAddArtistrequestDto lidarrAddArtistrequestDto) {
        try {
            String url = lidarrProperties.getBaseUrl() + "/artist";
            ResponseEntity<LidarrArtistDto> response = lidarrRestTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(lidarrAddArtistrequestDto),
                    LidarrArtistDto.class
            );
            return response.getBody();
        } catch (Exception e) {
            logger.error("Error adding artist to Lidarr: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Get the download status of an album from Lidarr's queue
     * @param albumId Album ID in Lidarr
     * @return Map containing status information, or null if not in queue
     */
    public Map<String, Object> getAlbumDownloadStatus(Integer albumId) {
        try {
            logger.info("Checking download status for album ID: {}", albumId);
            
            // Use the queue/details endpoint with albumIds parameter
            String queueUrl = lidarrProperties.getBaseUrl() + "/queue/details?albumIds=" + albumId + "&includeArtist=false&includeAlbum=true";
            
            // Get the queue details
            ResponseEntity<Object> queueResponse = lidarrRestTemplate.exchange(
                    queueUrl,
                    HttpMethod.GET,
                    new HttpEntity<>(createHeaders()),
                    Object.class
            );
            
            if (!queueResponse.getStatusCode().is2xxSuccessful() || queueResponse.getBody() == null) {
                logger.error("Failed to get queue details from Lidarr, status: {}", queueResponse.getStatusCode());
                Map<String, Object> errorStatus = new HashMap<>();
                errorStatus.put("status", "error");
                errorStatus.put("errorMessage", "Failed to get queue details from Lidarr");
                return errorStatus;
            }
            
            // Process the response
            Object responseBody = queueResponse.getBody();
            if (responseBody instanceof List) {
                List<?> queueItems = (List<?>) responseBody;
                
                if (!queueItems.isEmpty()) {
                    // Found the album in the queue
                    for (Object item : queueItems) {
                        if (item instanceof Map) {
                            Map<?, ?> queueItem = (Map<?, ?>) item;
                            
                            // Extract the status information
                            Map<String, Object> status = new HashMap<>();
                            
                            // Get the status (downloading, completed, etc.)
                            Object statusObj = queueItem.get("status");
                            status.put("status", statusObj != null ? statusObj.toString() : "unknown");
                            
                            // Get the progress information
                            Object sizeObj = queueItem.get("size");
                            Object sizeLeftObj = queueItem.get("sizeleft");
                            
                            if (sizeObj instanceof Number && sizeLeftObj instanceof Number) {
                                double size = ((Number) sizeObj).doubleValue();
                                double sizeLeft = ((Number) sizeLeftObj).doubleValue();
                                
                                if (size > 0) {
                                    double progress = 100 * (size - sizeLeft) / size;
                                    status.put("progress", progress);
                                } else {
                                    status.put("progress", 0.0);
                                }
                            } else {
                                status.put("progress", 0.0);
                            }
                            
                            // Get any error messages
                            Object statusMessagesObj = queueItem.get("statusMessages");
                            if (statusMessagesObj instanceof List && !((List<?>) statusMessagesObj).isEmpty()) {
                                List<?> statusMessages = (List<?>) statusMessagesObj;
                                StringBuilder errorMessage = new StringBuilder();
                                
                                for (Object msgObj : statusMessages) {
                                    if (msgObj instanceof Map) {
                                        Map<?, ?> msg = (Map<?, ?>) msgObj;
                                        Object title = msg.get("title");
                                        if (title != null) {
                                            if (errorMessage.length() > 0) {
                                                errorMessage.append("; ");
                                            }
                                            errorMessage.append(title);
                                        }
                                    }
                                }
                                
                                if (errorMessage.length() > 0) {
                                    status.put("errorMessage", errorMessage.toString());
                                }
                            }
                            
                            // Include the estimated completion time if available
                            Object estimatedCompletionTimeObj = queueItem.get("estimatedCompletionTime");
                            if (estimatedCompletionTimeObj != null) {
                                status.put("estimatedCompletionTime", estimatedCompletionTimeObj.toString());
                            }
                            
                            return status;
                        }
                    }
                }
            }
            
            // If we get here, the album is not in the queue
            Map<String, Object> notInQueueStatus = new HashMap<>();
            notInQueueStatus.put("status", "not_in_queue");
            return notInQueueStatus;
            
        } catch (Exception e) {
            logger.error("Error checking download status for album ID {} from Lidarr: {}", albumId, e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorStatus = new HashMap<>();
            errorStatus.put("status", "error");
            errorStatus.put("errorMessage", e.getMessage());
            return errorStatus;
        }
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
        try {
            logger.info("Getting files for manual import from folder: {} for albumId: {}", folder, albumId);
            
            UriComponentsBuilder builder = UriComponentsBuilder
                    .fromUriString(lidarrProperties.getBaseUrl() + "/manualimport")
                    .queryParam("folder", folder)
                    .queryParam("filterExistingFiles", filterExistingFiles)
                    .queryParam("replaceExisting", replaceExisting);
            
            String url = builder.build().toUriString();
            
            ResponseEntity<List<TrackImportDTO>> response = lidarrRestTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(createHeaders()),
                    new ParameterizedTypeReference<List<TrackImportDTO>>() {}
            );
            
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                logger.error("Failed to get files for manual import, status: {}", response.getStatusCode());
                return Collections.emptyList();
            }
            
            return response.getBody();
        } catch (Exception e) {
            logger.error("Error getting files for manual import: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
    
    /**
     * Manually import files into Lidarr
     * @param files List of TrackImportDTO objects to import
     * @param importMode Import mode (Move, Copy, or Hard Link)
     * @return Result of the import operation
     */
    public Map<String, Object> manuallyImportFiles(List<TrackImportDTO> files, String importMode,int albumId) {
        try {
            if (files.isEmpty()) {
                return Map.of("success", false, "message", "No files to import");
            }
            
            // Group files by album ID with simpler approach
            Map<Integer, String> foldersByAlbum = new HashMap<>();
            for (TrackImportDTO file : files) {
                String path = file.getPath();
                int lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
                String folder = lastSlash > 0 ? path.substring(0, lastSlash) : path;
                
                // Only add the first folder we find for each album
                foldersByAlbum.putIfAbsent(albumId, folder);
            }
            
            List<Map<String, Object>> results = new ArrayList<>();
            
            // Send import command for each album
            for (Map.Entry<Integer, String> entry : foldersByAlbum.entrySet()) {
                Map<String, Object> command = new HashMap<>();
                command.put("name", "ImportAlbum");
                command.put("albumId", entry.getKey());
                command.put("path", entry.getValue());
                command.put("importMode", importMode);
                command.put("folderImport", true);
                
                ResponseEntity<Map> response = lidarrRestTemplate.exchange(
                    lidarrProperties.getBaseUrl() + "/command",
                    HttpMethod.POST,
                    new HttpEntity<>(command, createHeaders()),
                    Map.class
                );
                
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    results.add(response.getBody());
                }
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("results", results);
            result.put("message", "Import commands sent for " + results.size() + " albums");
            return result;
        } catch (Exception e) {
            logger.error("Import command error", e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", e.getMessage());
            return errorResult;
        }
    }
}
