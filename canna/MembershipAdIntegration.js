// MembershipAdIntegration.js - Integration with Membership Tier System for Premium Ads
// Connects advertising system with membership tiers for targeted content

import React, { useState, useEffect } from 'react';

const MembershipAdIntegration = ({ 
  userMembership = null,
  ads = [],
  children
}) => {
  const [memberAds, setMemberAds] = useState([]);
  const [discountBanner, setDiscountBanner] = useState(null);

  const MEMBERSHIP_TIERS = {
    STARTER: {
      name: 'STARTER',
      price: 49,
      discount: 0.10,
      perks: ['10% off services', 'Basic support']
    },
    PRO: {
      name: 'PRO',
      price: 199,
      discount: 0.25,
      perks: ['25% off services', 'Priority support', 'Exclusive content'],
      featured: true
    },
    ELITE: {
      name: 'ELITE',
      price: 499,
      discount: 0.40,
      perks: ['40% off services', 'VIP support', 'Premium content', 'Early access']
    }
  };

  // Filter ads based on membership tier
  useEffect(() => {
    const filtered = ads.filter(ad => {
      if (!ad.targeting) return true;
      
      const { membershipTiers, minTier } = ad.targeting;
      
      // If no targeting specified, show to all
      if (!membershipTiers && !minTier) return true;
      
      // If user is not a member, show ads targeting non-members
      if (!userMembership) {
        return membershipTiers?.includes('guest') || minTier === 'guest';
      }
      
      // Check if user's tier is in targeting list
      if (membershipTiers && membershipTiers.length > 0) {
        return membershipTiers.includes(userMembership);
      }
      
      // Check minimum tier requirement
      if (minTier) {
        const tierOrder = ['STARTER', 'PRO', 'ELITE'];
        const userTierIndex = tierOrder.indexOf(userMembership);
        const minTierIndex = tierOrder.indexOf(minTier);
        return userTierIndex >= minTierIndex;
      }
      
      return true;
    });

    setMemberAds(filtered);
  }, [ads, userMembership]);

  // Generate discount banner based on membership
  useEffect(() => {
    if (!userMembership) {
      // Show upgrade prompt for non-members
      setDiscountBanner({
        type: 'upgrade',
        title: 'Join PRO - 25% OFF',
        subtitle: 'Limited time offer',
        description: 'Get 25% discount on all services with PRO membership',
        cta: { text: 'Join Now', url: '/memberships' },
        badge: { type: 'promo', text: 'PROMO' }
      });
    } else {
      const tier = MEMBERSHIP_TIERS[userMembership];
      if (tier) {
        setDiscountBanner({
          type: 'member',
          title: `${tier.name} Member`,
          subtitle: `${tier.discount * 100}% OFF All Services`,
          description: tier.perks.join(' • '),
          cta: null,
          badge: { type: 'new', text: 'MEMBER' }
        });
      }
    }
  }, [userMembership]);

  // Calculate discounted price for services
  const calculateDiscountedPrice = (originalPrice) => {
    if (!userMembership) return originalPrice;
    
    const tier = MEMBERSHIP_TIERS[userMembership];
    if (!tier) return originalPrice;
    
    return originalPrice * (1 - tier.discount);
  };

  // Get service pricing with member discount
  const getServicePricing = (serviceName, originalPrice) => {
    const pricing = {
      service: serviceName,
      original: originalPrice,
      discounted: calculateDiscountedPrice(originalPrice),
      savings: originalPrice - calculateDiscountedPrice(originalPrice),
      discountPercent: userMembership ? MEMBERSHIP_TIERS[userMembership].discount * 100 : 0
    };
    
    return pricing;
  };

  // Check if user can access premium content
  const canAccessPremium = (requiredTier = 'PRO') => {
    if (!userMembership) return false;
    
    const tierOrder = ['STARTER', 'PRO', 'ELITE'];
    const userTierIndex = tierOrder.indexOf(userMembership);
    const requiredTierIndex = tierOrder.indexOf(requiredTier);
    
    return userTierIndex >= requiredTierIndex;
  };

  // Get membership upgrade suggestion
  const getUpgradeSuggestion = () => {
    if (!userMembership) {
      return {
        from: 'guest',
        to: 'PRO',
        reason: 'Get 25% off all services',
        url: '/memberships'
      };
    }
    
    const tierOrder = ['STARTER', 'PRO', 'ELITE'];
    const currentIndex = tierOrder.indexOf(userMembership);
    
    if (currentIndex < tierOrder.length - 1) {
      const nextTier = tierOrder[currentIndex + 1];
      const nextTierInfo = MEMBERSHIP_TIERS[nextTier];
      const currentTierInfo = MEMBERSHIP_TIERS[userMembership];
      
      return {
        from: userMembership,
        to: nextTier,
        reason: `Increase discount from ${currentTierInfo.discount * 100}% to ${nextTierInfo.discount * 100}%`,
        url: '/memberships'
      };
    }
    
    return null; // Already at highest tier
  };

  return (
    <div className="membership-ad-integration">
      {/* Discount Banner */}
      {discountBanner && (
        <div className={`discount-banner banner-${discountBanner.type}`}>
          {discountBanner.badge && (
            <span className={`banner-badge badge-${discountBanner.badge.type}`}>
              {discountBanner.badge.text}
            </span>
          )}
          <h3 className="banner-title">{discountBanner.title}</h3>
          {discountBanner.subtitle && (
            <p className="banner-subtitle">{discountBanner.subtitle}</p>
          )}
          {discountBanner.description && (
            <p className="banner-description">{discountBanner.description}</p>
          )}
          {discountBanner.cta && (
            <a href={discountBanner.cta.url} className="banner-cta">
              {discountBanner.cta.text}
            </a>
          )}
        </div>
      )}

      {/* Render children with membership context */}
      {children && typeof children === 'function' ? (
        children({
          userMembership,
          memberAds,
          discountBanner,
          calculateDiscountedPrice,
          getServicePricing,
          canAccessPremium,
          getUpgradeSuggestion,
          MEMBERSHIP_TIERS
        })
      ) : (
        children
      )}

      <style jsx>{`
        .membership-ad-integration {
          width: 100%;
        }

        .discount-banner {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          color: white;
          margin-bottom: 20px;
        }

        .banner-upgrade {
          background: linear-gradient(135deg, #ff6b35 0%, #ff8555 100%);
        }

        .banner-member {
          background: linear-gradient(135deg, #00c853 0%, #00e676 100%);
        }

        .banner-badge {
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
          background: rgba(255, 255, 255, 0.2);
        }

        .badge-new {
          background: rgba(255, 255, 255, 0.2);
        }

        .banner-title {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 700;
        }

        .banner-subtitle {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 500;
          opacity: 0.95;
        }

        .banner-description {
          margin: 0 0 20px 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .banner-cta {
          display: inline-block;
          background: white;
          color: #667eea;
          padding: 12px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .banner-cta:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .banner-title {
            font-size: 20px;
          }

          .banner-subtitle {
            font-size: 14px;
          }

          .banner-description {
            font-size: 12px;
          }

          .banner-cta {
            padding: 10px 24px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default MembershipAdIntegration;

// Usage Example:
/*
function App() {
  const userMembership = 'PRO'; // or null for guest

  const ads = [
    {
      id: 'ad-1',
      title: 'Upgrade to ELITE',
      description: 'Get 40% off with ELITE tier',
      targeting: {
        membershipTiers: ['STARTER', 'PRO']
      }
    },
    {
      id: 'ad-2',
      title: 'Welcome to PRO',
      description: 'You have 25% discount on all services',
      targeting: {
        membershipTiers: ['PRO']
      }
    }
  ];

  return (
    <MembershipAdIntegration userMembership={userMembership} ads={ads}>
      {({
        userMembership,
        memberAds,
        calculateDiscountedPrice,
        getServicePricing,
        canAccessPremium,
        getUpgradeSuggestion
      }) => (
        <div>
          <h1>Services</h1>
          <p>Lead Generation: ${getServicePricing('Lead Generation', 500).discounted}</p>
          <p>Can access premium: {canAccessPremium('ELITE') ? 'Yes' : 'No'}</p>
          
          {getUpgradeSuggestion() && (
            <p>
              Upgrade to {getUpgradeSuggestion().to} - {getUpgradeSuggestion().reason}
            </p>
          )}
        </div>
      )}
    </MembershipAdIntegration>
  );
}
*/
