// AnimatedBanner.js - Animated Banner Component System
// Simple, responsive, and easy to use

import React, { useState, useEffect } from 'react';

const AnimatedBanner = ({ 
  banners = [], 
  autoRotate = true, 
  interval = 5000,
  showIndicators = true,
  showArrows = true,
  position = 'top'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate banners
  useEffect(() => {
    if (!autoRotate || banners.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoRotate, banners.length, interval, isPaused]);

  // Track banner views for analytics
  useEffect(() => {
    if (banners[currentIndex] && window.gtag) {
      window.gtag('event', 'banner_view', {
        banner_id: banners[currentIndex].id,
        banner_title: banners[currentIndex].title
      });
    }
  }, [currentIndex, banners]);

  const handleBannerClick = (banner) => {
    if (window.gtag) {
      window.gtag('event', 'banner_click', {
        banner_id: banner.id,
        banner_title: banner.title
      });
    }
  };

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  return (
    <div 
      className={`animated-banner animated-banner-${position}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner Content */}
      <div className="banner-container">
        {currentBanner && (
          <div 
            className="banner-slide"
            style={{
              backgroundImage: sanitizeCssUrl(currentBanner.image),
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="banner-overlay">
              <div className="banner-content">
                {currentBadge(currentBanner.badge) && (
                  <span className={`banner-badge badge-${currentBanner.badge.type}`}>
                    {currentBanner.badge.text}
                  </span>
                )}
                
                {currentBanner.title && (
                  <h2 className="banner-title">{currentBanner.title}</h2>
                )}
                
                {currentBanner.subtitle && (
                  <p className="banner-subtitle">{currentBanner.subtitle}</p>
                )}
                
                {currentBanner.description && (
                  <p className="banner-description">{currentBanner.description}</p>
                )}
                
                {currentBanner.cta && (
                  <a 
                    href={currentBanner.cta.url} 
                    className="banner-cta-button"
                    onClick={() => handleBannerClick(currentBanner)}
                  >
                    {currentBanner.cta.text}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {showArrows && banners.length > 1 && (
        <>
          <button className="banner-arrow banner-arrow-prev" onClick={prevBanner}>
            ‹
          </button>
          <button className="banner-arrow banner-arrow-next" onClick={nextBanner}>
            ›
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && banners.length > 1 && (
        <div className="banner-indicators">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .animated-banner {
          position: relative;
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          overflow: hidden;
        }

        .animated-banner-top {
          position: sticky;
          top: 0;
          z-index: 999;
        }

        .animated-banner-bottom {
          position: sticky;
          bottom: 0;
          z-index: 999;
        }

        .banner-container {
          width: 100%;
          min-height: 200px;
        }

        .banner-slide {
          width: 100%;
          height: 100%;
          min-height: 200px;
          transition: opacity 0.5s ease-in-out;
          animation: fadeIn 0.5s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .banner-overlay {
          background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%);
          width: 100%;
          height: 100%;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .banner-content {
          text-align: center;
          color: white;
          max-width: 800px;
        }

        .banner-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .badge-promo {
          background: #ff6b35;
        }

        .badge-new {
          background: #00c853;
        }

        .badge-limited {
          background: #ff1744;
        }

        .banner-title {
          margin: 0 0 8px 0;
          font-size: 32px;
          font-weight: 700;
          animation: slideUp 0.6s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .banner-subtitle {
          margin: 0 0 12px 0;
          font-size: 18px;
          font-weight: 500;
          opacity: 0.95;
        }

        .banner-description {
          margin: 0 0 20px 0;
          font-size: 16px;
          opacity: 0.9;
          line-height: 1.5;
        }

        .banner-cta-button {
          display: inline-block;
          background: #ff6b35;
          color: white;
          padding: 12px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .banner-cta-button:hover {
          background: #ff8555;
          transform: scale(1.05);
        }

        .banner-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          cursor: pointer;
          font-size: 32px;
          color: #333;
          transition: all 0.3s ease;
          z-index: 1001;
        }

        .banner-arrow:hover {
          background: white;
          transform: translateY(-50%) scale(1.1);
        }

        .banner-arrow-prev {
          left: 16px;
        }

        .banner-arrow-next {
          right: 16px;
        }

        .banner-indicators {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 1001;
        }

        .indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .indicator:hover {
          background: rgba(255, 255, 255, 0.8);
        }

        .indicator.active {
          background: white;
          transform: scale(1.2);
        }

        @media (max-width: 768px) {
          .banner-title {
            font-size: 24px;
          }

          .banner-subtitle {
            font-size: 16px;
          }

          .banner-description {
            font-size: 14px;
          }

          .banner-cta-button {
            padding: 10px 24px;
            font-size: 14px;
          }

          .banner-arrow {
            width: 40px;
            height: 40px;
            font-size: 24px;
          }

          .banner-arrow-prev {
            left: 8px;
          }

          .banner-arrow-next {
            right: 8px;
          }
        }

        @media (max-width: 480px) {
          .banner-container {
            min-height: 180px;
          }

          .banner-overlay {
            min-height: 180px;
            padding: 16px;
          }

          .banner-title {
            font-size: 20px;
          }

          .banner-subtitle {
            font-size: 14px;
          }

          .banner-description {
            font-size: 12px;
          }

          .banner-cta-button {
            padding: 8px 20px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to check if badge exists
function currentBadge(badge) {
  return badge && badge.text && badge.type;
}

// Helper function to sanitize URL for CSS
function sanitizeCssUrl(url) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return undefined;
    }
    return `url("${url}")`;
  } catch {
    return undefined;
  }
}

export default AnimatedBanner;
