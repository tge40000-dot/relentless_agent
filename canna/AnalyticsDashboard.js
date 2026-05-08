// AnalyticsDashboard.js - Ad Performance Analytics Dashboard
// Simple, comprehensive analytics for tracking ad/banner/video performance

import React, { useState, useEffect } from 'react';

const AnalyticsDashboard = ({ 
  apiBaseUrl = 'https://api.relentlessbillionaire.com',
  dateRange = '7d'
}) => {
  const [metrics, setMetrics] = useState({
    impressions: 0,
    clicks: 0,
    ctr: 0,
    views: 0,
    completions: 0,
    revenue: 0,
    conversions: 0
  });
  const [topPerformers, setTopPerformers] = useState([]);
  const [byMembership, setByMembership] = useState([]);
  const [byTime, setByTime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  const dateRanges = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ];

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'ads', label: 'Ads' },
    { value: 'videos', label: 'Videos' },
    { value: 'memberships', label: 'Memberships' }
  ];

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');

    try {
      // In production, this would fetch from your analytics API
      // For now, we'll simulate the data structure
      
      const simulatedMetrics = {
        impressions: 15420,
        clicks: 892,
        ctr: 5.78,
        views: 3420,
        completions: 2150,
        revenue: 8750,
        conversions: 127
      };

      const simulatedTopPerformers = [
        { id: 'ad-1', title: 'PRO Membership - 25% OFF', impressions: 5420, clicks: 412, ctr: 7.6 },
        { id: 'ad-2', title: 'AI Lead Generation', impressions: 3200, clicks: 198, ctr: 6.19 },
        { id: 'video-1', title: 'Service Overview', views: 2100, completions: 1450, completionRate: 69.05 }
      ];

      const simulatedByMembership = [
        { tier: 'guest', impressions: 8420, clicks: 312, ctr: 3.71 },
        { tier: 'STARTER', impressions: 3200, clicks: 198, ctr: 6.19 },
        { tier: 'PRO', impressions: 2800, clicks: 282, ctr: 10.07 },
        { tier: 'ELITE', impressions: 1000, clicks: 100, ctr: 10.0 }
      ];

      const simulatedByTime = [
        { date: '2024-01-15', impressions: 2100, clicks: 125, revenue: 1250 },
        { date: '2024-01-16', impressions: 2300, clicks: 142, revenue: 1420 },
        { date: '2024-01-17', impressions: 1980, clicks: 118, revenue: 1180 },
        { date: '2024-01-18', impressions: 2450, clicks: 156, revenue: 1560 },
        { date: '2024-01-19', impressions: 2200, clicks: 135, revenue: 1350 },
        { date: '2024-01-20', impressions: 2580, clicks: 168, revenue: 1680 },
        { date: '2024-01-21', impressions: 1810, clicks: 148, revenue: 1310 }
      ];

      setMetrics(simulatedMetrics);
      setTopPerformers(simulatedTopPerformers);
      setByMembership(simulatedByMembership);
      setByTime(simulatedByTime);
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercent = (num) => {
    return `${num.toFixed(2)}%`;
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <div className="header-controls">
          <select 
            value={dateRange} 
            onChange={(e) => setSelectedTab(e.target.value)}
            className="date-range-selector"
          >
            {dateRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button onClick={loadAnalytics} className="refresh-button">
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="dashboard-tabs">
            {tabs.map(tab => (
              <button
                key={tab.value}
                className={`tab ${selectedTab === tab.value ? 'active' : ''}`}
                onClick={() => setSelectedTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="tab-content">
              {/* Key Metrics */}
              <div className="metrics-grid">
                <MetricCard
                  title="Total Impressions"
                  value={formatNumber(metrics.impressions)}
                  change="+12.5%"
                  positive
                />
                <MetricCard
                  title="Total Clicks"
                  value={formatNumber(metrics.clicks)}
                  change="+8.3%"
                  positive
                />
                <MetricCard
                  title="Click-Through Rate"
                  value={formatPercent(metrics.ctr)}
                  change="+2.1%"
                  positive
                />
                <MetricCard
                  title="Revenue"
                  value={formatCurrency(metrics.revenue)}
                  change="+15.7%"
                  positive
                />
              </div>

              {/* Top Performers */}
              <div className="dashboard-section">
                <h2>Top Performing Content</h2>
                <div className="performers-list">
                  {topPerformers.map((item, index) => (
                    <div key={item.id} className="performer-item">
                      <div className="performer-rank">#{index + 1}</div>
                      <div className="performer-info">
                        <h3>{item.title}</h3>
                        <div className="performer-stats">
                          {item.impressions && (
                            <span>{formatNumber(item.impressions)} impressions</span>
                          )}
                          {item.views && (
                            <span>{formatNumber(item.views)} views</span>
                          )}
                          {item.clicks && (
                            <span>{formatNumber(item.clicks)} clicks</span>
                          )}
                          {item.ctr && (
                            <span>{formatPercent(item.ctr)} CTR</span>
                          )}
                          {item.completionRate && (
                            <span>{formatPercent(item.completionRate)} completion</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance by Membership */}
              <div className="dashboard-section">
                <h2>Performance by Membership Tier</h2>
                <div className="membership-chart">
                  {byMembership.map((item, index) => (
                    <div key={item.tier} className="membership-bar">
                      <div className="bar-label">{item.tier}</div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill" 
                          style={{ width: `${(item.ctr / 15) * 100}%` }}
                        ></div>
                      </div>
                      <div className="bar-value">{formatPercent(item.ctr)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ads Tab */}
          {selectedTab === 'ads' && (
            <div className="tab-content">
              <div className="metrics-grid">
                <MetricCard
                  title="Ad Impressions"
                  value={formatNumber(metrics.impressions)}
                  change="+12.5%"
                  positive
                />
                <MetricCard
                  title="Ad Clicks"
                  value={formatNumber(metrics.clicks)}
                  change="+8.3%"
                  positive
                />
                <MetricCard
                  title="Ad CTR"
                  value={formatPercent(metrics.ctr)}
                  change="+2.1%"
                  positive
                />
                <MetricCard
                  title="Conversions"
                  value={formatNumber(metrics.conversions)}
                  change="+5.2%"
                  positive
                />
              </div>

              <div className="dashboard-section">
                <h2>Ad Performance Over Time</h2>
                <div className="time-chart">
                  {byTime.map((item, index) => (
                    <div key={item.date} className="time-bar">
                      <div className="bar-label">{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill revenue"
                          style={{ height: `${(item.revenue / 2000) * 100}%` }}
                        ></div>
                      </div>
                      <div className="bar-value">{formatCurrency(item.revenue)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Videos Tab */}
          {selectedTab === 'videos' && (
            <div className="tab-content">
              <div className="metrics-grid">
                <MetricCard
                  title="Video Views"
                  value={formatNumber(metrics.views)}
                  change="+18.2%"
                  positive
                />
                <MetricCard
                  title="Completions"
                  value={formatNumber(metrics.completions)}
                  change="+14.7%"
                  positive
                />
                <MetricCard
                  title="Completion Rate"
                  value={formatPercent((metrics.completions / metrics.views) * 100)}
                  change="+3.4%"
                  positive
                />
                <MetricCard
                  title="Avg Watch Time"
                  value="2:34"
                  change="+5.1%"
                  positive
                />
              </div>

              <div className="dashboard-section">
                <h2>Video Performance</h2>
                <div className="performers-list">
                  {topPerformers.filter(item => item.views).map((item, index) => (
                    <div key={item.id} className="performer-item">
                      <div className="performer-rank">#{index + 1}</div>
                      <div className="performer-info">
                        <h3>{item.title}</h3>
                        <div className="performer-stats">
                          <span>{formatNumber(item.views)} views</span>
                          <span>{formatNumber(item.completions)} completions</span>
                          <span>{formatPercent(item.completionRate)} completion</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Memberships Tab */}
          {selectedTab === 'memberships' && (
            <div className="tab-content">
              <div className="dashboard-section">
                <h2>Membership Tier Performance</h2>
                <div className="membership-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Tier</th>
                        <th>Impressions</th>
                        <th>Clicks</th>
                        <th>CTR</th>
                        <th>Conversions</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byMembership.map((item) => (
                        <tr key={item.tier}>
                          <td>{item.tier}</td>
                          <td>{formatNumber(item.impressions)}</td>
                          <td>{formatNumber(item.clicks)}</td>
                          <td>{formatPercent(item.ctr)}</td>
                          <td>{formatNumber(Math.round(item.clicks * 0.14))}</td>
                          <td>{formatCurrency(item.clicks * 10)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="dashboard-section">
                <h2>Membership Conversion Funnel</h2>
                <div className="funnel-chart">
                  <div className="funnel-step">
                    <div className="step-label">Guest Visitors</div>
                    <div className="step-bar" style={{ width: '100%' }}></div>
                    <div className="step-value">{formatNumber(byMembership.reduce((a, b) => a + b.impressions, 0))}</div>
                  </div>
                  <div className="funnel-step">
                    <div className="step-label">Clicks</div>
                    <div className="step-bar" style={{ width: '60%' }}></div>
                    <div className="step-value">{formatNumber(byMembership.reduce((a, b) => a + b.clicks, 0))}</div>
                  </div>
                  <div className="funnel-step">
                    <div className="step-label">Conversions</div>
                    <div className="step-bar" style={{ width: '25%' }}></div>
                    <div className="step-value">{formatNumber(metrics.conversions)}</div>
                  </div>
                  <div className="funnel-step">
                    <div className="step-label">Revenue</div>
                    <div className="step-bar" style={{ width: '15%' }}></div>
                    <div className="step-value">{formatCurrency(metrics.revenue)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .analytics-dashboard {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .dashboard-header h1 {
          margin: 0;
          font-size: 32px;
          color: #333;
        }

        .header-controls {
          display: flex;
          gap: 12px;
        }

        .date-range-selector,
        .refresh-button {
          padding: 10px 16px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 14px;
        }

        .refresh-button:hover {
          background: #f0f0f0;
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

        .dashboard-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          border-bottom: 2px solid #e0e0e0;
        }

        .tab {
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #333;
        }

        .tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .tab-content {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .dashboard-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .dashboard-section h2 {
          margin: 0 0 20px 0;
          font-size: 20px;
          color: #333;
        }

        .performers-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .performer-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .performer-rank {
          font-size: 24px;
          font-weight: 700;
          color: #667eea;
          min-width: 40px;
        }

        .performer-info h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #333;
        }

        .performer-stats {
          display: flex;
          gap: 16px;
          font-size: 14px;
          color: #666;
        }

        .membership-chart,
        .time-chart {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .membership-bar,
        .time-bar {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bar-label {
          min-width: 80px;
          font-size: 14px;
          color: #333;
        }

        .bar-container {
          flex: 1;
          height: 32px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: #667eea;
          transition: width 0.3s ease;
        }

        .bar-fill.revenue {
          background: #00c853;
        }

        .bar-value {
          min-width: 60px;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          text-align: right;
        }

        .membership-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .membership-table th,
        .membership-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        .membership-table th {
          font-weight: 600;
          color: #333;
          background: #f9f9f9;
        }

        .funnel-chart {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .funnel-step {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .step-label {
          min-width: 150px;
          font-size: 14px;
          color: #333;
        }

        .step-bar {
          flex: 1;
          height: 40px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px;
        }

        .step-value {
          min-width: 100px;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          text-align: right;
        }

        @media (max-width: 768px) {
          .analytics-dashboard {
            padding: 16px;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-tabs {
            overflow-x: auto;
          }

          .performer-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .membership-table {
            overflow-x: auto;
          }

          .funnel-step {
            flex-direction: column;
            align-items: flex-start;
          }

          .step-bar {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

const MetricCard = ({ title, value, change, positive }) => (
  <div className="metric-card">
    <h3 className="metric-title">{title}</h3>
    <p className="metric-value">{value}</p>
    <span className={`metric-change ${positive ? 'positive' : 'negative'}`}>
      {positive ? '↑' : '↓'} {change}
    </span>
    <style jsx>{`
      .metric-card {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .metric-title {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #666;
        font-weight: 500;
      }

      .metric-value {
        margin: 0 0 8px 0;
        font-size: 32px;
        color: #333;
        font-weight: 700;
      }

      .metric-change {
        font-size: 14px;
        font-weight: 600;
      }

      .metric-change.positive {
        color: #00c853;
      }

      .metric-change.negative {
        color: #ff1744;
      }

      @media (max-width: 768px) {
        .metric-value {
          font-size: 24px;
        }
      }
    `}</style>
  </div>
);

export default AnalyticsDashboard;
