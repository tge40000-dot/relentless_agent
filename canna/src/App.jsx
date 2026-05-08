import React, { useState, useEffect } from 'react';
import BeatsMarketplace from '../BeatsMarketplace';
import MediaAdmin from '../MediaAdmin';

function App() {
  const [activeTab, setActiveTab] = useState('got-beats');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load user data from localStorage or auth system
    const userData = {
      membershipTier: localStorage.getItem('rb_membership_tier') || null,
      role: localStorage.getItem('rb_auth_user') || 'guest'
    };
    setUser(userData);
  }, []);

  return (
    <div className="app">
      <nav className="nav">
        <button 
          onClick={() => setActiveTab('got-beats')}
          className={activeTab === 'got-beats' ? 'active' : ''}
        >
          GOT BEATS?
        </button>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setActiveTab('media')}
            className={activeTab === 'media' ? 'active' : ''}
          >
            Media Admin
          </button>
        )}
      </nav>

      <div className="container">
        {activeTab === 'got-beats' && (
          <BeatsMarketplace 
            apiBaseUrl="https://relentless-billionaire-api.tge40000.workers.dev"
            userMembership={user?.membershipTier}
          />
        )}

        {activeTab === 'media' && user?.role === 'admin' && (
          <MediaAdmin 
            apiBaseUrl="https://relentless-billionaire-api.tge40000.workers.dev"
          />
        )}
      </div>

      <style jsx>{`
        .app {
          min-height: 100vh;
          background: #0a0a0a;
          color: #fff;
        }

        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 20px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
          z-index: 1000;
        }

        .nav button {
          background: transparent;
          color: #888;
          border: 2px solid transparent;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
          border-radius: 8px;
        }

        .nav button:hover {
          color: #d4af37;
          border-color: rgba(212, 175, 55, 0.3);
        }

        .nav button.active {
          color: #d4af37;
          border-color: #d4af37;
          background: rgba(212, 175, 55, 0.1);
        }

        .container {
          padding: 100px 20px 40px;
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .nav {
            flex-direction: column;
            align-items: center;
            padding: 16px;
          }

          .nav button {
            width: 100%;
            max-width: 200px;
          }

          .container {
            padding: 140px 16px 20px;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
