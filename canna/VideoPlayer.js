// VideoPlayer.js - Enhanced Video Player with Analytics Tracking
// Simple, responsive, and comprehensive analytics

import React, { useRef, useState, useEffect } from 'react';

const VideoPlayer = ({ 
  src, 
  poster, 
  title, 
  description,
  cta,
  autoPlay = false,
  muted = false,
  loop = false,
  showControls = true,
  analyticsEnabled = true
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Analytics tracking
  const [analyticsSent, setAnalyticsSent] = useState({
    play: false,
    quartile25: false,
    quartile50: false,
    quartile75: false,
    complete: false
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Track quartile completion
      const progress = (video.currentTime / video.duration) * 100;
      
      if (analyticsEnabled) {
        if (progress >= 25 && !analyticsSent.quartile25) {
          trackAnalytics('video_quartile_25', { video_id: title, progress: 25 });
          setAnalyticsSent(prev => ({ ...prev, quartile25: true }));
        }
        if (progress >= 50 && !analyticsSent.quartile50) {
          trackAnalytics('video_quartile_50', { video_id: title, progress: 50 });
          setAnalyticsSent(prev => ({ ...prev, quartile50: true }));
        }
        if (progress >= 75 && !analyticsSent.quartile75) {
          trackAnalytics('video_quartile_75', { video_id: title, progress: 75 });
          setAnalyticsSent(prev => ({ ...prev, quartile75: true }));
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (analyticsEnabled) {
        trackAnalytics('video_loaded', { video_id: title, duration: video.duration });
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (analyticsEnabled && !analyticsSent.complete) {
        trackAnalytics('video_complete', { video_id: title, duration: video.duration });
        setAnalyticsSent(prev => ({ ...prev, complete: true }));
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [title, analyticsEnabled, analyticsSent]);

  const trackAnalytics = (eventName, data) => {
    if (window.gtag) {
      window.gtag('event', eventName, data);
    }
    console.log('Analytics:', eventName, data);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
      if (analyticsEnabled && !analyticsSent.play) {
        trackAnalytics('video_play', { video_id: title });
        setAnalyticsSent(prev => ({ ...prev, play: true }));
      }
    } else {
      video.pause();
      setIsPlaying(false);
      if (analyticsEnabled) {
        trackAnalytics('video_pause', { video_id: title, timestamp: video.currentTime });
      }
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    const seekTime = (e.target.value / 100) * duration;
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
    if (analyticsEnabled) {
      trackAnalytics('video_seek', { video_id: title, to_time: seekTime });
    }
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    const newVolume = e.target.value;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (analyticsEnabled) {
      trackAnalytics('volume_change', { video_id: title, volume: newVolume });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    if (analyticsEnabled) {
      trackAnalytics('video_mute', { video_id: title, muted: video.muted });
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!isFullscreen) {
      video.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handlePlaybackRate = (rate) => {
    const video = videoRef.current;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    if (analyticsEnabled) {
      trackAnalytics('playback_rate_change', { video_id: title, rate });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          muted={isMuted}
          loop={loop}
          playsInline
          className="video-element"
        />

        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div className="play-overlay" onClick={togglePlay}>
            <div className="play-button">▶</div>
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="video-controls">
            {/* Progress Bar */}
            <div className="progress-bar-container">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="progress-bar"
              />
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="controls-row">
              {/* Play/Pause */}
              <button onClick={togglePlay} className="control-button">
                {isPlaying ? '⏸' : '▶'}
              </button>

              {/* Time Display */}
              <span className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Volume */}
              <div className="volume-control">
                <button onClick={toggleMute} className="control-button">
                  {isMuted ? '🔇' : '🔊'}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>

              {/* Playback Speed */}
              <select
                value={playbackRate}
                onChange={(e) => handlePlaybackRate(parseFloat(e.target.value))}
                className="speed-select"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="control-button">
                {isFullscreen ? '⛶' : '⛶'}
              </button>
            </div>
          </div>
        )}

        {/* Info Overlay */}
        {(title || description) && (
          <div className="video-info">
            {title && <h3 className="video-title">{title}</h3>}
            {description && <p className="video-description">{description}</p>}
            {cta && (
              <a href={cta.url} className="video-cta">
                {cta.text}
              </a>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .video-player-container {
          position: relative;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .video-wrapper {
          position: relative;
          width: 100%;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
        }

        .video-element {
          width: 100%;
          display: block;
        }

        .play-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.3s;
        }

        .play-overlay:hover {
          background: rgba(0, 0, 0, 0.6);
        }

        .play-button {
          width: 80px;
          height: 80px;
          background: rgba(255, 107, 53, 0.9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: white;
          transition: transform 0.3s, background 0.3s;
        }

        .play-overlay:hover .play-button {
          transform: scale(1.1);
          background: rgba(255, 107, 53, 1);
        }

        .video-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
          padding: 20px;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .video-wrapper:hover .video-controls {
          opacity: 1;
        }

        .progress-bar-container {
          position: relative;
          width: 100%;
          height: 6px;
          margin-bottom: 12px;
          cursor: pointer;
        }

        .progress-bar {
          position: absolute;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .progress-fill {
          position: absolute;
          height: 100%;
          background: #ff6b35;
          border-radius: 3px;
          pointer-events: none;
        }

        .controls-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .control-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 6px;
          width: 40px;
          height: 40px;
          cursor: pointer;
          font-size: 18px;
          color: white;
          transition: background 0.2s;
        }

        .control-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .time-display {
          color: white;
          font-size: 14px;
          font-weight: 500;
          min-width: 100px;
        }

        .volume-control {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .volume-slider {
          width: 80px;
          height: 6px;
          cursor: pointer;
        }

        .speed-select {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          color: white;
          font-size: 12px;
          cursor: pointer;
        }

        .speed-select option {
          background: #333;
          color: white;
        }

        .video-info {
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .video-wrapper:hover .video-info {
          opacity: 1;
        }

        .video-title {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .video-description {
          margin: 0 0 12px 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .video-cta {
          display: inline-block;
          background: #ff6b35;
          color: white;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          pointer-events: auto;
          transition: background 0.2s;
        }

        .video-cta:hover {
          background: #ff8555;
        }

        @media (max-width: 768px) {
          .video-controls {
            padding: 16px;
          }

          .controls-row {
            gap: 8px;
          }

          .control-button {
            width: 36px;
            height: 36px;
            font-size: 16px;
          }

          .time-display {
            font-size: 12px;
            min-width: 80px;
          }

          .volume-slider {
            width: 60px;
          }

          .speed-select {
            padding: 6px 8px;
            font-size: 11px;
          }

          .video-title {
            font-size: 16px;
          }

          .video-description {
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .video-controls {
            padding: 12px;
          }

          .progress-bar-container {
            height: 4px;
            margin-bottom: 8px;
          }

          .control-button {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }

          .time-display {
            font-size: 11px;
            min-width: 70px;
          }

          .volume-slider {
            width: 50px;
          }

          .speed-select {
            padding: 4px 6px;
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;
