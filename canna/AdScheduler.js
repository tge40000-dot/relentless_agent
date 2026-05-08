// AdScheduler.js - Banner Rotation and Ad Scheduling System
// Simple, intelligent ad rotation with scheduling capabilities

import React, { useState, useEffect } from 'react';

const AdScheduler = ({ 
  ads = [], 
  defaultRotationInterval = 5000,
  enableScheduling = true,
  enableTargeting = true,
  userMembership = null
}) => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [visibleAds, setVisibleAds] = useState([]);
  const [schedule, setSchedule] = useState([]);

  // Filter ads based on scheduling and targeting
  useEffect(() => {
    let filtered = [...ads];

    // Filter by schedule (time-based)
    if (enableScheduling) {
      const now = new Date();
      filtered = filtered.filter(ad => {
        if (!ad.schedule) return true;
        
        const { startDate, endDate, daysOfWeek, hours } = ad.schedule;
        
        // Check date range
        if (startDate && new Date(startDate) > now) return false;
        if (endDate && new Date(endDate) < now) return false;
        
        // Check days of week
        if (daysOfWeek && daysOfWeek.length > 0) {
          const currentDay = now.getDay();
          if (!daysOfWeek.includes(currentDay)) return false;
        }
        
        // Check hours
        if (hours && hours.length > 0) {
          const currentHour = now.getHours();
          if (!hours.includes(currentHour)) return false;
        }
        
        return true;
      });
    }

    // Filter by membership targeting
    if (enableTargeting && userMembership) {
      filtered = filtered.filter(ad => {
        if (!ad.targeting) return true;
        
        const { membershipTiers } = ad.targeting;
        if (!membershipTiers || membershipTiers.length === 0) return true;
        
        return membershipTiers.includes(userMembership);
      });
    }

    // Filter by priority (show higher priority ads more often)
    filtered.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    setVisibleAds(filtered);
    setCurrentAdIndex(0);
  }, [ads, enableScheduling, enableTargeting, userMembership]);

  // Auto-rotate ads
  useEffect(() => {
    if (visibleAds.length === 0) return;

    const interval = setInterval(() => {
      setCurrentAdIndex(prev => {
        // Weighted rotation based on priority
        if (visibleAds.length === 1) return 0;
        
        const nextIndex = (prev + 1) % visibleAds.length;
        return nextIndex;
      });
    }, visibleAds[currentAdIndex]?.rotationInterval || defaultRotationInterval);

    return () => clearInterval(interval);
  }, [visibleAds, currentAdIndex, defaultRotationInterval]);

  // Track ad impressions
  useEffect(() => {
    if (visibleAds[currentAdIndex] && window.gtag) {
      window.gtag('event', 'ad_impression', {
        ad_id: visibleAds[currentAdIndex].id,
        ad_title: visibleAds[currentAdIndex].title,
        membership_tier: userMembership || 'guest'
      });
    }
  }, [currentAdIndex, visibleAds, userMembership]);

  const handleAdClick = (ad) => {
    if (window.gtag) {
      window.gtag('event', 'ad_click', {
        ad_id: ad.id,
        ad_title: ad.title,
        membership_tier: userMembership || 'guest'
      });
    }
  };

  const handleAdDismiss = (adId) => {
    // Remove dismissed ad from visible ads
    setVisibleAds(prev => prev.filter(ad => ad.id !== adId));
    
    if (window.gtag) {
      window.gtag('event', 'ad_dismiss', {
        ad_id: adId,
        membership_tier: userMembership || 'guest'
      });
    }
  };

  if (visibleAds.length === 0) return null;

  const currentAd = visibleAds[currentAdIndex];

  return (
    <div className="ad-scheduler">
      <div className="ad-container">
        {currentAd && (
          <div className="ad-content">
            {/* Dismiss Button */}
            <button 
              className="ad-dismiss"
              onClick={() => handleAdDismiss(currentAd.id)}
              aria-label="Dismiss ad"
            >
              ✕
            </button>

            {/* Ad Image/Video */}
            {currentAd.media && (
              <div className="ad-media">
                {currentAd.media.type === 'video' ? (
                  <video
                    src={currentAd.media.url}
                    poster={currentAd.media.poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="ad-video"
                  />
                ) : (
                  <img
                    src={currentAd.media.url}
                    alt={currentAd.title}
                    className="ad-image"
                  />
                )}
              </div>
            )}

            {/* Ad Text Content */}
            <div className="ad-text">
              {currentAd.badge && (
                <span className={`ad-badge badge-${currentAd.badge.type}`}>
                  {currentAd.badge.text}
                </span>
              )}
              
              {currentAd.title && (
                <h3 className="ad-title">{currentAd.title}</h3>
              )}
              
              {currentAd.subtitle && (
                <p className="ad-subtitle">{currentAd.subtitle}</p>
              )}
              
              {currentAd.description && (
                <p className="ad-description">{currentAd.description}</p>
              )}
              
              {currentAd.cta && (
                <a 
                  href={currentAd.cta.url} 
                  className="ad-cta-button"
                  onClick={() => handleAdClick(currentAd)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {currentAd.cta.text}
                </a>
              )}
            </div>

            {/* Ad Counter */}
            {visibleAds.length > 1 && (
              <div className="ad-counter">
                {currentAdIndex + 1} / {visibleAds.length}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .ad-scheduler {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          overflow: hidden;
        }

        .ad-container {
          position: relative;
          width: 100%;
          min-height: 200px;
        }

        .ad-content {
          position: relative;
          width: 100%;
          min-height: 200px;
        }

        .ad-dismiss {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          cursor: pointer;
          z-index: 10;
          font-size: 14px;
          transition: background 0.2s;
        }

        .ad-dismiss:hover {
          background: white;
        }

        .ad-media {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
        }

        .ad-image,
        .ad-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ad-text {
          position: relative;
          z-index: 1;
          background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%);
          padding: 20px;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          color: white;
        }

        .ad-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
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

        .badge-exclusive {
          background: #7c4dff;
        }

        .ad-title {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 700;
        }

        .ad-subtitle {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 500;
          opacity: 0.95;
        }

        .ad-description {
          margin: 0 0 20px 0;
          font-size: 14px;
          opacity: 0.9;
          max-width: 600px;
          line-height: 1.5;
        }

        .ad-cta-button {
          display: inline-block;
          background: #ff6b35;
          color: white;
          padding: 12px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .ad-cta-button:hover {
          background: #ff8555;
          transform: scale(1.05);
        }

        .ad-counter {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          z-index: 10;
        }

        @media (max-width: 768px) {
          .ad-title {
            font-size: 20px;
          }

          .ad-subtitle {
            font-size: 14px;
          }

          .ad-description {
            font-size: 12px;
          }

          .ad-cta-button {
            padding: 10px 24px;
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .ad-text {
            padding: 16px;
          }

          .ad-title {
            font-size: 18px;
          }

          .ad-subtitle {
            font-size: 12px;
          }

          .ad-description {
            font-size: 11px;
          }

          .ad-cta-button {
            padding: 8px 20px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdScheduler;

// Ad Configuration Example:
/*
const ads = [
  {
    id: 'ad-1',
    title: 'PRO Membership - 25% OFF',
    subtitle: 'Limited Time Offer',
    description: 'Get 25% discount on all services with PRO tier',
    badge: {
      type: 'promo',
      text: 'PROMO'
    },
    cta: {
      text: 'Join Now',
      url: '/memberships'
    },
    media: {
      type: 'image',
      url: 'https://your-r2-url.com/images/ad1.jpg'
    },
    priority: 10,
    rotationInterval: 5000,
    schedule: {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    },
    targeting: {
      membershipTiers: ['STARTER', 'guest']
    }
  },
  {
    id: 'ad-2',
    title: 'ELITE Tier - 40% OFF',
    subtitle: 'Best Value',
    description: 'Maximum savings with ELITE membership',
    badge: {
      type: 'exclusive',
      text: 'EXCLUSIVE'
    },
    cta: {
      text: 'Upgrade Now',
      url: '/memberships'
    },
    media: {
      type: 'image',
      url: 'https://your-r2-url.com/images/ad2.jpg'
    },
    priority: 8,
    rotationInterval: 7000,
    schedule: {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    },
    targeting: {
      membershipTiers: ['PRO', 'STARTER']
    }
  }
];
*/
