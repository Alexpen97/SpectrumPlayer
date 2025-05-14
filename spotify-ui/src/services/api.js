import axios from 'axios';

// Get API base URL from localStorage or use default
const getApiBaseUrl = () => {
  return localStorage.getItem('apiBaseUrl') || 'http://localhost:8080';
};

// Allow external components to update the API base URL
export const updateApiBaseUrl = (newUrl) => {
  localStorage.setItem('apiBaseUrl', newUrl);
  // Update the axios instance's baseURL
  api.defaults.baseURL = newUrl;
  return newUrl;
};

const API_VERSION = ''; // Add version if needed in the future

// Get user ID from local storage
const getUserId = () => {
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      return user.id;
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  return null;
};

// Generate or retrieve a persistent device identifier (UUID)
const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    // Generate a new UUID (RFC4122 version 4)
    deviceId = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add a request interceptor to ensure content type is set correctly for all requests
api.interceptors.request.use(function (config) {
  // Ensure Content-Type is set for POST and PUT requests
  if (config.method === 'post' || config.method === 'put') {
    config.headers['Content-Type'] = 'application/json';
    
    // Check if data is already a string (to prevent double-stringifying)
    if (config.data && typeof config.data === 'string') {
      try {
        // Try to parse it to see if it's valid JSON
        JSON.parse(config.data);
        // If it's already valid JSON string, don't modify it
      } catch (e) {
        // If it's not valid JSON, stringify it
        config.data = JSON.stringify(config.data);
      }
    }
  }
  
  // Add API key to all requests if it exists
  const apiKey = localStorage.getItem('apiKey');
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }
  
  return config;
}, function (error) {
  return Promise.reject(error);
});

// Track related API calls
export const trackService = {
  getAllTracks: () => api.get('/api/tracks'),
  getTrackById: (id) => api.get(`/api/tracks/${id}`),
  getTracksByAlbumId: (albumId) => api.get(`/api/tracks/album/${albumId}`),
  getTracksByLidarrAlbumId: (albumId) => api.get(`/api/tracks/lidarr/album/${albumId}`),
  getTracksByLidarrParams: (artistId, albumId, albumReleaseId, internalId) => {
    let url = `/api/tracks/album/tracks?artistId=${artistId}&albumId=${albumId}`;
    if (albumReleaseId) {
      url += `&albumReleaseId=${albumReleaseId}`;
    }
    if (internalId) {
      url += `&internalId=${internalId}`;
    }
    return api.get(url);
  },
  searchTracksByTitle: (query) => api.get(`/api/tracks/search/title?query=${query}`),
  searchTracksByArtist: (query) => api.get(`/api/tracks/search/artist?query=${query}`),
  searchTracksByAlbum: (query) => api.get(`/api/tracks/search/album?query=${query}`),
  createTrack: (trackData) => api.post('/api/tracks', trackData),
  updateTrack: (id, trackData) => api.put(`/api/tracks/${id}`, trackData),
  deleteTrack: (id) => api.delete(`/api/tracks/${id}`),
  
  // Get streaming URL for a track
  getStreamUrl: (trackId) => `${API_BASE_URL}/api/stream/track/${trackId}`,
  
  // Get audio metadata
  getAudioMetadata: (trackId) => api.get(`/api/stream/metadata/${trackId}`)
};

// Search service
export const searchService = {
  search: (query) => api.get(`/search?query=${encodeURIComponent(query)}`)
};

export const artistService = {
  loadArtistPage: (name,foreignId) => api.get(`/api/artists/${name}/${foreignId}`),
};

