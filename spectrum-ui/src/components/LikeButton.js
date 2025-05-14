import React, { useState, useEffect } from 'react';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { libraryService } from '../services/api';
import '../styles/LikeButton.css';

/**
 * Reusable like button component for tracks, albums, and artists
 * @param {Object} props - Component props
 * @param {string} props.type - Type of item ('track', 'album', or 'artist')
 * @param {string|number} props.id - ID of the item
 * @param {string} props.className - Additional CSS class names
 * @param {Function} props.onLikeChange - Callback when like status changes
 */
function LikeButton({ type, id, className = '', onLikeChange }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if the item is liked when the component mounts or when id/type changes
  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const checkLikedStatus = async () => {
      try {
        let response;
        
        switch (type) {
          case 'track':
            response = await libraryService.isTrackLiked(id);
            break;
          case 'album':
            response = await libraryService.isAlbumLiked(id);
            break;
          case 'artist':
            response = await libraryService.isArtistLiked(id);
            break;
          default:
            console.error('Invalid type for LikeButton:', type);
            setIsLoading(false);
            return;
        }
        
        setIsLiked(response.data.liked);
        setIsLoading(false);
      } catch (error) {
        console.error(`Error checking if ${type} is liked:`, error);
        setIsLiked(false);
        setIsLoading(false);
      }
    };
    
    checkLikedStatus();
  }, [id, type]);

  // Toggle like status
  const handleToggleLike = async () => {
    if (!id || isLoading) return;
    
    try {
      let response;
      
      switch (type) {
        case 'track':
          response = await libraryService.toggleLikedTrack(id);
          break;
        case 'album':
          response = await libraryService.toggleLikedAlbum(id);
          break;
        case 'artist':
          response = await libraryService.toggleLikedArtist(id);
          break;
        default:
          console.error('Invalid type for LikeButton:', type);
          return;
      }
      
      const newLikedStatus = response.data.liked;
      setIsLiked(newLikedStatus);
      
      // Call the callback if provided
      if (onLikeChange) {
        onLikeChange(newLikedStatus);
      }
      
      console.log(response.data.message);
    } catch (error) {
      console.error(`Error toggling like for ${type}:`, error);
    }
  };

  return (
    <button 
      className={`like-button ${isLiked ? 'active' : ''} ${className}`} 
      onClick={handleToggleLike} 
      disabled={isLoading || !id}
      title={isLiked ? `Remove from Liked ${type === 'track' ? 'Songs' : type === 'album' ? 'Albums' : 'Artists'}` : 
                      `Add to Liked ${type === 'track' ? 'Songs' : type === 'album' ? 'Albums' : 'Artists'}`}
      aria-label={isLiked ? `Unlike ${type}` : `Like ${type}`}
    >
      {isLiked ? 
        <AiFillHeart className="liked-icon" /> : 
        <AiOutlineHeart className="not-liked-icon" />
      }
    </button>
  );
}

export default LikeButton;
