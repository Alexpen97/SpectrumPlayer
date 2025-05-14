import React, { useRef, useState, useEffect } from 'react';
import ReactPlayer from 'react-player';

const ReactPlayerAudio = ({ 
  url, 
  playing, 
  volume = 0.7, 
  onReady, 
  onPlay, 
  onPause, 
  onEnded, 
  onError, 
  onDuration, 
  onProgress 
}) => {
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const playingStateRef = useRef(playing);
  
  // Track the playing state to restore it after seeking
  useEffect(() => {
    playingStateRef.current = playing;
  }, [playing]);

  // Handle player ready state
  const handleReady = () => {
    setIsReady(true);
    if (onReady && playerRef.current) {
      // Expose seekTo method that handles seeking properly
      const originalSeekTo = playerRef.current.seekTo;
      playerRef.current.seekTo = (amount, type) => {
        try {
          // Mark that we're seeking but don't stop playback
          setIsSeeking(true);
          // Call original seekTo
          originalSeekTo(amount, type);
        } catch (error) {
          console.error('Error during seek:', error);
          if (onError) onError(error);
        }
      };
      
      onReady(playerRef.current);
    }
  };

  return (
    <div style={{ display: 'none' }}>
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing} // Don't modify the playing state during seeking
        volume={volume}
        width="0"
        height="0"
        config={{
          file: {
            forceAudio: true,
            attributes: {
              crossOrigin: 'anonymous',
            },
            forceSupportNative: true
          }
        }}
        onReady={handleReady}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onError={(e) => {
          // Ignore AbortError since it's common during seeking
          if (e && e.name === 'AbortError') {
            console.log('Ignoring AbortError - common during seeking');
            return;
          }
          if (onError) onError(e);
        }}
        onDuration={onDuration}
        onProgress={onProgress}
        onSeek={() => {
          // When seek completes, reset the seeking state
          setIsSeeking(false);
          // If it was playing before seeking, ensure it continues playing
          if (playingStateRef.current && !playing) {
            if (onPlay) onPlay();
          }
        }}
        progressInterval={100}
      />
    </div>
  );
};

export default ReactPlayerAudio;