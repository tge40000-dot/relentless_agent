// LazyImage.js - Lazy Loading Image Component with Performance Optimization
// Simple, efficient, and SEO-friendly

import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({ 
  src, 
  alt, 
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+',
  className = '',
  loading = 'lazy',
  threshold = 0.1,
  fadeIn = true,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    setError(false);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setError(true);
    if (onError) onError(e);
  };

  return (
    <div ref={imgRef} className={`lazy-image-wrapper ${className}`}>
      <img
        src={isInView ? src : placeholder}
        alt={alt}
        loading={loading}
        className={`lazy-image ${fadeIn ? 'fade-in' : ''} ${isLoaded ? 'loaded' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          opacity: fadeIn && !isLoaded ? 0 : 1,
          transition: fadeIn ? 'opacity 0.3s ease-in-out' : 'none'
        }}
      />
      
      {error && (
        <div className="lazy-image-error">
          <span>⚠️</span>
          <p>Failed to load image</p>
        </div>
      )}

      <style jsx>{`
        .lazy-image-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .lazy-image {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
        }

        .lazy-image.fade-in {
          transition: opacity 0.3s ease-in-out;
        }

        .lazy-image.loaded {
          opacity: 1;
        }

        .lazy-image-error {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          color: #666;
          font-size: 14px;
        }

        .lazy-image-error span {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .lazy-image-error p {
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default LazyImage;
