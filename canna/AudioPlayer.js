// AudioPlayer.js - Audio Player with Purchase Button
// Simple, clean audio player with purchase functionality

import React, { useState, useRef, useEffect } from 'react';

const AudioPlayer = ({ 
  src, 
  title, 
  artist,
  price,
  onPurchase,
  showPurchaseButton = true,
  purchaseText = 'Purchase',
  membershipDiscount = 0
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const discountedPrice = price != null ? price * (1 - membershipDiscount) : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const seekTime = (e.target.value / 100) * duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newVolume = e.target.value;
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase({ title, artist, price: discountedPrice, originalPrice: price });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={src} />
      
      <div className="player-info">
        {title && <h3 className="track-title">{title}</h3>}
        {artist && <p className="track-artist">{artist}</p>}
      </div>

      <div className="player-controls">
        <button onClick={togglePlay} className="control-button play-button">
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="progress-container">
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

        <span className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="volume-control">
          <button onClick={toggleMute} className="control-button volume-button">
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
      </div>

      {showPurchaseButton && price && (
        <div className="purchase-section">
          {membershipDiscount > 0 && (
            <span className="original-price">${price.toFixed(2)}</span>
          )}
          <button onClick={handlePurchase} className="purchase-button">
            {purchaseText} - ${discountedPrice.toFixed(2)}
          </button>
        </div>
      )}

      <style jsx>{`
        .audio-player {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .player-info {
          margin-bottom: 16px;
        }

        .track-title {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .track-artist {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        .player-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .control-button {
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          width: 40px;
          height: 40px;
          cursor: pointer;
          font-size: 18px;
          transition: background 0.2s;
        }

        .control-button:hover {
          background: #5568d3;
        }

        .play-button {
          width: 48px;
          height: 48px;
          font-size: 20px;
        }

        .progress-container {
          position: relative;
          flex: 1;
          height: 6px;
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
          background: #667eea;
          border-radius: 3px;
          pointer-events: none;
        }

        .time-display {
          color: #666;
          font-size: 12px;
          min-width: 80px;
          font-weight: 500;
        }

        .volume-control {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .volume-button {
          width: 32px;
          height: 32px;
          font-size: 14px;
        }

        .volume-slider {
          width: 60px;
          height: 4px;
          cursor: pointer;
        }

        .purchase-section {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #e0e0e0;
        }

        .original-price {
          text-decoration: line-through;
          color: #999;
          font-size: 14px;
        }

        .purchase-button {
          flex: 1;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .purchase-button:hover {
          transform: scale(1.02);
        }

        @media (max-width: 768px) {
          .audio-player {
            padding: 16px;
          }

          .player-controls {
            flex-wrap: wrap;
            gap: 8px;
          }

          .play-button {
            width: 44px;
            height: 44px;
          }

          .progress-container {
            order: -1;
            width: 100%;
          }

          .volume-control {
            display: none;
          }

          .purchase-section {
            flex-direction: column;
            gap: 8px;
          }

          .purchase-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AudioPlayer;
