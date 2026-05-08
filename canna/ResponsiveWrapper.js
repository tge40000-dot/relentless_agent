// ResponsiveWrapper.js - Responsive Design System for All Screen Sizes
// Ensures all components work perfectly on mobile, tablet, and desktop

import React, { useState, useEffect } from 'react';

const ResponsiveWrapper = ({ 
  children, 
  breakpoints = {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    wide: 1200
  }
}) => {
  const [screenSize, setScreenSize] = useState('desktop');
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setViewport({ width, height });
      
      if (width < breakpoints.mobile) {
        setScreenSize('mobile');
      } else if (width < breakpoints.tablet) {
        setScreenSize('mobile-lg');
      } else if (width < breakpoints.desktop) {
        setScreenSize('tablet');
      } else if (width < breakpoints.wide) {
        setScreenSize('desktop');
      } else {
        setScreenSize('wide');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoints]);

  return (
    <div className={`responsive-wrapper size-${screenSize}`}>
      {typeof children === 'function' 
        ? children({ screenSize, viewport, breakpoints })
        : children
      }
      
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .responsive-wrapper {
          width: 100%;
          min-height: 100vh;
        }

        /* Mobile (< 480px) */
        .size-mobile .container {
          max-width: 100%;
          padding: 12px;
        }

        .size-mobile h1 { font-size: 24px; }
        .size-mobile h2 { font-size: 20px; }
        .size-mobile h3 { font-size: 18px; }
        .size-mobile p { font-size: 14px; }
        .size-mobile button { font-size: 14px; padding: 8px 16px; }

        /* Mobile Large (480px - 768px) */
        .size-mobile-lg .container {
          max-width: 100%;
          padding: 16px;
        }

        .size-mobile-lg h1 { font-size: 28px; }
        .size-mobile-lg h2 { font-size: 22px; }
        .size-mobile-lg h3 { font-size: 20px; }
        .size-mobile-lg p { font-size: 15px; }
        .size-mobile-lg button { font-size: 15px; padding: 10px 20px; }

        /* Tablet (768px - 1024px) */
        .size-tablet .container {
          max-width: 720px;
          margin: 0 auto;
          padding: 20px;
        }

        .size-tablet h1 { font-size: 32px; }
        .size-tablet h2 { font-size: 26px; }
        .size-tablet h3 { font-size: 22px; }
        .size-tablet p { font-size: 16px; }
        .size-tablet button { font-size: 16px; padding: 12px 24px; }

        /* Desktop (1024px - 1200px) */
        .size-desktop .container {
          max-width: 960px;
          margin: 0 auto;
          padding: 24px;
        }

        .size-desktop h1 { font-size: 36px; }
        .size-desktop h2 { font-size: 30px; }
        .size-desktop h3 { font-size: 24px; }
        .size-desktop p { font-size: 16px; }
        .size-desktop button { font-size: 16px; padding: 12px 32px; }

        /* Wide (> 1200px) */
        .size-wide .container {
          max-width: 1140px;
          margin: 0 auto;
          padding: 32px;
        }

        .size-wide h1 { font-size: 40px; }
        .size-wide h2 { font-size: 32px; }
        .size-wide h3 { font-size: 26px; }
        .size-wide p { font-size: 18px; }
        .size-wide button { font-size: 18px; padding: 14px 36px; }

        /* Grid System */
        .grid {
          display: grid;
          gap: 16px;
        }

        .size-mobile .grid { grid-template-columns: 1fr; }
        .size-mobile-lg .grid { grid-template-columns: 1fr; }
        .size-tablet .grid { grid-template-columns: repeat(2, 1fr); }
        .size-desktop .grid { grid-template-columns: repeat(3, 1fr); }
        .size-wide .grid { grid-template-columns: repeat(4, 1fr); }

        .grid-2 { grid-template-columns: repeat(2, 1fr) !important; }
        .grid-3 { grid-template-columns: repeat(3, 1fr) !important; }
        .grid-4 { grid-template-columns: repeat(4, 1fr) !important; }

        .size-mobile .grid-2,
        .size-mobile-lg .grid-2,
        .size-tablet .grid-2 { grid-template-columns: 1fr !important; }
        .size-desktop .grid-2 { grid-template-columns: repeat(2, 1fr) !important; }
        .size-wide .grid-2 { grid-template-columns: repeat(2, 1fr) !important; }

        .size-mobile .grid-3,
        .size-mobile-lg .grid-3,
        .size-tablet .grid-3 { grid-template-columns: 1fr !important; }
        .size-desktop .grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
        .size-wide .grid-3 { grid-template-columns: repeat(3, 1fr) !important; }

        /* Flex System */
        .flex {
          display: flex;
          gap: 16px;
        }

        .flex-wrap {
          flex-wrap: wrap;
        }

        .size-mobile .flex-wrap,
        .size-mobile-lg .flex-wrap,
        .size-tablet .flex-wrap {
          flex-direction: column;
        }

        .size-desktop .flex-wrap,
        .size-wide .flex-wrap {
          flex-direction: row;
        }

        /* Hide/Show by Screen Size */
        .hide-mobile { display: none !important; }
        .hide-tablet { display: none !important; }
        .hide-desktop { display: none !important; }

        .size-mobile .show-mobile-only { display: block !important; }
        .size-mobile-lg .show-mobile-only { display: block !important; }
        .size-tablet .show-mobile-only { display: none !important; }
        .size-desktop .show-mobile-only { display: none !important; }
        .size-wide .show-mobile-only { display: none !important; }

        .size-mobile .hide-mobile,
        .size-mobile-lg .hide-mobile { display: none !important; }
        .size-tablet .hide-mobile { display: block !important; }
        .size-desktop .hide-mobile { display: block !important; }
        .size-wide .hide-mobile { display: block !important; }

        /* Touch-friendly targets */
        .size-mobile button,
        .size-mobile-lg button,
        .size-tablet button {
          min-height: 44px;
          min-width: 44px;
        }

        /* Video Sidebar Responsive */
        .size-mobile .video-sidebar,
        .size-mobile-lg .video-sidebar {
          width: 100%;
          height: 200px;
          position: fixed;
          bottom: 0;
          top: auto;
        }

        .size-tablet .video-sidebar {
          width: 280px;
        }

        .size-desktop .video-sidebar,
        .size-wide .video-sidebar {
          width: 320px;
        }

        /* Banner Responsive */
        .size-mobile .animated-banner,
        .size-mobile-lg .animated-banner {
          min-height: 180px;
        }

        .size-tablet .animated-banner {
          min-height: 200px;
        }

        .size-desktop .animated-banner,
        .size-wide .animated-banner {
          min-height: 250px;
        }

        /* Media Grid Responsive */
        .size-mobile .files-grid,
        .size-mobile-lg .files-grid {
          grid-template-columns: 1fr;
        }

        .size-tablet .files-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .size-desktop .files-grid,
        .size-wide .files-grid {
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }

        /* Safe Area for Notch Devices */
        @supports (padding: max(0px)) {
          .responsive-wrapper {
            padding-left: max(12px, env(safe-area-inset-left));
            padding-right: max(12px, env(safe-area-inset-right));
            padding-top: max(12px, env(safe-area-inset-top));
            padding-bottom: max(12px, env(safe-area-inset-bottom));
          }
        }

        /* Print Styles */
        @media print {
          .video-sidebar,
          .animated-banner,
          .ad-scheduler {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ResponsiveWrapper;

// Helper hook for responsive design
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState('desktop');
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setViewport({ width, height });
      
      if (width < 480) setScreenSize('mobile');
      else if (width < 768) setScreenSize('mobile-lg');
      else if (width < 1024) setScreenSize('tablet');
      else if (width < 1200) setScreenSize('desktop');
      else setScreenSize('wide');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { screenSize, viewport };
};

// Usage Example:
/*
function App() {
  return (
    <ResponsiveWrapper>
      {({ screenSize, viewport }) => (
        <div className="container">
          <h1>Welcome</h1>
          <p>Current screen size: {screenSize}</p>
          <p>Viewport: {viewport.width}x{viewport.height}</p>
          
          <div className="grid grid-3">
            <div>Item 1</div>
            <div>Item 2</div>
            <div>Item 3</div>
          </div>
          
          <div className="flex flex-wrap">
            <button>Button 1</button>
            <button>Button 2</button>
            <button>Button 3</button>
          </div>
        </div>
      )}
    </ResponsiveWrapper>
  );
}
*/
