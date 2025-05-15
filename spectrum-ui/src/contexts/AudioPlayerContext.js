import React, { createContext, useState, useRef, useEffect, useCallback } from 'react';
import NativeAudioPlayer from '../components/NativeAudioPlayer';
import { albumService, libraryService, recentlyPlayedTrackService } from '../services/api';
import { isTauri } from '../services/tauri-api-bridge';

// Create the context
export const AudioPlayerContext = createContext();

export const AudioPlayerProvider = ({ children }) => {
  // Player state
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playbackUrl, setPlaybackUrl] = useState(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // 'off', 'all', 'one'
  const [isTrackLiked, setIsTrackLiked] = useState(false);
  
  // Ref for the player component
  const playerRef = useRef(null);
  
  // Flag to prevent track ended handler from firing multiple times
  const trackEndedHandlingRef = useRef(false);
  
  // Track if we've already processed a player ready event for the current track
  const playerReadyProcessedRef = useRef(false);
  
  // Handle player ready event
  const handlePlayerReady = (player) => {
    console.log('Player ready');
    
    // Skip if we've already processed a player ready event for this track
    if (playerReadyProcessedRef.current) {
      console.log('Skipping redundant player ready event');
      return;
    }
    
    // Mark as processed
    playerReadyProcessedRef.current = true;
    
    playerRef.current = player;
    setIsLoading(false);
    
    if (player && player.getDuration) {
      const dur = player.getDuration();
      setDuration(dur || 0);
    }
  };
  
  // Handle progress updates from the player
  const handleProgress = (state) => {
    if (state && typeof state.playedSeconds === 'number') {
      setCurrentTime(state.playedSeconds);
      
      // Check if track is about to end and handle it
      if (isPlaying && 
          duration > 0 && 
          state.playedSeconds >= duration - 0.5 && 
          !trackEndedHandlingRef.current) {
        trackEndedHandlingRef.current = true;
        setTimeout(() => {
          handleTrackEnded();
        }, 50);
      } else if (state.playedSeconds < duration - 1) {
        trackEndedHandlingRef.current = false;
      }
    }
  };
  
  // Handle track ended event
  const handleTrackEnded = () => {
    console.log('Track ended, currentTrack:', currentTrack);
    console.log('Queue:', queue);
    console.log('Queue index:', queueIndex);
    console.log('Repeat mode:', repeat);
    
    // Handle repeat modes
    if (repeat === 'one') {
      // Repeat the current track
      if (playerRef.current && playerRef.current.seekTo) {
        playerRef.current.seekTo(0, 'seconds');
        setIsPlaying(true);
      }
    } else if (queue.length > 0) {
      // Check if we're at the end of the queue
      if (queueIndex < queue.length - 1 || repeat === 'all') {
        playNextTrack();
      } else {
        // End of queue and no repeat
        console.log('End of queue reached');
        setIsPlaying(false);
        setCurrentTime(0);
      }
    } else {
      // No queue exists at all
      console.log('No tracks in queue, stopping playback');
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };
  
  // Play a track using NativeAudioPlayer for better compatibility in Tauri
  const playTrack = async (track) => {
    if (!track) {
      setError('Invalid track data');
      return;
    }
    
    // Reset state
    setError(null);
    setIsLoading(true);
    setCurrentTrack(track);
    
    // Reset the player ready processed flag for the new track
    playerReadyProcessedRef.current = false;
    
    try {
      // Get the stream URL - either from the track object or by generating it
      let streamUrl = track.streamUrl;
      
      // If no streamUrl is provided but we have a track ID, generate the URL
      if (!streamUrl && track.id) {
        try {
          console.log('Generating stream URL for track:', track.id);
          // Use the async getStreamUrl function from the API service
          streamUrl = await albumService.getStreamUrl(track.id);
          console.log('Generated stream URL:', streamUrl);
          
          // Validate the URL to ensure it's properly formatted
          try {
            new URL(streamUrl);
            console.log('Stream URL is valid');
          } catch (urlError) {
            console.error('Invalid stream URL format:', urlError);
            // Try to fix the URL if it's malformed
            if (streamUrl.includes('//')) {
              streamUrl = streamUrl.replace(/([^:]\/)\/+/g, "$1");
              console.log('Fixed stream URL:', streamUrl);
            }
          }
          
          // For release builds, ensure we have a valid URL with proper protocol
          if (!streamUrl.startsWith('http://') && !streamUrl.startsWith('https://')) {
            const baseUrl = localStorage.getItem('apiBaseUrl') || 'http://localhost:8080';
            if (streamUrl.startsWith('/')) {
              streamUrl = `${baseUrl}${streamUrl}`;
            } else {
              streamUrl = `${baseUrl}/${streamUrl}`;
            }
            console.log('Corrected stream URL with base URL:', streamUrl);
          }
        } catch (error) {
          console.error('Failed to generate stream URL:', error);
          setError('Failed to generate stream URL');
          setIsLoading(false);
          return;
        }
      }
      
      if (!streamUrl) {
        setError('This track is not available for streaming');
        setIsLoading(false);
        return;
      }
      
      // Add timestamp to prevent caching issues in Tauri
      if (isTauri()) {
        streamUrl = `${streamUrl}${streamUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
        console.log('Added timestamp to URL for Tauri:', streamUrl);
      }
      
      // Log track information
      console.log('Playing track:', track);
      console.log('Stream URL:', streamUrl);
      
      // Add album to recently played if it exists
      if (track.albumId) {
        albumService.addToRecentlyPlayed(track.albumId)
          .then(() => {
            console.log('Added album to recently played:', track.albumId);
          })
          .catch(error => {
            console.error('Failed to add album to recently played:', error);
          });
      }
      
      // Add track to recently played
      if (track.id) {
        recentlyPlayedTrackService.addToRecentlyPlayed(track.id)
          .then(() => {
            console.log('Added track to recently played:', track.id);
          })
          .catch(error => {
            console.error('Failed to add track to recently played:', error);
          });
      }
      
      // Check if track is liked
      const trackId = track.lidarrTrackId || track.id;
      if (trackId) {
        console.log('Checking liked status for track ID:', trackId);
        libraryService.isTrackLiked(trackId)
          .then(response => {
            setIsTrackLiked(response.data.liked);
            console.log('Track liked status:', response.data.liked);
          })
          .catch(error => {
            console.error('Failed to check if track is liked:', error);
            setIsTrackLiked(false);
          });
      } else {
        console.warn('Track has no valid ID to check liked status');
        setIsTrackLiked(false);
      }
      
      // Update the playback URL and the NativeAudioPlayer component will handle it
      setPlaybackUrl(streamUrl);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing track:', error);
      setError(`Error playing track: ${error.message}`);
      setIsLoading(false);
    }
  };
  
  // Play a track and set the queue
  const playTrackWithQueue = async (track, tracksQueue, startIndex = 0) => {
    setQueue(tracksQueue);
    setQueueIndex(startIndex);
    await playTrack(track);
  };
  
  // Reference to track the last time play was toggled
  const lastToggleTimeRef = useRef(0);
  
  // Toggle play/pause with debouncing to prevent rapid state changes
  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    
    // Prevent rapid toggling
    if (Date.now() - lastToggleTimeRef.current < 300) {
      console.log('Ignoring rapid toggle');
      return;
    }
    
    // Update the last toggle time
    lastToggleTimeRef.current = Date.now();
    
    console.log(isPlaying ? 'Pausing playback' : 'Resuming playback');
    setIsPlaying(prevState => !prevState);
  }, [isPlaying, currentTrack]);
  
  // Seek to a specific time
  const seekTo = useCallback((time) => {
    if (!playerRef.current || !currentTrack) return;
    
    try {
      console.log('Seeking to', time, 'seconds');
      
      // Make sure time is within valid bounds
      const validTime = Math.max(0, Math.min(time, duration));
      
      // Set seeking state to prevent progress updates during seek
      setIsSeeking(true);
      
      // Use the seekTo method from our NativeAudioPlayer
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(validTime);
      } else if (playerRef.current.currentTime !== undefined) {
        // Direct access to the audio element
        playerRef.current.currentTime = validTime;
      }
      
      // Update time state immediately for better UI responsiveness
      setCurrentTime(validTime);
      
      // Reset seeking state after a short delay
      setTimeout(() => setIsSeeking(false), 100);
    } catch (error) {
      console.error('Error during seek operation:', error);
      setError(`Seek error: ${error.message}`);
      setIsSeeking(false);
    }
  }, [currentTrack, duration]);
  
  // No need for manual cleanup - React will handle component unmounting
  
  // Set volume
  const setAudioVolume = (newVolume) => {
    // Simply update the volume state and let ReactPlayerAudio handle it
    setVolume(newVolume);
  };
  
  // Play next track in queue with Howler
  const playNextTrack = async () => {
    console.log('playNextTrack called with queue length:', queue.length, 'current index:', queueIndex);
    
    if (queue.length === 0) {
      console.log('Cannot play next track - queue is empty');
      return;
    }
    
    let nextIndex;
    
    if (shuffle) {
      // Random track (excluding current)
      nextIndex = Math.floor(Math.random() * (queue.length - 1));
      if (nextIndex >= queueIndex) nextIndex += 1; // Skip current
      console.log('Shuffle mode - selected random track at index:', nextIndex);
    } else {
      // Next track in sequence
      nextIndex = (queueIndex + 1) % queue.length;
      console.log('Standard mode - next track is index:', nextIndex, 
                 'wrapping around:', nextIndex < queueIndex);
    }
    
    // Check if we're at the end of the queue and repeat is off
    if (nextIndex === 0 && !repeat && queueIndex === queue.length - 1) {
      console.log('End of queue reached and repeat is off - stopping playback');
      setIsPlaying(false);
      return;
    }
    
    // Update queue index and play the track
    setQueueIndex(nextIndex);
    try {
      await playTrack(queue[nextIndex]);
    } catch (error) {
      console.error('Error playing next track:', error);
      setError(`Error playing next track: ${error.message}`);
      // Try to recover by playing first track if possible
      if (queue.length > 0) {
        try {
          await playTrack(queue[0]);
        } catch (e) {
          console.error('Recovery attempt failed:', e);
        }
      }
    }
  };
  
  // Play previous track in queue
  const playPreviousTrack = async () => {
    if (queue.length === 0) return;
    
    // If current time > 3 seconds, restart the current track
    if (currentTime > 3) {
      seekTo(0);
      return;
    }
    
    let prevIndex;
    
    if (shuffle) {
      // Random track (excluding current)
      prevIndex = Math.floor(Math.random() * (queue.length - 1));
      if (prevIndex >= queueIndex) prevIndex += 1; // Skip current
    } else {
      // Previous track in sequence
      prevIndex = queueIndex - 1;
      if (prevIndex < 0) prevIndex = queue.length - 1;
    }
    
    setQueueIndex(prevIndex);
    try {
      await playTrack(queue[prevIndex]);
    } catch (error) {
      console.error('Error playing previous track:', error);
      setError(`Error playing previous track: ${error.message}`);
    }
  };
  
  // Toggle shuffle mode - unchanged from before
  const toggleShuffle = () => {
    setShuffle(!shuffle);
  };
  
  // Toggle repeat mode - unchanged from before
  const toggleRepeat = () => {
    const modes = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeat);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeat(modes[nextIndex]);
  };
  
  // Toggle like status for the current track
  const toggleLikeTrack = useCallback(() => {
    if (!currentTrack) return;
    
    // Get the track ID from the appropriate property
    // Some tracks might have id in lidarrTrackId, others directly in id
    const trackId = currentTrack.lidarrTrackId || currentTrack.id;
    
    if (!trackId) {
      console.error('Cannot toggle like: Track has no valid ID');
      return;
    }
    
    console.log('Toggling like for track ID:', trackId);
    
    libraryService.toggleLikedTrack(trackId)
      .then(response => {
        setIsTrackLiked(response.data.liked);
        console.log(response.data.message);
      })
      .catch(err => console.error('Error toggling like for track:', err));
  }, [currentTrack]);
  
  // Format time in seconds to MM:SS - unchanged from before
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds === Infinity) return '0:00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Context value
  const value = {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    volume,
    isLoading,
    error,
    queue,
    queueIndex,
    shuffle,
    repeat,
    isTrackLiked,
    playTrack,
    playTrackWithQueue,
    togglePlay,
    seekTo,
    setAudioVolume,
    playNextTrack,
    playPreviousTrack,
    toggleShuffle,
    toggleRepeat,
    toggleLikeTrack,
    formatTime
  };
  
  return (
    <AudioPlayerContext.Provider value={value}>
      {/* Render the NativeAudioPlayer component here to handle audio playback */}
      {playbackUrl && (
        <NativeAudioPlayer
          url={playbackUrl}
          playing={isPlaying}
          volume={volume}
          onReady={(player) => {
            console.log('Player ready');
            playerRef.current = player;
            setIsLoading(false);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            console.log('Track ended, playing next track');
            playNextTrack();
          }}
          onError={(e) => {
            console.error('Error playing track:', e);
            setError(`Error playing track: ${currentTrack?.title || 'Unknown track'}`);
            setIsLoading(false);
            setIsPlaying(false);
          }}
          onDuration={(duration) => {
            console.log('Duration received:', duration);
            setDuration(duration);
          }}
          onProgress={(progress) => {
            if (!isSeeking) {
              setCurrentTime(progress.playedSeconds);
            }
          }}
        />
      )}
      {children}
    </AudioPlayerContext.Provider>
  );
};

export default AudioPlayerProvider;
