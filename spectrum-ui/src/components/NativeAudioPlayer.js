import React, { useRef, useEffect } from 'react';
import { isTauri } from '../services/tauri-api-bridge';

/**
 * A simple native HTML5 audio player component that works reliably in both
 * development and production Tauri environments
 */
const NativeAudioPlayer = ({
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
  const audioRef = useRef(null);
  const playStateRef = useRef(playing);
  
  // Set up the audio element when the component mounts
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Set initial volume
    audio.volume = volume;
    
    // Log for debugging
    console.log('NativeAudioPlayer initialized with URL:', url);
    
    // Set up event listeners
    const handleCanPlay = () => {
      console.log('Audio can play event');
      if (onReady) onReady(audio);
      if (onDuration) onDuration(audio.duration);
    };
    
    const handlePlay = () => {
      console.log('Audio play event');
      if (onPlay) onPlay();
    };
    
    const handlePause = () => {
      console.log('Audio pause event');
      if (onPause) onPause();
    };
    
    const handleEnded = () => {
      console.log('Audio ended event');
      if (onEnded) onEnded();
    };
    
    const handleError = (e) => {
      console.error('Audio error event:', e);
      console.error('Error details:', {
        error: e.target.error,
        src: e.target.src,
        readyState: e.target.readyState,
        code: e.target.error ? e.target.error.code : 'unknown'
      });
      
      // Try to recover from the error
      const audio = e.target;
      
      // If we're in Tauri, try a different approach
      if (isTauri() && audio.src) {
        console.log('Attempting to recover from audio error in Tauri environment');
        
        // Create a new Audio element programmatically
        setTimeout(() => {
          try {
            // Modify the URL to use a different approach in Tauri
            const originalSrc = audio.src;
            const modifiedSrc = originalSrc.includes('?') 
              ? `${originalSrc}&_bypass=true&_t=${Date.now()}` 
              : `${originalSrc}?_bypass=true&_t=${Date.now()}`;
            
            console.log('Retrying with modified URL:', modifiedSrc);
            audio.src = modifiedSrc;
            audio.load();
          } catch (retryError) {
            console.error('Error during recovery attempt:', retryError);
          }
        }, 500);
      }
      
      if (onError) onError(e);
    };
    
    const handleTimeUpdate = () => {
      if (onProgress) {
        onProgress({
          played: audio.currentTime / (audio.duration || 1),
          playedSeconds: audio.currentTime,
          loaded: audio.buffered.length ? audio.buffered.end(audio.buffered.length - 1) / audio.duration : 0,
          loadedSeconds: audio.buffered.length ? audio.buffered.end(audio.buffered.length - 1) : 0
        });
      }
    };
    
    // Add event listeners
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    // Clean up event listeners on unmount
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [onReady, onPlay, onPause, onEnded, onError, onDuration, onProgress]);
  
  // Track the last URL to prevent redundant updates
  const lastUrlRef = useRef('');
  
  // Update URL when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !url) return;
    
    // Skip if the URL is the same (ignoring timestamp parameters)
    const baseUrl = url.split('?')[0];
    const lastBaseUrl = lastUrlRef.current.split('?')[0];
    if (baseUrl === lastBaseUrl && lastUrlRef.current) {
      console.log('Skipping redundant URL update');
      return;
    }
    
    // Update the last URL reference
    lastUrlRef.current = url;
    
    console.log('Setting audio source to:', url);
    
    try {
      // Special handling for Tauri environment
      if (isTauri()) {
        console.log('Using Tauri-specific URL handling');
        // Clean the URL to prevent double slashes (except after protocol)
        let cleanUrl = url.replace(/([^:]\/)\/+/g, "$1");
        
        // Add timestamp to prevent caching issues
        const timestampedUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
        console.log('Final Tauri URL:', timestampedUrl);
        audio.src = timestampedUrl;
      } else {
        audio.src = url;
      }
      
      // Preload the audio
      audio.load();
    } catch (error) {
      console.error('Error setting audio source:', error);
      onError && onError(error);
    }
  }, [url, onError]);
  
  // Update volume when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = volume;
  }, [volume]);
  
  // Update playing state when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Update the ref to track changes
    playStateRef.current = playing;
    
    // Use a debounce mechanism to prevent rapid play/pause cycles
    let playPauseTimeout;
    
    if (playing) {
      console.log('Play command received');
      // Clear any existing timeouts
      clearTimeout(playPauseTimeout);
      
      // Set a small delay before playing to prevent rapid toggling
      playPauseTimeout = setTimeout(() => {
        // Only play if we're still supposed to be playing
        if (playStateRef.current) {
          try {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                // Handle autoplay restrictions
                if (error.name === 'NotAllowedError') {
                  console.warn('Autoplay prevented by browser policy');
                  // Notify parent component but don't trigger error UI
                  if (onPause) onPause();
                } else {
                  console.error('Error during play:', error);
                  if (onError) onError(error);
                }
              });
            }
          } catch (error) {
            console.error('Exception during play:', error);
            if (onError) onError(error);
          }
        }
      }, 100);
    } else {
      console.log('Pause command received');
      // Clear any pending play commands
      clearTimeout(playPauseTimeout);
      
      try {
        audio.pause();
      } catch (error) {
        console.error('Error during pause:', error);
      }
    }
    
    return () => {
      // Clean up any pending timeouts when the effect re-runs or unmounts
      clearTimeout(playPauseTimeout);
    };
  }, [playing, onError, onPause]);
  
  // Method to expose seeking functionality
  const seekTo = (time) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    console.log('Seeking to:', time);
    audio.currentTime = time;
  };
  
  // Expose the seekTo method
  if (audioRef.current && onReady) {
    audioRef.current.seekTo = seekTo;
  }
  
  return (
    <audio
      ref={audioRef}
      style={{ display: 'none' }}
      preload="auto"
      crossOrigin="anonymous"
    />
  );
};

export default NativeAudioPlayer;
