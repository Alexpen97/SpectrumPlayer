import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlay } from 'react-icons/fi';
import '../styles/AlbumCard.css';

function AlbumCard({ id, title, imageUrl, year, artist, artistId }) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    // If artistId is provided, use the full path, otherwise fall back to a simpler path
    if (artistId) {
      navigate(`/artist/${artistId}/album/${id}`);
    } else {
      // Fallback for cases where artistId might not be available
      navigate(`/album/${id}`);
    }
  };

  return (
    <div 
      className="album-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="album-image-container">
        <img src={imageUrl} alt={title} className="album-image" />
        {isHovered && (
          <div className="play-overlay">
            <button className="play-button">
              <FiPlay />
            </button>
          </div>
        )}
      </div>
      <div className="album-info">
        <h3 className="album-title">{title}</h3>
        <p className="album-year">{year} {artist && `• ${artist}`}</p>
      </div>
    </div>
  );
}

export default AlbumCard;
