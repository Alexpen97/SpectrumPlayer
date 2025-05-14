import React, { createContext, useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayerAudio from '../components/ReactPlayerAudio';
import { albumService, recentlyPlayedTrackService, libraryService } from '../services/api';

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
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // 'off', 'all', 'one'
  const [isTrackLiked, setIsTrackLiked] = useState(false);
  
  // Ref for the player component
  const playerRef = useRef(null);
  
  // Playback URL state
  const [playbackUrl, setPlaybackUrl] = useState('');
  
  // Flag to prevent track ended handler from firing multiple times
  const trackEndedHandlingRef = useRef(false);
  
  // Handle player ready event
  const handlePlayerReady = (player) => {
    console.log('Player ready');
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
  
  // Play a track using ReactPlayerAudio for better FLAC support
  const playTrack = (track) => {
    if (!track || !track.streamUrl) {
      setError('This track is not available for streaming');
      return;
    }
    
    // Reset state
    setError(null);
    setIsLoading(true);
    setCurrentTrack(track);
    
    // Log track information
    console.log('Playing track:', track);
    console.log('Stream URL:', track.streamUrl);
    
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
    
    // Simply update the playback URL and the ReactPlayerAudio component will handle it
    setPlaybackUrl(track.streamUrl);
    setIsPlaying(true);
  };
  
  // Play a track and set the queue
  const playTrackWithQueue = (track, tracksQueue, startIndex = 0) => {
    setQueue(tracksQueue);
    setQueueIndex(startIndex);
    playTrack(track);
  };
  
  // Toggle play/pause
  const togglePlay = () => {
    if (!currentTrack) return;
    
    console.log(isPlaying ? 'Pausing playback' : 'Resuming playback');
    setIsPlaying(!isPlaying);
  };
  
  // Seek to a specific time
  const seekTo = useCallback((time) => {
    if (!playerRef.current || !currentTrack) return;
    
    try {
      console.log('Seeking to', time, 'seconds');
      
      // Make sure time is within valid bounds
      const validTime = Math.max(0, Math.min(time, duration));
      
      // ReactPlayer handles seeking directly in seconds
      playerRef.current.seekTo(validTime, 'seconds');
      
      // Update time state immediately for better UI responsiveness
      setCurrentTime(validTime);
    } catch (error) {
      console.error('Error during seek operation:', error);
      setError(`Seek error: ${error.message}`);
    }
  }, [currentTrack, duration]);
  
  // No need for manual cleanup - React will handle component unmounting
  
  // Set volume
  const setAudioVolume = (newVolume) => {
    // Simply update the volume state and let ReactPlayerAudio handle it
    setVolume(newVolume);
  };
  
  // Play next track in queue with Howler
  const playNextTrack = () => {
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
    
    if (nextIndex >= 0 && nextIndex < queue.length && queue[nextIndex]) {
      // Valid next track exists
      console.log('Playing next track:', queue[nextIndex].title);
      setQueueIndex(nextIndex);
      
      // Howler handles track transitions much better
      playTrack(queue[nextIndex]);
    } else {
      console.error('Invalid next track index:', nextIndex, 'Queue length:', queue.length);
      // Try to recover by playing first track if possible
      if (queue.length > 0 && queue[0]) {
        console.log('Recovering by playing first track in queue');
        setQueueIndex(0);
        playTrack(queue[0]);
      }
    }
  };
  
  // Play previous track in queue
  const playPreviousTrack = () => {
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
    playTrack(queue[prevIndex]);
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
      {/* Render the ReactPlayerAudio component here to handle FLAC playback */}
      {currentTrack && (
        <ReactPlayerAudio
          url={playbackUrl}
          playing={isPlaying}
          volume={volume}
          onReady={handlePlayerReady}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleTrackEnded}
          onError={(e) => {
            console.error('Error playing track:', e);
            setError(`Error playing track: ${currentTrack?.title}`);
            setIsLoading(false);
            setIsPlaying(false);
          }}
          onDuration={setDuration}
          onProgress={handleProgress}
        />
      )}
      {children}
    </AudioPlayerContext.Provider>
  );
};

export default AudioPlayerProvider;