// User service for authentication and user-related operations
export const userService = {
  // Basic login (for already authenticated devices)
  login(username, password) {
    // Always send deviceId
    return api.post('/api/auth/login', {
      username,
      password,
      deviceId: getDeviceId()
    });
  },

  // Request an API key (sends email with key)
  requestApiKey(username, email) {
    return api.post('/api/auth/request-api-key', { username, email });
  },

  // Authenticate a device with username, password and API key
  authenticateDevice(username, password, apiKey, deviceId, deviceName) {
    // Always use persistent deviceId unless explicitly overridden
    return api.post('/api/auth/authenticate-device', {
      username,
      password,
      apiKey,
      deviceId: deviceId || getDeviceId(),
      deviceName
    });
  },

  // Validate device authentication
  validateDevice: (deviceId) => api.get(`/api/auth/validate-device?deviceId=${deviceId}`),
  getRecentlyPlayed: (userId) => api.get(`/api/users/${userId}/recently-played`),
  getRecentlyPlayedTracks: (userId) => api.get(`/api/users/${userId}/recently-played/tracks`),
  getRecentlyPlayedPlaylists: (userId) => api.get(`/api/users/${userId}/recently-played/playlists`),
  getReleaseRadar: (userId) => api.get(`/api/users/${userId}/release-radar`),
  
  addToRecentlyPlayed: (userId, albumId) => api.post(`/api/users/${userId}/recently-played/${albumId}`),
  addToRecentlyPlayedTracks: (userId, trackId) => api.post(`/api/users/${userId}/recently-played/tracks/${trackId}`),
  addToRecentlyPlayedPlaylists: (userId, playlistId) => api.post(`/api/users/${userId}/recently-played/playlists/${playlistId}`),
  
  // Validate the API key stored in localStorage
  validateStoredApiKey() {
    const apiKey = localStorage.getItem('apiKey');
  
    if (!apiKey) {
      console.log('No API key found in localStorage');
      return Promise.resolve(null);
    }
    
    console.log('Validating stored API key...');
    
    // Create a config object to ensure the API key isn't added as a header
    // for this specific validation request (to avoid circular dependency)
    const config = {
      headers: {
        // Don't include X-API-Key header for this specific request
        'Content-Type': 'application/json'
      }
    };
  
    return axios.post(`${API_BASE_URL}/api/auth/validate-key`, { apiKey }, config)
      .then(response => {
        console.log('API key validation response:', response.data);
        if (response.data && response.data.valid) {
          // Store user data in localStorage
          const userData = {
            id: response.data.id,
            username: response.data.username,
            apiKey: apiKey
          };
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('API key validated successfully');
          return userData;
        } else {
          console.log('API key is no longer valid, removing from localStorage');
          // API key is invalid, remove it
          localStorage.removeItem('apiKey');
          return null;
        }
      })
      .catch(error => {
        console.error('Error validating API key:', error);
        console.log('Response status:', error.response?.status);
        console.log('Response data:', error.response?.data);
        
        // Only remove API key if we get an explicit 401 Unauthorized
        if (error.response && error.response.status === 401) {
          console.log('API key unauthorized, removing from localStorage');
          localStorage.removeItem('apiKey');
        } else {
          console.log('Temporary error validating API key, will keep it for now');
        }
        return null;
      });
  },

  // This function has been disabled to enforce secure authentication
  autoLogin: () => {
    console.warn('Auto-login disabled: Authentication required');
    return Promise.resolve(null);
  },
  
  // Check if user is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem('user');
  },
  
  // Get current user
  getCurrentUser: () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    return null;
  },
  
  // Logout
  logout: () => {
    localStorage.removeItem('user');
  }
};
// Here we can add more services for other entities like playlists, users, etc.
export const albumService = {
  loadAlbumsByArtistId: (id) => api.get(`/api/albums/artist/${id}`),
  getAlbumById: (artistId,albumId) => api.get(`/api/albums/${artistId}/${albumId}`),
  requestAlbumDownload: (artistId, albumId) => api.post(`/api/albums/request-download`, { artistId, albumId }),
  getAlbumDownloadStatus: (albumId) => api.get(`/api/albums/download-status/${albumId}`),
  getFilesForManualImport: (folder, albumId, filterExistingFiles = false, replaceExisting = false) => 
    api.post(`/api/albums/manual-import/files`, { folder, albumId, filterExistingFiles, replaceExisting }),
  manuallyImportFiles: (files, importMode = 'Move') => 
    api.post(`/api/albums/manual-import`, { files, importMode }),
  
  // Add album to recently played
  addToRecentlyPlayed: (albumId) => {
    const userId = getUserId();
    if (userId) {
      return api.post(`/api/users/${userId}/recently-played/${albumId}`);
    }
    return Promise.reject('User not logged in');
  },
  
  // Get recently played albums
  getRecentlyPlayed: () => {
    const userId = getUserId();
    if (userId) {
      return api.get(`/api/users/${userId}/recently-played`);
    }
    return Promise.reject('User not logged in');
  }
};

// Recently played track service for track history operations
export const recentlyPlayedTrackService = {
  // Add track to recently played
  addToRecentlyPlayed: (trackId) => {
    const userId = getUserId();
    if (userId) {
      return api.post(`/api/users/${userId}/recently-played/tracks/${trackId}`);
    }
    return Promise.reject('User not logged in');
  },
  
  // Get recently played tracks
  getRecentlyPlayed: () => {
    const userId = getUserId();
    if (userId) {
      return api.get(`/api/users/${userId}/recently-played/tracks`);
    }
    return Promise.reject('User not logged in');
  }
};

