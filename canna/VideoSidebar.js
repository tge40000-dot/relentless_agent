// VideoSidebar.js - Video Advertising Sidebar Component
// Simple, responsive, and easy to use

import React, { useState, useEffect, useRef } from 'react';

const VideoSidebar = ({ videos = [], autoPlay = true, muted = true, position = 'right' }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const videoRef = useRef(null);

  // Auto-rotate videos every 30 seconds
  useEffect(() => {
    if (!autoPlay || videos.length === 0) return;

    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoPlay, videos.length]);

  // Track video views for analytics
  const handleVideoPlay = () => {
    if (window.gtag) {
      window.gtag('event', 'video_play', {
        video_id: videos[currentVideoIndex]?.id,
        video_title: videos[currentVideoIndex]?.title
      });
    }
  };

  const handleVideoEnd = () => {
    // Auto-advance to next video
    if (autoPlay && videos.length > 0) {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
    }
  };

  if (!isVisible || videos.length === 0) return null;

  const currentVideo = videos[currentVideoIndex];

  return (
    <div className={`video-sidebar video-sidebar-${position}`}>
      {/* Toggle Button */}
      <button 
        className="video-sidebar-toggle"
        onClick={() => setIsVisible(!isVisible)}
        aria-label="Toggle video sidebar"
      >
        {isVisible ? '✕' : '▶'}
      </button>

      {/* Video Container */}
      <div className="video-sidebar-content">
        {currentVideo && (
          <div className="video-player-wrapper">
            <video
              ref={videoRef}
              src={currentVideo.url}
              poster={currentVideo.thumbnail}
              autoPlay={autoPlay}
              muted={muted}
              loop={false}
              onPlay={handleVideoPlay}
              onEnded={handleVideoEnd}
              className="video-player"
              playsInline
            />
            
            {/* Video Info Overlay */}
            <div className="video-info-overlay">
              <h3 className="video-title">{currentVideo.title}</h3>
              {currentVideo.description && (
                <p className="video-description">{currentVideo.description}</p>
              )}
              {currentVideo.cta && (
                <a href={currentVideo.cta.url} className="video-cta-button">
                  {currentVideo.cta.text}
                </a>
              )}
            </div>

            {/* Video Navigation */}
            {videos.length > 1 && (
              <div className="video-navigation">
                <button 
                  onClick={() => setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length)}
                  className="nav-button prev"
                  aria-label="Previous video"
                >
                  ‹
                </button>
                <span className="video-counter">
                  {currentVideoIndex + 1} / {videos.length}
                </span>
                <button 
                  onClick={() => setCurrentVideoIndex((prev) => (prev + 1) % videos.length)}
                  className="nav-button next"
                  aria-label="Next video"
                >
                  ›
                </button>
              </div>
            )}

            {/* Mute Toggle */}
            <button 
              className="mute-toggle"
              onClick={() => videoRef.current?.muted = !videoRef.current.muted}
              aria-label="Toggle mute"
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .video-sidebar {
          position: fixed;
          top: 0;
          width: 320px;
          height: 100vh;
          background: #000;
          z-index: 1000;
          box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
        }

        .video-sidebar-right {
          right: 0;
        }

        .video-sidebar-left {
          left: 0;
        }

        .video-sidebar-toggle {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          cursor: pointer;
          z-index: 1001;
          font-size: 16px;
          transition: background 0.2s;
        }

        .video-sidebar-toggle:hover {
          background: #fff;
        }

        .video-sidebar-content {
          width: 100%;
          height: 100%;
        }

        .video-player-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .video-player {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-info-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
          padding: 20px;
          color: white;
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

        .video-cta-button {
          display: inline-block;
          background: #ff6b35;
          color: white;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          transition: background 0.2s;
        }

        .video-cta-button:hover {
          background: #ff8555;
        }

        .video-navigation {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          transform: translateY(-50%);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 10px;
        }

        .nav-button {
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          font-size: 24px;
          transition: background 0.2s;
        }

        .nav-button:hover {
          background: #fff;
        }

        .video-counter {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
        }

        .mute-toggle {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          cursor: pointer;
          z-index: 1001;
          font-size: 16px;
          transition: background 0.2s;
        }

        .mute-toggle:hover {
          background: #fff;
        }

        @media (max-width: 768px) {
          .video-sidebar {
            width: 280px;
          }

          .video-title {
            font-size: 16px;
          }

          .video-description {
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .video-sidebar {
            width: 100%;
            height: 200px;
            top: auto;
            bottom: 0;
          }

          .video-sidebar-right,
          .video-sidebar-left {
            right: 0;
            left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoSidebar;
