"use client";

import React, { useState, useEffect, useRef, memo } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fetchPriority?: "high" | "low" | "auto";
}

const LazyImageComponent: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = "", 
  fetchPriority = "auto",
  ...props 
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // If it's a high priority image, skip the intersection observer and load immediately
    if (fetchPriority === 'high') {
      setIsIntersecting(true);
      return;
    }

    const currentImg = imgRef.current;
    
    // Check if IntersectionObserver is supported (fallback to immediate load if not)
    if (!('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries, observerInstance) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            // Once the image is visible (or about to be), stop observing
            if (currentImg) {
              observerInstance.unobserve(currentImg);
            }
          }
        });
      },
      {
        root: null,
        // Preload images when they are 400px away from the viewport
        rootMargin: '400px 0px',
        threshold: 0,
      }
    );

    if (currentImg) {
      observer.observe(currentImg);
    }

    return () => {
      if (currentImg) {
        observer.unobserve(currentImg);
      }
      observer.disconnect();
    };
  }, [fetchPriority]);

  return (
    <div 
      className={`relative overflow-hidden ${className}`} 
      style={{ 
        // Background serves as the skeleton/shimmer
        backgroundColor: (isLoaded || hasError) ? 'transparent' : '#f0f2f5',
        // Make sure it doesn't collapse if there's no set width/height
        minHeight: (isLoaded || hasError) ? 'auto' : '150px',
        ...(props.style || {})
      }}
    >
      {/* Shimmer Effect */}
      {(!isLoaded && !hasError) && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
      )}
      
      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            <line x1="4" x2="20" y1="4" y2="20" stroke="currentColor" strokeWidth="2" className="opacity-50" />
          </svg>
        </div>
      )}

      {/* Actual Image */}
      <img
        ref={imgRef}
        src={isIntersecting ? src : ''}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        decoding="async"
        // @ts-ignore - fetchpriority is standard but sometimes missing in React types
        fetchPriority={fetchPriority}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true); // To remove shimmer
        }}
        {...props}
      />
    </div>
  );
};

export const LazyImage = memo(LazyImageComponent);