// Playlist service for playlist-related operations
export const playlistService = {
  // Get all playlists
  getAllPlaylists: () => api.get('/api/playlists'),
  
  // Get playlist by ID
  getPlaylistById: (id) => api.get(`/api/playlists/${id}`),
  
  // Get playlists by owner username
  getPlaylistsByOwner: (username) => api.get(`/api/playlists/user/${username}`),
  
  // Get public playlists
  getPublicPlaylists: () => api.get('/api/playlists/public'),
  
  // Search playlists by name
  searchPlaylistsByName: (name) => api.get(`/api/playlists/search?name=${encodeURIComponent(name)}`),
  
  // Create a new playlist
  createPlaylist: (playlistData) => {
    // If we're receiving just name and userId, use the new endpoint
    if (typeof playlistData === 'object' && playlistData.name && playlistData.userId) {
      return api.post(`/api/playlists/create?name=${encodeURIComponent(playlistData.name)}&userId=${playlistData.userId}`);
    }
    // Otherwise, use the original endpoint for backward compatibility
    return api.post('/api/playlists', playlistData);
  },
  
  // Update an existing playlist
  updatePlaylist: (id, playlistData) => api.put(`/api/playlists/${id}`, playlistData),
  
  // Delete a playlist
  deletePlaylist: (id) => api.delete(`/api/playlists/${id}`),
  
  // Add a track to a playlist
  addTrackToPlaylist: (playlistId, trackId) => api.post(`/api/playlists/${playlistId}/tracks/${trackId}`),
  
  // Remove a track from a playlist
  removeTrackFromPlaylist: (playlistId, trackId) => api.delete(`/api/playlists/${playlistId}/tracks/${trackId}`),
  
  // Add playlist to recently played
  addToRecentlyPlayed: (playlistId) => {
    const userId = getUserId();
    if (userId) {
      return api.post(`/api/users/${userId}/recently-played/playlists/${playlistId}`);
    }
    return Promise.reject('User not logged in');
  },
  
  // Get recently played playlists
  getRecentlyPlayed: () => {
    const userId = getUserId();
    if (userId) {
      return api.get(`/api/users/${userId}/recently-played/playlists`);
    }
    return Promise.reject('User not logged in');
  }
};

// Library service for managing user's library content
export const libraryService = {
  // Get all liked tracks
  getLikedTracks: () => {
    const userId = getUserId();
    if (userId) {
      return api.get(`/api/users/${userId}/liked/tracks`);
    }
    return Promise.reject('User not logged in');
  },
  
  // Get all liked albums
  getLikedAlbums: () => {
    const userId = getUserId();
    if (userId) {
      return api.get(`/api/users/${userId}/liked/albums`);
    }
    return Promise.reject('User not logged in');
  },
  
  // Get all liked artists
  getLikedArtists: () => {
    const userId = getUserId();
    if (userId) {
      return api.get(`/api/users/${userId}/liked/artists`);
    }
    return Promise.reject('User not logged in');
  },
  
  // Toggle like status for a track
  toggleLikedTrack: (trackId) => {
    const userId = getUserId();
    if (userId) {
      return api.post(`/api/users/${userId}/liked/tracks/${trackId}`);
    }
    return Promise.reject('User not logged in');
  },
  
  // Toggle like status for an album
  toggleLikedAlbum: (albumId) => {
    const userId = getUserId();
    if (userId) {
      return api.post(`/api/users/${userId}/liked/albums/${albumId}`);
    }
    return Promise.reject('User not logged in');
  },
  
  // Toggle like status for an artist
  toggleLikedArtist: (foreignArtistId) => {
    const userId = getUserId();
    if (userId) {
      return api.post(`/api/users/${userId}/liked/artists/${foreignArtistId}`);
    }
    return Promise.reject('User not logged in');
  },
  
  // Check if a track is liked
  isTrackLiked: (trackId) => {
    const userId = getUserId();
    if (userId) {
      return api.get(`/api/users/${userId}/liked/tracks/${trackId}`);
    }
    return Promise.reject('User not logged in');
  },
  
  // Check if an album is liked
  isAlbumLiked: (albumId) => {
    const userId = getUserId();
    if (userId) {
      return api.get(`/api/users/${userId}/liked/albums/${albumId}`);
    }
    return Promise.reject('User not logged in');
  },
  
  // Check if an artist is liked
  isArtistLiked: (foreignArtistId) => {
    const userId = getUserId();
    if (userId) {
      return api.get(`/api/users/${userId}/liked/artists/${foreignArtistId}`);
    }
    return Promise.reject('User not logged in');
  }
};

export default api;
