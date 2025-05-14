
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Library.css';
import { albumService, userService, recentlyPlayedTrackService, playlistService, libraryService } from '../services/api';
import LikedSongs from '../components/LikedSongs';

function Library() {
  const [activeTab, setActiveTab] = useState('playlists');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // State for library content
  const [playlists, setPlaylists] = useState([]);
  const [recentlyPlayedPlaylists, setRecentlyPlayedPlaylists] = useState([]);
  const [artists, setArtists] = useState([]);
  const [likedArtists, setLikedArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [likedAlbums, setLikedAlbums] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [likedTracks, setLikedTracks] = useState([]);
  const [recentlyPlayedTracks, setRecentlyPlayedTracks] = useState([]);
  
  // Auto-login and load user data
  useEffect(() => {
    if (!userService.isLoggedIn()) {
      userService.autoLogin()
        .then(userData => {
          if (userData) {
            setUser(userData);
            console.log('Auto-login successful:', userData);
          }
        })
        .catch(error => {
          console.error('Auto-login failed:', error);
        });
    } else {
      setUser(userService.getCurrentUser());
    }
  }, []);
  
  // Load library content when user is set
  useEffect(() => {
    if (user) {
      setLoading(true);
      
      // Load recently played albums
      albumService.getRecentlyPlayed()
        .then(response => {
          if (response.data) {
            setAlbums(response.data);
            console.log('Recently played albums:', response.data);
          }
        })
        .catch(error => {
          console.error('Error fetching recently played albums:', error);
        });
      
      // Load recently played tracks
      recentlyPlayedTrackService.getRecentlyPlayed()
        .then(response => {
          if (response.data) {
            setRecentlyPlayedTracks(response.data);
            console.log('Recently played tracks:', response.data);
          }
        })
        .catch(error => {
          console.error('Error fetching recently played tracks:', error);
        });
      
      // Load recently played playlists
      playlistService.getRecentlyPlayed()
        .then(response => {
          if (response.data) {
            setRecentlyPlayedPlaylists(response.data);
            console.log('Recently played playlists:', response.data);
          }
        })
        .catch(error => {
          console.error('Error fetching recently played playlists:', error);
        });
      
      // Load liked tracks
      libraryService.getLikedTracks()
        .then(response => {
          if (response.data) {
            setLikedTracks(response.data);
            console.log('Liked tracks:', response.data);
          }
        })
        .catch(error => {
          console.error('Error fetching liked tracks:', error);
        });
      
      // Load liked albums
      libraryService.getLikedAlbums()
        .then(response => {
          if (response.data) {
            setLikedAlbums(response.data);
            console.log('Liked albums:', response.data);
          }
        })
        .catch(error => {
          console.error('Error fetching liked albums:', error);
        });
      
      // Load liked artists
      libraryService.getLikedArtists()
        .then(response => {
          if (response.data) {
            setLikedArtists(response.data);
            console.log('Liked artists:', response.data);
          }
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching liked artists:', error);
          setLoading(false);
        });
    }
  }, [user]);
  
  // Toggle like status for a track
  const handleToggleLikeTrack = (trackId) => {
    libraryService.toggleLikedTrack(trackId)
      .then(response => {
        console.log('Toggle like track response:', response.data);
        // Refresh liked tracks
        libraryService.getLikedTracks()
          .then(response => {
            if (response.data) {
              setLikedTracks(response.data);
            }
          });
      })
      .catch(error => {
        console.error('Error toggling like for track:', error);
      });
  };
  
  // Toggle like status for an album
  const handleToggleLikeAlbum = (albumId) => {
    libraryService.toggleLikedAlbum(albumId)
      .then(response => {
        console.log('Toggle like album response:', response.data);
        // Refresh liked albums
        libraryService.getLikedAlbums()
          .then(response => {
            if (response.data) {
              setLikedAlbums(response.data);
            }
          });
      })
      .catch(error => {
        console.error('Error toggling like for album:', error);
      });
  };
  
  // Toggle like status for an artist
  const handleToggleLikeArtist = (artistId) => {
    libraryService.toggleLikedArtist(artistId)
      .then(response => {
        console.log('Toggle like artist response:', response.data);
        // Refresh liked artists
        libraryService.getLikedArtists()
          .then(response => {
            if (response.data) {
              setLikedArtists(response.data);
            }
          });
      })
      .catch(error => {
        console.error('Error toggling like for artist:', error);
      });
  };

  return (
    <div className="library">
      <div className="library-header">
        <h1>Your Library</h1>
        <div className="library-controls">
          <button className="create-btn">
            <span className="icon">+</span>
            <span>Create playlist</span>
          </button>
        </div>
      </div>
      
      <div className="library-tabs">
        <button 
          className={activeTab === 'playlists' ? 'active' : ''} 
          onClick={() => setActiveTab('playlists')}
        >
          Playlists
        </button>
        <button 
          className={activeTab === 'artists' ? 'active' : ''} 
          onClick={() => setActiveTab('artists')}
        >
          Artists
        </button>
        <button 
          className={activeTab === 'albums' ? 'active' : ''} 
          onClick={() => setActiveTab('albums')}
        >
          Albums
        </button>
        <button 
          className={activeTab === 'tracks' ? 'active' : ''} 
          onClick={() => setActiveTab('tracks')}
        >
          Tracks
        </button>
        <button 
          className={activeTab === 'recent' ? 'active' : ''} 
          onClick={() => setActiveTab('recent')}
        >
          Recently Played
        </button>
      </div>
      
      <div className="library-content">
        {loading ? (
          <div className="loading">Loading your library...</div>
        ) : (
          <>
            {activeTab === 'playlists' && (
              <div className="playlists-list">
                <h2>Your Playlists</h2>
                <div className="list-header">
                  <div className="list-col-title"># Title</div>
                  <div className="list-col-owner">Owner</div>
                  <div className="list-col-tracks">Tracks</div>
                </div>
                <div className="list-items">
                  {recentlyPlayedPlaylists.length > 0 ? (
                    recentlyPlayedPlaylists.map((playlist, index) => (
                      <Link to={`/playlist/${playlist.id}`} key={playlist.id} className="list-item">
                        <div className="list-col-title">
                          <span className="item-number">{index + 1}</span>
                          <img src={playlist.imageUrl || 'https://via.placeholder.com/60'} alt={playlist.name} />
                          <span className="item-name">{playlist.name}</span>
                        </div>
                        <div className="list-col-owner">{playlist.user ? playlist.user.username : 'You'}</div>
                        <div className="list-col-tracks">{playlist.tracks ? playlist.tracks.length : 0} songs</div>
                      </Link>
                    ))
                  ) : (
                    <div className="empty-state">No playlists yet. Create your first playlist!</div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'artists' && (
              <div className="artists-list">
                <h2>Liked Artists</h2>
                <div className="list-header">
                  <div className="list-col-title"># Artist</div>
                  <div className="list-col-action">Action</div>
                </div>
                <div className="list-items">
                  {likedArtists.length > 0 ? (
                    likedArtists.map((artist, index) => (
                      <div key={artist.id} className="list-item">
                        <div className="list-col-title">
                          <span className="item-number">{index + 1}</span>
                          <img src={artist.imageUrl || 'https://via.placeholder.com/60'} alt={artist.name} className="artist-img" />
                          <span className="item-name">{artist.name}</span>
                        </div>
                        <div className="list-col-action">
                          <button 
                            className="like-btn active" 
                            onClick={() => handleToggleLikeArtist(artist.foreignId)}
                          >
                            ♥
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No liked artists yet. Start liking some artists!</div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'albums' && (
              <div className="albums-list">
                <h2>Liked Albums</h2>
                <div className="list-header">
                  <div className="list-col-title"># Album</div>
                  <div className="list-col-artist">Artist</div>
                  <div className="list-col-action">Action</div>
                </div>
                <div className="list-items">
                  {likedAlbums.length > 0 ? (
                    likedAlbums.map((album, index) => (
                      <div key={album.id} className="list-item">
                        <div className="list-col-title">
                          <span className="item-number">{index + 1}</span>
                          <img src={album.imageUrl || 'https://via.placeholder.com/60'} alt={album.title} />
                          <span className="item-name">{album.title}</span>
                        </div>
                        <div className="list-col-artist">{album.artist ? album.artist.name : 'Unknown'}</div>
                        <div className="list-col-action">
                          <button 
                            className="like-btn active" 
                            onClick={() => handleToggleLikeAlbum(album.lidarrAlbumId)}
                          >
                            ♥
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No liked albums yet. Start liking some albums!</div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'tracks' && (
              <div className="tracks-section">
                <div className="section-header">
                  <h2>Liked Tracks</h2>
                  <Link to="/collection/tracks" className="view-all-link">
                    View all
                  </Link>
                </div>
                <LikedSongs />
              </div>
            )}
            
            {activeTab === 'recent' && (
              <div className="recent-content">
                <div className="recent-section">
                  <h2>Recently Played Tracks</h2>
                  <div className="list-header">
                    <div className="list-col-title"># Title</div>
                    <div className="list-col-artist">Artist</div>
                    <div className="list-col-album">Album</div>
                  </div>
                  <div className="list-items">
                    {recentlyPlayedTracks.length > 0 ? (
                      recentlyPlayedTracks.map((track, index) => (
                        <div key={track.id} className="list-item">
                          <div className="list-col-title">
                            <span className="item-number">{index + 1}</span>
                            <span className="item-name">{track.title}</span>
                          </div>
                          <div className="list-col-artist">{track.artist ? track.artist.name : 'Unknown'}</div>
                          <div className="list-col-album">{track.album ? track.album.title : 'Unknown'}</div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">No recently played tracks yet.</div>
                    )}
                  </div>
                </div>
                
                <div className="recent-section">
                  <h2>Recently Played Albums</h2>
                  <div className="list-header">
                    <div className="list-col-title"># Album</div>
                    <div className="list-col-artist">Artist</div>
                  </div>
                  <div className="list-items">
                    {albums.length > 0 ? (
                      albums.map((album, index) => (
                        <div key={album.id} className="list-item">
                          <div className="list-col-title">
                            <span className="item-number">{index + 1}</span>
                            <img src={album.imageUrl || 'https://via.placeholder.com/60'} alt={album.title} />
                            <span className="item-name">{album.title}</span>
                          </div>
                          <div className="list-col-artist">{album.artist ? album.artist.name : 'Unknown'}</div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">No recently played albums yet.</div>
                    )}
                  </div>
                </div>
                
                <div className="recent-section">
                  <h2>Recently Played Playlists</h2>
                  <div className="list-header">
                    <div className="list-col-title"># Title</div>
                    <div className="list-col-owner">Owner</div>
                    <div className="list-col-tracks">Tracks</div>
                  </div>
                  <div className="list-items">
                    {recentlyPlayedPlaylists.length > 0 ? (
                      recentlyPlayedPlaylists.map((playlist, index) => (
                        <Link to={`/playlist/${playlist.id}`} key={playlist.id} className="list-item">
                          <div className="list-col-title">
                            <span className="item-number">{index + 1}</span>
                            <img src={playlist.imageUrl || 'https://via.placeholder.com/60'} alt={playlist.name} />
                            <span className="item-name">{playlist.name}</span>
                          </div>
                          <div className="list-col-owner">{playlist.user ? playlist.user.username : 'You'}</div>
                          <div className="list-col-tracks">{playlist.tracks ? playlist.tracks.length : 0} songs</div>
                        </Link>
                      ))
                    ) : (
                      <div className="empty-state">No recently played playlists yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Library;
