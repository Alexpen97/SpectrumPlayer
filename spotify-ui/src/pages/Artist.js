import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/Artist.css';
import { FiPlay, FiHeart, FiMoreHorizontal } from 'react-icons/fi';
import AlbumCard from '../components/AlbumCard';
import { artistService, albumService } from '../services/api';

function Artist() {
  const { name, foreignId } = useParams();
  
  // Artist state with placeholder data
  const [artist, setArtist] = useState({
    artistName: "Artist Name",
    overview: "This is a placeholder for the artist biography. The artist has released multiple albums and is known for their unique style and sound.",
    genres: ["Pop", "Rock", "Electronic"],
    images: [{ remoteUrl: "https://i.scdn.co/image/ab6761610000e5eb8ae7f2aaa9817a704a87ea36" }],
    monthlyListeners: "8,282,123"
  });
  
  // State for artist albums
  const [artistAlbums, setArtistAlbums] = useState([]);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);
  
  // Generate a theme color based on the artist image
  const [themeColor, setThemeColor] = useState('rgb(83, 83, 83)');

  useEffect(() => {
    // Only fetch if both name and foreignId exist
    if (name && foreignId) {
      fetchArtistData();
    }
  }, [name, foreignId]);

  const fetchArtistData = () => {
    // Implement the actual data fetching logic here
    console.log(`Fetching artist data for name: ${name}, foreignId: ${foreignId}`);
    artistService.loadArtistPage(name, foreignId)
      .then(response => {
        console.log('Artist data:', response.data);
        setArtist(response.data);
        
        // Set a default theme color if no images are available
        if (!response.data.images || response.data.images.length === 0) {
          setThemeColor('rgb(83, 83, 83)');
        } else {
          // Use a darker version of the theme color for better contrast
          setThemeColor('rgb(30, 50, 100)');
        }
        
        // Load albums by artist ID after loading artist data
        if (response.data.id) {
          loadAlbumsByArtistId(response.data.id);
        }
      })
      .catch(error => {
        console.error('Error fetching artist data:', error);
      });
  };
  
  // Function to load albums by artist ID
  const loadAlbumsByArtistId = (artistId) => {
    setIsLoadingAlbums(true);
    console.log(`Loading albums for artist ID: ${artistId}`);
    
    // Add more detailed logging
    albumService.loadAlbumsByArtistId(artistId)
      .then(response => {
        console.log('Albums data:', response.data);
        if (Array.isArray(response.data)) {
          setArtistAlbums(response.data);
        } else {
          console.warn('Received non-array album data:', response.data);
          setArtistAlbums([]);
        }
        setIsLoadingAlbums(false);
      })
      .catch(error => {
        console.error('Error loading albums:', error);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
        setIsLoadingAlbums(false);
        // Continue with empty albums array
        setArtistAlbums([]);
      });
  };
  // Fallback to placeholder albums if no albums are loaded
  const albums = artistAlbums.length > 0 ? artistAlbums : [
    {
      id: 1,
      title: "Album One",
      year: 2023,
      imageUrl: "https://i.scdn.co/image/ab67616d0000b2732fbd77033247e889cb7d2ac4"
    },
    {
      id: 2,
      title: "Album Two",
      year: 2021,
      imageUrl: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96"
    },
    {
      id: 3,
      title: "Album Three",
      year: 2019,
      imageUrl: "https://i.scdn.co/image/ab67616d0000b273c5148520a59be191eea16989"
    },
    {
      id: 4,
      title: "Album Four",
      year: 2018,
      imageUrl: "https://i.scdn.co/image/ab67616d0000b2739e1cfc756886ac782e363d79"
    },
    {
      id: 5,
      title: "Album Five",
      year: 2016,
      imageUrl: "https://i.scdn.co/image/ab67616d0000b2738940ac99f49e44f7c74d8df6"
    }
  ];

  // Placeholder popular tracks
  const popularTracks = [
    { id: 1, title: "Track One", album: "Album One", plays: "1,234,567", duration: "3:45" },
    { id: 2, title: "Track Two", album: "Album One", plays: "987,654", duration: "4:12" },
    { id: 3, title: "Track Three", album: "Album Two", plays: "876,543", duration: "3:21" },
    { id: 4, title: "Track Four", album: "Album Three", plays: "765,432", duration: "3:56" },
    { id: 5, title: "Track Five", album: "Album Four", plays: "654,321", duration: "4:32" }
  ];

  // Create page styles with gradient background
  const pageStyle = useMemo(() => {
    return {
      background: `linear-gradient(to bottom, ${themeColor} 0%, rgba(18, 18, 18, 1) 90%)`
    };
  }, [themeColor]);

  // Get the correct image URL from the artist data
  const getArtistImageUrl = () => {
    if (!artist.images || artist.images.length === 0) return '';
    
    // Try to find a cover image first
    const coverImage = artist.images.find(img => img.coverType === 'poster' || img.coverType === 'cover');
    if (coverImage && coverImage.remoteUrl) return coverImage.remoteUrl;
    
    // Otherwise use the first image with a remoteUrl
    const firstImageWithUrl = artist.images.find(img => img.remoteUrl);
    return firstImageWithUrl ? firstImageWithUrl.remoteUrl : '';
  };

  return (
    <div className="artist-page" style={pageStyle}>
      {/* Artist header */}
      <div className="artist-header" style={{ 
        backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), 
                          url(${getArtistImageUrl()})`
      }}>
        <div className="artist-info">
          <div className="verified-badge">
            <span>Verified Artist</span>
            <span className="checkmark">✓</span>
          </div>
          <h1>{artist.artistName}</h1>
          <p className="monthly-listeners">{artist.monthlyListeners} monthly listeners</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="artist-actions">
        <button className="play-button">
          <FiPlay />
        </button>
        <button className="follow-button">
          Follow
        </button>
        <button className="more-button">
          <FiMoreHorizontal />
        </button>
      </div>

      {/* Popular tracks */}
      <section className="popular-section">
        <h2>Popular</h2>
        <div className="popular-tracks">
          <table>
            <tbody>
              {popularTracks.map((track, index) => (
                <tr key={track.id} className="track-row">
                  <td className="track-number">{index + 1}</td>
                  <td className="track-info">
                    <div className="track-title">{track.title}</div>
                    <div className="track-album">{track.album}</div>
                  </td>
                  <td className="track-plays">{track.plays}</td>
                  <td className="track-duration">{track.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Discography */}
      <section className="discography-section">
        <div className="section-header">
          <h2>Discography</h2>
          <div className="filter-buttons">
            <button className="filter-button active">All</button>
            <button className="filter-button">Albums</button>
            <button className="filter-button">Singles & EPs</button>
          </div>
        </div>
        <div className="album-grid">
          {isLoadingAlbums ? (
            <div className="loading-albums">Loading albums...</div>
          ) : (
            albums.map(album => (
              <AlbumCard 
                key={album.id}
                id={album.id}
                title={album.title}
                imageUrl={album.images && album.images.length > 0 && album.images[0].remoteUrl ? 
                  album.images[0].remoteUrl : 'https://via.placeholder.com/300'}
                year={album.releaseDate ? new Date(album.releaseDate.split('T')[0]).getFullYear() : ''}
                artist={artist.artistName}
                artistId={artist.id}
              />
            ))
          )}
        </div>
      </section>

      {/* About section */}
      <section className="about-section">
        <h2>About</h2>
        <div className="about-content">
          <div className="artist-image">
            <img src={getArtistImageUrl()} alt={artist.artistName} />
          </div>
          <div className="artist-bio">
            <p>{artist.overview}</p>
            <div className="artist-stats">
              <div className="monthly-listeners-large">
                <h3>{artist.monthlyListeners || '8M+'}</h3>
                <p>Monthly Listeners</p>
              </div>
            </div>
          </div>
        </div>
        <div className="artist-genres">
          {artist.genres && artist.genres.map((genre, index) => (
            <span key={index} className="genre-tag">{genre}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Artist;
