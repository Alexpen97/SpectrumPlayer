import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { albumService, trackService } from '../services/api';
import '../styles/Album.css';
import PlayButton from '../components/PlayButton';
import TrackList from '../components/TrackList';
import DownloadStatus from '../components/DownloadStatus';
import LikeButton from '../components/LikeButton';
import ColorThief from 'colorthief';

const Album = () => {
  const { artistId, albumId } = useParams();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [error, setError] = useState(null);
  const [trackError, setTrackError] = useState(null);
  const [themeColor, setThemeColor] = useState('rgb(18, 28, 66)'); // Start with a nice dark blue
  
  // Load album data
  useEffect(() => {
    let isMounted = true;
    
    if (albumId && artistId) {
      setIsLoading(true);
      console.log(`Loading album data for ID: ${albumId} from artist ID: ${artistId}`);
      
      albumService.getAlbumById(artistId, albumId)
        .then(response => {
          if (isMounted) {
            console.log('Album data:', response.data);
            setAlbum(response.data);
            setIsLoading(false);
            
            // Add album to recently played
            if (response.data.id) {
              albumService.addToRecentlyPlayed(response.data.id)
                .then(() => {
                  console.log('Added album to recently played');
                })
                .catch(error => {
                  console.error('Failed to add album to recently played:', error);
                });
            }
          }
        })
        .catch(error => {
          if (isMounted) {
            console.error('Error loading album data:', error);
            console.error('Error details:', error.response ? error.response.data : 'No response data');
            setError('Failed to load album data. Please try again later.');
            setIsLoading(false);
          }
        });
    }
    
    return () => {
      isMounted = false;
    };
  }, [albumId, artistId]);
  
  // Effect to set theme color based on album cover image
  useEffect(() => {
    if (!album || isLoading) return;
    
    let isMounted = true;
    
    // Extract dominant color from album cover and create gradient to black
    const extractColorFromCover = () => {
      return new Promise((resolve, reject) => {
        // Default fallback color
        const fallbackColor = 'rgb(20, 40, 80)';
        
        if (!album.coverArt) {
          console.log('No cover art available, using fallback color');
          resolve(fallbackColor);
          return;
        }
        
        // Create a canvas element to draw the image
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const img = new Image();
        
        // Set crossOrigin to allow loading from different domains
        img.crossOrigin = 'Anonymous';
        
        img.onload = () => {
          try {
            // Set canvas dimensions to match image
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image to canvas
            context.drawImage(img, 0, 0);
            
            // Use ColorThief to extract the dominant color
            const colorThief = new ColorThief();
            let dominantColor;
            
            try {
              // Try to get color directly from image
              dominantColor = colorThief.getColor(img);
            } catch (e) {
              console.log('Trying to get color from canvas instead of image');
              // If that fails, try to get color from canvas
              dominantColor = colorThief.getColor(canvas);
            }
            
            const [r, g, b] = dominantColor;
            
            // Create RGB color string
            const colorString = `rgb(${r}, ${g}, ${b})`;
            console.log('Successfully extracted dominant color:', colorString);
            resolve(colorString);
          } catch (error) {
            console.error('Error extracting color from image:', error);
            resolve(fallbackColor);
          }
        };
        
        img.onerror = (e) => {
          console.error('Error loading album cover image:', e);
          resolve(fallbackColor);
        };
        
        // Clean URL and add timestamp to bypass cache
        const coverUrl = album.coverArt.trim();
        img.src = `${coverUrl}?t=${new Date().getTime()}`;
        
        // Set a timeout in case the image loading hangs
        setTimeout(() => {
          if (!img.complete) {
            console.log('Image loading timed out, using fallback color');
            resolve(fallbackColor);
          }
        }, 3000); // 3 second timeout
      });
    };
    
    // Apply the color as a gradient from the extracted color to black
    const applyColorGradient = (color) => {
      // Create a gradient from the extracted color to black
      const gradient = `linear-gradient(to bottom, ${color}, rgb(0, 0, 0))`;
      console.log('Setting album theme gradient:', gradient);
      
      // Store the base color for other uses
      setThemeColor(color);
      
      // Apply the gradient as a CSS variable
      document.documentElement.style.setProperty('--album-color', color);
      document.documentElement.style.setProperty('--album-gradient', gradient);
    };
    
    // Extract color and apply gradient
    extractColorFromCover()
      .then(color => {
        if (isMounted) {
          applyColorGradient(color);
        }
      })
      .catch(error => {
        console.error('Failed to process album color:', error);
        if (isMounted) {
          // Fallback to a default color
          applyColorGradient('rgb(20, 40, 80)');
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, [album, isLoading]);

  // Load tracks in a separate useEffect that depends on album
  useEffect(() => {
    if (!album) return;
    
    let isMounted = true;
    const albumIdToUse = album.id || albumId;
    const internalID = album.internalID;
    const lidarrArtistId = album.artist.id;
    
    setIsLoadingTracks(true);
    console.log(`Loading tracks for album ID: ${albumIdToUse}`);
    
    // Extract albumReleaseId if available in the album data
    const albumReleaseId = album.albumReleaseId || null;
    
    if (artistId && albumIdToUse) {
      console.log(`Fetching tracks with artistId: ${artistId}, albumId: ${albumIdToUse}, albumReleaseId: ${albumReleaseId || 'not provided'}`);
      
      trackService.getTracksByLidarrParams(lidarrArtistId, parseInt(albumIdToUse), albumReleaseId, internalID)
        .then(response => {
          if (isMounted) {
            console.log('Tracks data:', response.data);
            setTracks(response.data);
            setIsLoadingTracks(false);
          }
        })
        .catch(error => {
          if (!isMounted) return;
          
          console.error('Error loading tracks with full parameters:', error);
          
          // Try the legacy endpoint as first fallback
          console.log('Trying legacy endpoint with only albumId...');
          trackService.getTracksByLidarrAlbumId(parseInt(albumIdToUse))
            .then(legacyResponse => {
              if (isMounted) {
                console.log('Legacy tracks data:', legacyResponse.data);
                setTracks(legacyResponse.data);
                setIsLoadingTracks(false);
              }
            })
            .catch(legacyError => {
              if (!isMounted) return;
              
              console.error('Error loading tracks from legacy endpoint:', legacyError);
              
              // Try the local database as final fallback
              trackService.getTracksByAlbumId(albumIdToUse)
                .then(fallbackResponse => {
                  if (isMounted) {
                    console.log('Fallback tracks data:', fallbackResponse.data);
                    setTracks(fallbackResponse.data);
                    setIsLoadingTracks(false);
                  }
                })
                .catch(fallbackError => {
                  if (isMounted) {
                    console.error('Error loading tracks from all sources:', fallbackError);
                    setTrackError('Failed to load tracks. Please try again later.');
                    setIsLoadingTracks(false);
                  }
                });
            });
        });
    } else {
      // Missing data, try legacy method
      trackService.getTracksByAlbumId(albumIdToUse)
        .then(response => {
          if (isMounted) {
            console.log('Tracks data from local db:', response.data);
            setTracks(response.data);
            setIsLoadingTracks(false);
          }
        })
        .catch(error => {
          if (isMounted) {
            console.error('Error loading tracks:', error);
            setTrackError('Failed to load tracks. Please try again later.');
            setIsLoadingTracks(false);
          }
        });
    }
    
    return () => {
      isMounted = false;
    };
  }, [album, albumId, artistId]);

  if (isLoading) {
    return (
      <div className="album-page" style={{ 
        background: `linear-gradient(to bottom, ${themeColor} 0%, rgba(18, 18, 18, 0.8) 50%, #000000 100%)` 
      }}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading album...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="not-found-container">
        <h2>Album Not Found</h2>
        <p>The album you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="back-link">Back to Home</Link>
      </div>
    );
  }

  // Extract album details
  const { 
    title, 
    releaseDate,
    albumType,
    artist,
    images,
    genres,
    tracks: albumTracks
  } = album;

  // Format release date
  const formattedReleaseDate = releaseDate ? new Date(releaseDate.split('T')[0]).getFullYear() : '';
  
  // Get cover image URL
  const coverImageUrl = images && images.length > 0 && images[0].remoteUrl 
    ? images[0].remoteUrl 
    : 'https://via.placeholder.com/300';

  // Get artist name
  const artistName = artist ? artist.artistName : 'Unknown Artist';
  const albumArtistId = artist ? artist.id : null;

  return (
    <div className="album-page" style={{ 
      background: `linear-gradient(180deg, ${themeColor} 0%, rgba(18, 18, 18, 0.8) 50%, #000000 100%)`,
      '--theme-color': themeColor 
    }}>
      <div className="album-header">
        <div className="album-cover">
          <img src={coverImageUrl} alt={title} />
        </div>
        <div className="album-header-content">
          <div className="album-type">{albumType || 'Album'}</div>
          <h1 className="album-title">{title}</h1>
          <div className="album-meta">
            {albumArtistId ? (
              <Link to={`/artist/${artist.foreignArtistId}`} className="artist-link">{artistName}</Link>
            ) : (
              <span>{artistName}</span>
            )}
            {formattedReleaseDate && <span> • {formattedReleaseDate}</span>}
            {tracks.length > 0 ? (
              <span> • {tracks.length} songs</span>
            ) : albumTracks && albumTracks.length > 0 ? (
              <span> • {albumTracks.length} songs</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="album-content">
        <div className="album-actions">
          <PlayButton size="large" />
          <LikeButton 
            type="album" 
            id={album.lidarrAlbumId} 
            className="large" 
          />
        </div>

   
        <DownloadStatus albumId={albumId} artistId={artistId} />

        {isLoadingTracks ? (
          <div className="loading-tracks">
            <div className="loading-spinner"></div>
            <p>Loading tracks...</p>
          </div>
        ) : trackError ? (
          <div className="track-error">
            <p>{trackError}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        ) : tracks && tracks.length > 0 ? (
          <TrackList tracks={tracks} albumImage={coverImageUrl} albumName={title} artistName={artistName} />
        ) : albumTracks && albumTracks.length > 0 ? (
          <TrackList tracks={albumTracks} albumImage={coverImageUrl} albumName={title} artistName={artistName} />
        ) : (
          <div className="no-tracks">
            <p>No tracks available for this album.</p>
          </div>
        )}

        {genres && genres.length > 0 && (
          <div className="album-genres">
            <h3>Genres</h3>
            <div className="genre-tags">
              {genres.map((genre, index) => (
                <span key={index} className="genre-tag">{genre}</span>
              ))}
            </div>
          </div>
        )}

        {album.overview && (
          <div className="album-about">
            <h3>About</h3>
            <p>{album.overview}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Album;