import React, { useRef, useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { isTauri } from '../services/tauri-api-bridge';

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

  // Log URL for debugging
  useEffect(() => {
    if (url) {
      console.log('ReactPlayerAudio received URL:', url);
    }
  }, [url]);

  // Special handling for Tauri environment
  const isTauriEnv = isTauri();
  useEffect(() => {
    if (isTauriEnv && url) {
      console.log('Running in Tauri environment with URL:', url);
    }
  }, [isTauriEnv, url]);

  // If URL is not valid or not provided, don't render the player
  if (!url) {
    console.warn('ReactPlayerAudio: No URL provided');
    return null;
  }

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
            forceSupportNative: true,
            forceHLS: false,
            forceVideo: false
          }
        }}
        onReady={handleReady}
        onPlay={() => {
          console.log('ReactPlayer: onPlay event');
          if (onPlay) onPlay();
        }}
        onPause={() => {
          console.log('ReactPlayer: onPause event');
          if (onPause) onPause();
        }}
        onEnded={() => {
          console.log('ReactPlayer: onEnded event');
          if (onEnded) onEnded();
        }}
        onError={(e) => {
          // Detailed error logging
          console.error('ReactPlayer error:', e);
          if (e && e.target) {
            console.error('Error details:', { 
              error: e.target.error,
              src: e.target.src,
              readyState: e.target.readyState
            });
          }
          
          // Ignore AbortError since it's common during seeking
          if (e && e.name === 'AbortError') {
            console.log('Ignoring AbortError - common during seeking');
            return;
          }
          if (onError) onError(e);
        }}
        onDuration={(duration) => {
          console.log('ReactPlayer: Duration received:', duration);
          if (onDuration) onDuration(duration);
        }}
        onProgress={(progress) => {
          if (onProgress) onProgress(progress);
        }}
        onSeek={(seconds) => {
          console.log('ReactPlayer: Seek to', seconds);
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