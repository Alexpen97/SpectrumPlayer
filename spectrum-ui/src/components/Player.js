import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import '../styles/Player.css';
import { FiSkipBack, FiSkipForward, FiRepeat, FiVolume2, FiVolume, FiVolumeX } from 'react-icons/fi';
import { BsPlayFill, BsPauseFill, BsShuffle, BsList, BsLaptop } from 'react-icons/bs';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { AudioPlayerContext } from '../contexts/AudioPlayerContext';

function Player() {
  // Get audio player context
  const {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    volume,
    isLoading,
    error,
    shuffle,
    repeat,
    isTrackLiked,
    togglePlay,
    seekTo,
    setAudioVolume,
    playNextTrack,
    playPreviousTrack,
    toggleShuffle,
    toggleRepeat,
    toggleLikeTrack,
    formatTime
  } = useContext(AudioPlayerContext);
  
  // Local state for UI
  const [progress, setProgress] = useState(0);
  const [volumePercent, setVolumePercent] = useState(Math.round(volume * 100));
  
  // Update progress when currentTime changes
  useEffect(() => {
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    } else {
      setProgress(0);
    }

  }, [currentTime, duration, currentTrack, isPlaying]);
  
  // Split seeking into two phases to make it more reliable
  
  // Only update local state during input changes without seeking
  const handleProgressChange = useCallback((e) => {
    if (!currentTrack || !duration) return;
    
    // Get value directly from the input range and update local state
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
  }, [currentTrack, duration]);
  
  // When interaction ends (mouse up/touch end), do the actual seek
  const handleProgressChangeEnd = useCallback((e) => {
    if (!currentTrack || !duration) return;
    
    // Get final progress value
    const newProgress = parseFloat(e.target.value);
    
    // Calculate time based on percentage 
    const newTime = (newProgress / 100) * duration;
    
    console.log(`Progress change ended, seeking to: ${newTime}/${duration} seconds (${newProgress}%)`);
    
    // Tell the context we're about to manually change positions
    // This helps coordinate the pause/play timing
    seekTo(newTime);
  }, [currentTrack, duration, seekTo]);
  
  // Handle direct clicks on the progress bar
  const handleProgressBarClick = useCallback((e) => {
    if (!currentTrack || !duration) return;
    
    // Calculate click position
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const progressBarWidth = rect.width;
    
    // Calculate percentage and time
    const percentage = (clickPosition / progressBarWidth) * 100;
    const newTime = (percentage / 100) * duration;
    
    // Update UI
    setProgress(percentage);
    
    // Seek to the calculated time
    console.log(`Progress bar clicked at ${percentage}%, seeking to ${newTime}/${duration} seconds`);
    seekTo(newTime);
  }, [currentTrack, duration, seekTo]);
  
  // Handle volume change
  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolumePercent(newVolume);
    setAudioVolume(newVolume / 100);
    console.log(`Volume set to: ${newVolume}%`);
  }, [setAudioVolume]);

  // Update CSS variables for progress bar and volume slider
  useEffect(() => {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.setProperty('--progress-percent', `${progress}%`);
    }
    
    const volumeSlider = document.querySelector('.volume-slider');
    if (volumeSlider) {
      volumeSlider.style.setProperty('--volume-percent', `${volumePercent}%`);
    }
  }, [progress, volumePercent]);

  // Update CSS variables for progress bar and volume slider
  useEffect(() => {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.setProperty('--progress-percent', `${progress}%`);
    }
    
    const volumeSlider = document.querySelector('.volume-slider');
    if (volumeSlider) {
      volumeSlider.style.setProperty('--volume-percent', `${volumePercent}%`);
    }
  }, [progress, volumePercent]);

  return (
    <div className="player">
      <div className="song-info">
        <div className="song-image">
          {currentTrack ? (
            <img 
              src={currentTrack.albumImageUrl || 'https://via.placeholder.com/56'} 
              alt={`${currentTrack.albumName || 'Album'} cover`} 
            />
          ) : (
            <img src="https://via.placeholder.com/56" alt="Album cover" />
          )}
        </div>
        <div className="song-details">
          {currentTrack ? (
            <>
              <p className="song-name">{currentTrack.title || 'Unknown Track'}</p>
              <p className="artist-name">{currentTrack.artistName || 'Unknown Artist'}</p>
            </>
          ) : (
            <>
              <p className="song-name">Not Playing</p>
              <p className="artist-name">Select a track to play</p>
            </>
          )}
        </div>
        <div className="like-button">
          <button 
            className={`like-btn ${isTrackLiked ? 'active' : ''}`} 
            onClick={toggleLikeTrack} 
            disabled={!currentTrack}
            title={isTrackLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
          >
            {isTrackLiked ? <AiFillHeart className="liked" /> : <AiOutlineHeart />}
          </button>
        </div>
      </div>

      <div className="player-controls">
        {/* Large Play/Pause Button */}
        <div className="large-play-button-container">
          <button 
            className="large-play-button" 
            onClick={togglePlay}
            disabled={!currentTrack || isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : isPlaying ? (
              <BsPauseFill size={32} />
            ) : (
              <BsPlayFill size={32} />
            )}
          </button>
        </div>
        
        <div className="control-buttons">
          <button 
            className={`shuffle-button ${shuffle ? 'active' : ''}`} 
            onClick={toggleShuffle}
            disabled={!currentTrack}
          >
            <BsShuffle />
          </button>
          <button 
            className="prev-button" 
            onClick={playPreviousTrack}
            disabled={!currentTrack}
          >
            <FiSkipBack />
          </button>
          <button 
            className="next-button" 
            onClick={playNextTrack}
            disabled={!currentTrack}
          >
            <FiSkipForward />
          </button>
          <button 
            className={`repeat-button ${repeat !== 'off' ? 'active' : ''}`} 
            onClick={toggleRepeat}
            disabled={!currentTrack}
          >
            {repeat === 'one' ? (
              <span className="repeat-one">1</span>
            ) : (
              <FiRepeat />
            )}
          </button>
        </div>
        <div className="progress-container">
          <span className="time-elapsed">{formatTime(currentTime)}</span>
          <div className="progress-bar-container" onClick={handleProgressBarClick}>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              className="progress-bar"
              onChange={handleProgressChange}
              onMouseUp={handleProgressChangeEnd}
              onTouchEnd={handleProgressChangeEnd}
              disabled={!currentTrack}
            />
          </div>
          <span className="time-total">{formatTime(duration)}</span>
        </div>
        {error && <div className="player-error">{error}</div>}
      </div>

      <div className="volume-controls">
        <button className="playlist-button"><BsList /></button>
        <button className="device-button"><BsLaptop /></button>
        <div className="volume-container">
          <button className="volume-icon">
            {volumePercent === 0 ? <FiVolumeX /> : volumePercent < 50 ? <FiVolume /> : <FiVolume2 />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={volumePercent}
            className="volume-slider"
            onChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
}

export default Player;
