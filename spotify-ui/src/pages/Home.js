import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';
import { albumService, userService } from '../services/api';

function Home() {
  const [recentlyPlayedAlbums, setRecentlyPlayedAlbums] = useState([]);
  const [releaseRadarAlbums, setReleaseRadarAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReleaseRadarLoading, setIsReleaseRadarLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [greeting, setGreeting] = useState('Good evening');
  
  // Auto-login and set greeting based on time of day
  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Good morning');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
    
    // Auto-login if not already logged in
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
  
  // Load recently played albums when user is set
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      userService.getRecentlyPlayed(user.id)
        .then(response => {
          if (response.data) {
            setRecentlyPlayedAlbums(response.data);
            console.log('Recently played albums:', response.data);
          }
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Failed to load recently played albums:', error);
          setIsLoading(false);
        });
      
      // Load release radar albums
      setIsReleaseRadarLoading(true);
      console.log('Requesting release radar for user ID:', user.id);
      userService.getReleaseRadar(user.id)
        .then(response => {
          console.log('Release radar API response:', response);
          if (response.data) {
            console.log('Release radar data length:', response.data.length);
            setReleaseRadarAlbums(response.data);
            console.log('Release radar albums:', response.data);
          } else {
            console.log('No data in release radar response');
          }
          setIsReleaseRadarLoading(false);
        })
        .catch(error => {
          console.error('Failed to load release radar albums:', error);
          setIsReleaseRadarLoading(false);
        });
    }
  }, [user]);
  
  return (
    <div className="home">
      <div className="home-header">
        <h1>{greeting}{user ? `, ${user.username}` : ''}</h1>
      </div>
      
      <div className="recently-played">
        <div className="recently-played-items">
          {isLoading ? (
            // Loading placeholders
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="recently-played-item loading-item">
                <div className="placeholder-image"></div>
                <div className="placeholder-text"></div>
              </div>
            ))
          ) : recentlyPlayedAlbums.length > 0 ? (
            // Display recently played albums
            recentlyPlayedAlbums.slice(0, 6).map((album, index) => (
              <Link 
                to={`/artist/${album.artist.id}/album/${album.lidarrAlbumId}`} 
                key={album.lidarrAlbumId} 
                className="recently-played-item"
              >
                <img 
                  src={album.coverImageUrl || 'https://placehold.co/80x80/gray/white?text=Album'} 
                  alt={album.title} 
                />
                <span>{album.title}</span>
              </Link>
            ))
          ) : (
            // Default placeholders if no recently played albums
            <></>
          )}
        </div>
      </div>
      
      <div className="section">
        <div className="section-header">
          <h2>Release Radar</h2>
          <Link to="/browse/release-radar" className="see-all">SEE ALL</Link>
        </div>
        <div className="section-content">
          {isReleaseRadarLoading ? (
            // Loading placeholders
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="card loading-card">
                <div className="card-img">
                  <div className="placeholder-image"></div>
                </div>
                <div className="placeholder-text"></div>
                <div className="placeholder-text small"></div>
              </div>
            ))
          ) : releaseRadarAlbums.length > 0 ? (
            // Display release radar albums
            releaseRadarAlbums.slice(0, 5).map((album) => (
              <Link to={`/artist/${album.artistId}/album/${album.id}`} key={album.id} className="card">
                <div className="card-img">
                  <img 
                    src={album.coverArt} 
                    alt={album.title} 
                  />
                </div>
                <h3>{album.title}</h3>
                <p>{album.artist ? album.artist.artistName : 'Unknown Artist'}</p>
                <span className="release-date">{album.releaseDate ? new Date(album.releaseDate).toLocaleDateString() : 'New Release'}</span>
              </Link>
            ))
          ) : (
            // Default message if no release radar albums
            <div className="empty-state">
              <p>No recent releases found from your favorite artists</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="section">
        <div className="section-header">
          <h2>Made for you</h2>
          <a href="/browse/made-for-you" className="see-all">SEE ALL</a>
        </div>
        <div className="section-content">
          <div className="card">
            <div className="card-img">
              <img src="https://placehold.co/150x150/gray/white?text=Mix+1" alt="Playlist cover" />
              <div className="play-button">▶️</div>
            </div>
            <h3>Daily Mix 1</h3>
            <p>Based on your recent listening</p>
          </div>
          <div className="card">
            <div className="card-img">
              <img src="https://placehold.co/150x150/gray/white?text=Weekly" alt="Playlist cover" />
              <div className="play-button">▶️</div>
            </div>
            <h3>Discover Weekly</h3>
            <p>Your weekly mixtape of fresh music</p>
          </div>
          <div className="card">
            <div className="card-img">
              <img src="https://placehold.co/150x150/gray/white?text=Capsule" alt="Playlist cover" />
              <div className="play-button">▶️</div>
            </div>
            <h3>Time Capsule</h3>
            <p>Songs from your past</p>
          </div>
          <div className="card">
            <div className="card-img">
              <img src="https://placehold.co/150x150/gray/white?text=Mix+2" alt="Playlist cover" />
              <div className="play-button">▶️</div>
            </div>
            <h3>Daily Mix 2</h3>
            <p>Based on your recent listening</p>
          </div>
        </div>
      </div>
      
      <div className="section">
        <div className="section-header">
          <h2>Recently played</h2>
          <Link to="/library" className="see-all">SEE ALL</Link>
        </div>
        <div className="section-content">
          {isLoading ? (
            // Loading placeholders
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="card loading-card">
                <div className="card-img">
                  <div className="placeholder-image"></div>
                </div>
                <div className="placeholder-text"></div>
                <div className="placeholder-text small"></div>
              </div>
            ))
          ) : recentlyPlayedAlbums.length > 0 ? (
            // Display recently played albums
            recentlyPlayedAlbums.slice(0, 5).map((album) => (
              <Link to={`/artist/${album.artist.id}/album/${album.lidarrAlbumId}`} key={album.lidarrAlbumId} className="card">
                <div className="card-img">
                  <img 
                    src={album.coverImageUrl || 'https://via.placeholder.com/150'} 
                    alt={album.title} 
                  />
                </div>
                <h3>{album.title}</h3>
                <p>{album.artist.artistName}</p>
              </Link>
            ))
          ) : (
            // Default placeholders if no recently played albums
            <>
              <div className="card">
                <div className="card-img">
                  <img src="https://via.placeholder.com/150" alt="Album cover" />
                  <div className="play-button">▶️</div>
                </div>
                <h3>Album Name</h3>
                <p>Artist Name</p>
              </div>
              <div className="card">
                <div className="card-img">
                  <img src="https://via.placeholder.com/150" alt="Album cover" />
                  <div className="play-button">▶️</div>
                </div>
                <h3>Album Name</h3>
                <p>Artist Name</p>
              </div>
              <div className="card">
                <div className="card-img">
                  <img src="https://via.placeholder.com/150" alt="Album cover" />
                  <div className="play-button">▶️</div>
                </div>
                <h3>Album Name</h3>
                <p>Artist Name</p>
              </div>
              <div className="card">
                <div className="card-img">
                  <img src="https://via.placeholder.com/150" alt="Album cover" />
                  <div className="play-button">▶️</div>
                </div>
                <h3>Album Name</h3>
                <p>Artist Name</p>
              </div>
              <div className="card">
                <div className="card-img">
                  <img src="https://via.placeholder.com/150" alt="Album cover" />
                  <div className="play-button">▶️</div>
                </div>
                <h3>Album Name</h3>
                <p>Artist Name</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
