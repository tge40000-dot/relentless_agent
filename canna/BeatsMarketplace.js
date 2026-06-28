// BeatsMarketplace.js - Beats Marketplace with Purchase Interface
// Simple, clean marketplace for selling beats

import React, { useState, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';

const BeatsMarketplace = ({ 
  apiBaseUrl = 'https://api.relentlessbillionaire.com',
  userMembership = null
}) => {
  const [beats, setBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const membershipDiscount = userMembership === 'STARTER' ? 0.10 : 
                          userMembership === 'PRO' ? 0.25 : 
                          userMembership === 'ELITE' ? 0.40 : 0;

  useEffect(() => {
    loadBeats();
  }, []);

  const loadBeats = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/public/content/beats`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        setBeats(data.items || []);
      } else {
        setError('Failed to load beats');
      }
    } catch (err) {
      setError('Error loading beats');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (beat) => {
    // This would integrate with Stripe checkout
    console.log('Purchase beat:', beat);
    // TODO: Call Stripe checkout endpoint
    alert(`Purchase ${beat.title} for $${beat.price.toFixed(2)}`);
  };

  const filteredBeats = beats.filter(beat => {
    if (filter === 'all') return true;
    // Case-insensitive genre comparison
    const normalizedGenre = beat.genre?.toLowerCase() || '';
    if (filter === 'hiphop') return normalizedGenre === 'hip hop' || normalizedGenre === 'hip-hop';
    if (filter === 'trap') return normalizedGenre === 'trap';
    if (filter === 'rnb') return normalizedGenre === 'r&b' || normalizedGenre === 'rnb';
    if (filter === 'electronic') return normalizedGenre === 'electronic';
    return true;
  });

  const sortedBeats = [...filteredBeats].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    return 0;
  });

  return (
    <div className="beats-marketplace">
      <div className="marketplace-header">
        <h1>GOT BEATS?</h1>
        <p>Premium beats for your next project</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Filters */}
      <div className="marketplace-filters">
        <div className="filter-group">
          <label>Genre:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Genres</option>
            <option value="hiphop">Hip Hop</option>
            <option value="trap">Trap</option>
            <option value="rnb">R&B</option>
            <option value="electronic">Electronic</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        {userMembership && membershipDiscount > 0 && (
          <div className="member-discount-badge">
            {userMembership} Member: {membershipDiscount * 100}% OFF
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading beats...</p>
        </div>
      ) : sortedBeats.length === 0 ? (
        <div className="empty-state">
          <p>No beats available</p>
        </div>
      ) : (
        <div className="beats-grid">
          {sortedBeats.map(beat => (
            <div key={beat.id} className="beat-card">
              <div className="beat-cover">
                {beat.coverImage ? (
                  <img src={beat.coverImage} alt={beat.title} />
                ) : (
                  <div className="default-cover">🎵</div>
                )}
              </div>

              <div className="beat-info">
                <h3 className="beat-title">{beat.title}</h3>
                <p className="beat-artist">{beat.artist}</p>
                {beat.genre && (
                  <span className="beat-genre">{beat.genre}</span>
                )}
                {beat.bpm && (
                  <span className="beat-bpm">{beat.bpm} BPM</span>
                )}
                {beat.key && (
                  <span className="beat-key">{beat.key}</span>
                )}
              </div>

              <AudioPlayer
                src={beat.audioUrl}
                title={beat.title}
                artist={beat.artist}
                price={beat.price}
                membershipDiscount={membershipDiscount}
                onPurchase={handlePurchase}
                showPurchaseButton
                purchaseText="Buy License"
              />
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .beats-marketplace {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .marketplace-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .marketplace-header h1 {
          margin: 0 0 8px 0;
          font-size: 48px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .marketplace-header p {
          margin: 0;
          font-size: 18px;
          color: #666;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .alert-error {
          background: #fee;
          color: #c33;
          border: 1px solid #fcc;
        }

        .alert button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
        }

        .marketplace-filters {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
          align-items: center;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-group label {
          font-weight: 600;
          color: #333;
        }

        .filter-group select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .member-discount-badge {
          background: linear-gradient(135deg, #00c853 0%, #00e676 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
          font-size: 18px;
        }

        .beats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .beat-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }

        .beat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .beat-cover {
          width: 100%;
          height: 200px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .beat-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .default-cover {
          font-size: 64px;
        }

        .beat-info {
          padding: 16px;
        }

        .beat-title {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .beat-artist {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #666;
        }

        .beat-genre,
        .beat-bpm,
        .beat-key {
          display: inline-block;
          padding: 4px 8px;
          background: #f0f0f0;
          border-radius: 4px;
          font-size: 12px;
          color: #666;
          margin-right: 4px;
          margin-bottom: 4px;
        }

        @media (max-width: 768px) {
          .beats-marketplace {
            padding: 16px;
          }

          .marketplace-header h1 {
            font-size: 36px;
          }

          .marketplace-filters {
            flex-direction: column;
            align-items: flex-start;
          }

          .beats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default BeatsMarketplace;
