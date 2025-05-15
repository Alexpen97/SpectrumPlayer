// Import Tauri API modules
const tauriApiFetch = window.__TAURI__ ? window.__TAURI__.http : null;
const tauriFs = window.__TAURI__ ? window.__TAURI__.fs : null;
const tauriPath = window.__TAURI__ ? window.__TAURI__.path : null;

// This file provides a bridge between the existing axios-based API service
// and Tauri's HTTP client, allowing the application to work with both Electron and Tauri

// Check if we're running in a Tauri environment
export const isTauri = () => {
  return window.__TAURI__ !== undefined;
};

// Create a Tauri-compatible API client that mimics the axios interface
export const createTauriApiClient = (baseUrl) => {
  return {
    get: async (url, config = {}) => {
      try {
        console.log(`Making GET request to: ${baseUrl}${url}`);
        
        // Add API key to headers if it exists
        const headers = config.headers || {};
        const apiKey = localStorage.getItem('apiKey');
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }
        
        // Use browser fetch API for all environments for consistency
        const response = await window.fetch(`${baseUrl}${url}`, {
          method: 'GET',
          headers: headers,
          credentials: 'include' // Include cookies for session-based auth
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        
        console.log(`Successful GET response from: ${baseUrl}${url}`, data);
        
        return {
          data: data,
          status: response.status,
          headers: response.headers
        };
      } catch (error) {
        console.error(`Error in GET request to ${baseUrl}${url}:`, error);
        throw error;
      }
    },
    
    post: async (url, data, config = {}) => {
      try {
        console.log(`Making POST request to: ${baseUrl}${url}`, data);
        
        // Add API key to headers if it exists
        const headers = {
          'Content-Type': 'application/json',
          ...config.headers
        };
        
        const apiKey = localStorage.getItem('apiKey');
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }
        
        // Special handling for playlist creation with URL parameters
        let requestBody;
        let finalUrl = `${baseUrl}${url}`;
        
        // Check if this is a playlist creation with URL parameters
        if (url.includes('/api/playlists/create') && url.includes('?')) {
          console.log('Using URL parameters for playlist creation');
          // For requests with URL parameters, don't include a body
          requestBody = null;
        } 
        // Handle regular playlist creation with JSON body
        else if (url === '/api/playlists' && data) {
          console.log('Preparing playlist data for Tauri API:', data);
          // Ensure all required fields are present
          if (!data.name) {
            throw new Error('Playlist name is required');
          }
          
          // Make sure we have a properly formatted playlist object
          requestBody = JSON.stringify({
            name: data.name,
            description: data.description || '',
            coverImageUrl: data.coverImageUrl || 'https://placehold.co/300x300/gray/white?text=Playlist',
            isPublic: data.isPublic !== undefined ? data.isPublic : true,
            ownerUsername: data.ownerUsername || localStorage.getItem('username') || 'user'
          });
        } else {
          // Standard JSON stringification for other requests
          requestBody = JSON.stringify(data);
        }
        
        const response = await window.fetch(finalUrl, {
          method: 'POST',
          headers: headers,
          ...(requestBody && { body: requestBody }),
          credentials: 'include' // Include cookies for session-based auth
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        let responseData;
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
        
        console.log(`Successful POST response from: ${baseUrl}${url}`, responseData);
        
        return {
          data: responseData,
          status: response.status,
          headers: response.headers
        };
      } catch (error) {
        console.error(`Error in POST request to ${baseUrl}${url}:`, error);
        throw error;
      }
    },
    
    put: async (url, data, config = {}) => {
      try {
        console.log(`Making PUT request to: ${baseUrl}${url}`, data);
        
        // Add API key to headers if it exists
        const headers = {
          'Content-Type': 'application/json',
          ...config.headers
        };
        
        const apiKey = localStorage.getItem('apiKey');
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }
        
        const response = await window.fetch(`${baseUrl}${url}`, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify(data),
          credentials: 'include' // Include cookies for session-based auth
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        let responseData;
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
        
        console.log(`Successful PUT response from: ${baseUrl}${url}`, responseData);
        
        return {
          data: responseData,
          status: response.status,
          headers: response.headers
        };
      } catch (error) {
        console.error(`Error in PUT request to ${baseUrl}${url}:`, error);
        throw error;
      }
    },
    
    delete: async (url, config = {}) => {
      try {
        console.log(`Making DELETE request to: ${baseUrl}${url}`);
        
        // Add API key to headers if it exists
        const headers = config.headers || {};
        const apiKey = localStorage.getItem('apiKey');
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }
        
        const response = await window.fetch(`${baseUrl}${url}`, {
          method: 'DELETE',
          headers: headers,
          credentials: 'include' // Include cookies for session-based auth
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        let responseData;
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text() || null;
        }
        
        console.log(`Successful DELETE response from: ${baseUrl}${url}`, responseData);
        
        return {
          data: responseData,
          status: response.status,
          headers: response.headers
        };
      } catch (error) {
        console.error(`Error in DELETE request to ${baseUrl}${url}:`, error);
        throw error;
      }
    },
    
    // Add interceptors property to match axios structure
    interceptors: {
      request: {
        use: () => {} // No-op for compatibility
      },
      response: {
        use: () => {} // No-op for compatibility
      }
    },
    
    // Add defaults property to match axios structure
    defaults: {
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  };
};

// Special handler for audio streaming URLs
export const handleStreamUrl = async (url) => {
  if (!isTauri() || !url) {
    // In non-Tauri environments, return the URL as is
    return url;
  }

  console.log('Handling stream URL in Tauri environment:', url);
  
  try {
    // Add timestamp to prevent caching issues
    const timestampedUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    console.log('Using timestamped URL to prevent caching:', timestampedUrl);
    
    // Add API key to headers if it exists
    const headers = {};
    const apiKey = localStorage.getItem('apiKey');
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    
    // Make a HEAD request to check if the URL is accessible
    try {
      const response = await fetch(timestampedUrl, {
        method: 'HEAD',
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error(`Stream URL check failed: ${response.status} ${response.statusText}`);
      } else {
        console.log('Stream URL is accessible');
      }
    } catch (error) {
      console.warn('Stream URL check failed, but proceeding anyway:', error);
    }
    
    return timestampedUrl;
  } catch (error) {
    console.error('Error handling stream URL:', error);
    return url; // Fall back to original URL if there's an error
  }
};

// Export a function to get the appropriate API client based on environment
export const getApiClient = (baseUrl) => {
  if (isTauri()) {
    console.log('Using Tauri API client with base URL:', baseUrl);
    return createTauriApiClient(baseUrl);
  } else {
    console.log('Using standard API client with base URL:', baseUrl);
    return createTauriApiClient(baseUrl); // Use the same client for consistency
  }
};
