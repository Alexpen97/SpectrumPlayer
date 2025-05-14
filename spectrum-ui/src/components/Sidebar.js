import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Sidebar.css';
import { FiHome, FiSearch, FiPlus, FiMusic } from 'react-icons/fi';
import { BiLibrary } from 'react-icons/bi';
import { BsHeartFill } from 'react-icons/bs';
import { playlistService } from '../services/api';

function Sidebar() {
  const [playlists, setPlaylists] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch playlists from the API
    playlistService.getAllPlaylists()
      .then(response => {
        setPlaylists(response.data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching playlists:', error);
        setIsLoading(false);
      });
  }, []);

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    
    // Get the current user ID from localStorage
    const userData = localStorage.getItem('user');
    let userId = 1; // Default to admin user ID if not found
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userId = user.id;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // Use the /create endpoint with just name and userId as URL parameters
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/playlists/create?name=${newPlaylistName}&userId=${userId}`, {
      method: 'POST'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      setPlaylists([...playlists, data]);
      setNewPlaylistName('');
      setShowCreateForm(false);
    })
    .catch(error => {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist. Please try again.');
    });
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <h1>Spectrum</h1>
      </div>
      <div className="sidebar-menu">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="icon"><FiHome /></span>
          <span>Home</span>
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="icon"><FiSearch /></span>
          <span>Search</span>
        </NavLink>
        <NavLink to="/library" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="icon"><BiLibrary /></span>
          <span>Your Library</span>
        </NavLink>
      </div>
      <div className="create-playlist">
        <button>
          <span className="icon"><FiPlus /></span>
          <span>Create Playlist</span>
        </button>
      </div>
      <div className="liked-songs">
        <NavLink to="/collection/tracks" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="icon"><BsHeartFill color="#1DB954" /></span>
          <span>Liked Songs</span>
        </NavLink>
      </div>
      <div className="divider"></div>
      <div className="playlists">
        <div className="playlists-header">
          <h3>Playlists</h3>
          <button className="add-playlist-button" onClick={() => setShowCreateForm(!showCreateForm)}>
            <FiPlus />
          </button>
        </div>
        
        {showCreateForm && (
          <div className="create-playlist-form">
            <input
              type="text"
              placeholder="New playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
            />
            <button onClick={handleCreatePlaylist}>Create</button>
          </div>
        )}
        
        {isLoading ? (
          <div className="loading-playlists">Loading playlists...</div>
        ) : (
          <ul>
            {playlists.length === 0 ? (
              <li className="no-playlists">No playlists found</li>
            ) : (
              playlists.map(playlist => (
                <li key={playlist.id}>
                  <NavLink to={`/playlist/${playlist.id}`}>{playlist.name}</NavLink>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
