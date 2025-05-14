import React from 'react';
import '../styles/PlayButton.css';

const PlayButton = ({ size = 'medium', onClick, isLocked = false, disabled = false, isPlaying = false }) => {
  const buttonClass = `play-button play-button-${size} ${isLocked ? 'locked' : ''} ${disabled ? 'disabled' : ''} ${isPlaying ? 'playing' : ''}`;
  
  return (
    <button className={buttonClass} onClick={onClick} disabled={disabled || isLocked}>
      {isLocked ? (
        <span className="icon-text">🔒</span>
      ) : isPlaying ? (
        <span className="icon-text">⏸</span>
      ) : (
        <span className="icon-text">▶</span>
      )}
    </button>
  );
};

export default PlayButton;
