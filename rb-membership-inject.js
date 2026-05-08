/**
 * Relentless Billionaire - Membership Injection Script
 * Injects membership cards, discount banner, and admin dashboard via DOM manipulation
 */

(function() {
  'use strict';

  const CONFIG = {
    membershipStorageKey: 'rb_hub_memberships',
    bannerDismissedKey: 'rb_banner_dismissed',
    authUserKey: 'rb_auth_user',
    apiBaseUrl: 'https://relentlessbillionaire.com/api/content'
  };

  let isAdmin = false;
  let memberships = [];
  let storeServices = [];

  function checkAdminStatus() {
    try {
      const authUser = localStorage.getItem(CONFIG.authUserKey);
      if (authUser) {
        const user = JSON.parse(authUser);
        isAdmin = !!(user && (user.role === 'admin' || user.isAdmin));
      }
    } catch (e) {}
  }

  function loadLocalStorageData() {
    try {
      const membershipsData = localStorage.getItem(CONFIG.membershipStorageKey);
      if (membershipsData) memberships = JSON.parse(membershipsData);
      else {
        // Fallback data if KV not populated
        memberships = [
          {
            id: "tier-starter",
            name: "STARTER",
            price: 49,
            price_unit: "month",
            discount: 0.10,
            featured: false,
            perks: ["10% off all services", "Basic lead generation access", "Email support"],
            savings: "$50 on Lead Gen, $20 on Flyer, $100 on Outreach, $200 on Consulting",
            createdAt: "2026-04-16T00:00:00Z"
          },
          {
            id: "tier-pro",
            name: "PRO",
            price: 199,
            price_unit: "month",
            discount: 0.25,
            featured: true,
            perks: ["25% off all services", "Advanced lead generation", "Priority email & SMS support", "Monthly strategy call"],
            savings: "$125 on Lead Gen, $50 on Flyer, $250 on Outreach, $500 on Consulting",
            createdAt: "2026-04-16T00:00:00Z"
          },
          {
            id: "tier-elite",
            name: "ELITE",
            price: 499,
            price_unit: "month",
            discount: 0.40,
            featured: false,
            perks: ["40% off all services", "Unlimited lead generation", "24/7 priority support", "Weekly strategy calls", "Exclusive access to new features"],
            savings: "$200 on Lead Gen, $80 on Flyer, $400 on Outreach, $800 on Consulting",
            createdAt: "2026-04-16T00:00:00Z"
          }
        ];
      }

      const servicesData = localStorage.getItem('rb_hub_store_services');
      if (servicesData) storeServices = JSON.parse(servicesData);
    } catch (e) {}
  }

  function waitForReact(callback, maxAttempts = 100, interval = 100) {
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      const root = document.getElementById('root');
      if (root && root.children.length > 0 && root.innerHTML.trim().length > 100) {
        clearInterval(checkInterval);
        callback();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        callback();
      }
    }, interval);
  }

  function createMembershipBanner() {
    const dismissed = sessionStorage.getItem(CONFIG.bannerDismissedKey);
    if (dismissed) return null;

    const banner = document.createElement('div');
    banner.id = 'rb-membership-banner';
    banner.className = 'rb-membership-banner';
    banner.innerHTML = `
      <div class="rb-banner-content">
        <span class="rb-banner-text">MEMBERS SAVE UP TO 40% ON ALL SERVICES — JOIN NOW</span>
        <button class="rb-banner-dismiss" onclick="dismissBanner()">×</button>
      </div>
    `;
    return banner;
  }

  window.dismissBanner = function() {
    const banner = document.getElementById('rb-membership-banner');
    if (banner) {
      banner.style.display = 'none';
      sessionStorage.setItem(CONFIG.bannerDismissedKey, 'true');
    }
  };

  function createMembershipCards() {
    if (!memberships || memberships.length === 0) return null;

    const container = document.createElement('div');
    container.id = 'rb-membership-cards';
    container.className = 'rb-membership-cards';
    container.innerHTML = '<h2 class="rb-section-title">MEMBERSHIP PLANS</h2>';

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'rb-cards-grid';

    memberships.forEach(tier => {
      const card = document.createElement('div');
      card.className = `rb-membership-card ${tier.featured ? 'rb-featured' : ''}`;
      
      const perksList = tier.perks ? tier.perks.map(p => `<li>✓ ${p}</li>`).join('') : '';
      
      card.innerHTML = `
        ${tier.featured ? '<div class="rb-badge-popular">MOST POPULAR</div>' : ''}
        <div class="rb-tier-name">${tier.name}</div>
        <div class="rb-tier-price">${tier.price_unit === 'month' ? '$' + tier.price + '/mo' : tier.price}</div>
        <div class="rb-tier-discount">SAVE ${(tier.discount * 100).toFixed(0)}%</div>
        <ul class="rb-tier-perks">${perksList}</ul>
        <button class="rb-join-btn" onclick="joinMembership('${tier.id}', '${tier.name}')">Join Now</button>
      `;
      cardsContainer.appendChild(card);
    });

    container.appendChild(cardsContainer);
    return container;
  }

  window.joinMembership = function(tierId, tierName) {
    const inquiry = {
      id: 'inq_' + Date.now(),
      name: '',
      email: '',
      message: 'Membership inquiry',
      serviceName: 'Membership - ' + tierName,
      type: 'membership',
      tier: tierId.replace('tier-', ''),
      createdAt: new Date().toISOString()
    };

    fetch(CONFIG.apiBaseUrl + '/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': 'rb-admin-2026'
      },
      body: JSON.stringify(inquiry)
    }).then(() => {
      alert('Membership inquiry submitted! We will contact you shortly.');
    }).catch(() => {
      alert('Error submitting inquiry. Please try again.');
    });
  };

  function addMemberPricingToServices() {
    if (!storeServices || storeServices.length === 0) return;

    const eliteDiscount = 0.4;
    const serviceCards = document.querySelectorAll('.rb-service-card, [class*="service"], [class*="Service"]');
    
    serviceCards.forEach(card => {
      const priceEl = card.querySelector('[class*="price"], .price, [data-price]');
      if (priceEl && !card.querySelector('.rb-member-price')) {
        const priceText = priceEl.textContent;
        const priceMatch = priceText.match(/\$?(\d+)/);
        if (priceMatch) {
          const originalPrice = parseInt(priceMatch[1]);
          const elitePrice = Math.round(originalPrice * (1 - eliteDiscount));
          
          const memberPrice = document.createElement('div');
          memberPrice.className = 'rb-member-price';
          memberPrice.textContent = `As low as $${elitePrice} with Elite membership`;
          priceEl.parentNode.insertBefore(memberPrice, priceEl.nextSibling);
        }
      }
    });
  }

  function createAdminDashboardButton() {
    if (!isAdmin) return null;

    const button = document.createElement('button');
    button.id = 'rb-admin-dashboard-btn';
    button.className = 'rb-admin-dashboard-btn';
    button.textContent = '📊 Dashboard';
    button.onclick = toggleAdminDashboard;
    return button;
  }

  function createAdminDashboard() {
    if (!isAdmin) return null;

    const dashboard = document.createElement('div');
    dashboard.id = 'rb-admin-dashboard';
    dashboard.className = 'rb-admin-dashboard';
    dashboard.style.display = 'none';

    const artistsCount = localStorage.getItem('rb_hub_artists') ? JSON.parse(localStorage.getItem('rb_hub_artists')).length : 0;
    const videosCount = localStorage.getItem('rb_hub_videos') ? JSON.parse(localStorage.getItem('rb_hub_videos')).length : 0;
    const bookingsCount = localStorage.getItem('rb_hub_bookings') ? JSON.parse(localStorage.getItem('rb_hub_bookings')).length : 0;
    const inquiriesCount = localStorage.getItem('rb_hub_inquiries') ? JSON.parse(localStorage.getItem('rb_hub_inquiries')).length : 0;

    dashboard.innerHTML = `
      <div class="rb-dashboard-overlay" onclick="toggleAdminDashboard()"></div>
      <div class="rb-dashboard-content">
        <div class="rb-dashboard-header">
          <h2>Admin Dashboard</h2>
          <button class="rb-dashboard-close" onclick="toggleAdminDashboard()">×</button>
        </div>
        
        <div class="rb-stats-grid">
          <div class="rb-stat-card">
            <div class="rb-stat-number">${artistsCount}</div>
            <div class="rb-stat-label">Artists</div>
          </div>
          <div class="rb-stat-card">
            <div class="rb-stat-number">${videosCount}</div>
            <div class="rb-stat-label">Videos</div>
          </div>
          <div class="rb-stat-card">
            <div class="rb-stat-number">${bookingsCount}</div>
            <div class="rb-stat-label">Bookings</div>
          </div>
          <div class="rb-stat-card">
            <div class="rb-stat-number">${inquiriesCount}</div>
            <div class="rb-stat-label">Inquiries</div>
          </div>
        </div>

        <div class="rb-dashboard-section">
          <h3>Quick Actions</h3>
          <div class="rb-quick-actions">
            <button onclick="openAdminForm('artist')">Add Artist</button>
            <button onclick="openAdminForm('event')">Add Event</button>
            <button onclick="openAdminForm('service')">Add Service</button>
            <button onclick="openAdminForm('vendor')">Add Vendor</button>
          </div>
        </div>
      </div>
    `;
    return dashboard;
  }

  window.toggleAdminDashboard = function() {
    const dashboard = document.getElementById('rb-admin-dashboard');
    if (dashboard) {
      dashboard.style.display = dashboard.style.display === 'none' ? 'block' : 'none';
    }
  };

  window.openAdminForm = function(type) {
    alert(`Admin form for ${type} - to be implemented`);
  };

  function injectElements() {
    // Inject banner
    const banner = createMembershipBanner();
    if (banner) {
      const storeTab = document.querySelector('[data-tab="store"]') || document.body;
      storeTab.insertBefore(banner, storeTab.firstChild);
    }

    // Inject membership cards
    const cards = createMembershipCards();
    if (cards) {
      const storeContent = document.querySelector('[data-tab-content="store"]') || document.body;
      storeContent.appendChild(cards);
    }

    // Add member pricing to services
    addMemberPricingToServices();

    // Inject admin dashboard button and panel
    if (isAdmin) {
      const dashboardBtn = createAdminDashboardButton();
      const dashboard = createAdminDashboard();
      
      if (dashboardBtn) {
        const header = document.querySelector('header, .header, [class*="header"]');
        if (header) header.appendChild(dashboardBtn);
      }
      
      if (dashboard) {
        document.body.appendChild(dashboard);
      }
    }
  }

  function init() {
    checkAdminStatus();
    loadLocalStorageData();
    waitForReact(() => {
      setTimeout(injectElements, 500);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
