import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

const PullToRefresh = ({ children, onRefresh, disabled = false }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [canPull, setCanPull] = useState(false);
  
  const containerRef = useRef(null);
  const PULL_THRESHOLD = 80; // Distance needed to trigger refresh
  const MAX_PULL_DISTANCE = 120; // Maximum pull distance

  // Check if we're at the top of the page
  const isAtTop = () => {
    if (!containerRef.current) return false;
    return containerRef.current.scrollTop === 0;
  };

  // Handle touch start
  const handleTouchStart = (e) => {
    if (disabled || isRefreshing) return;
    
    if (isAtTop()) {
      setCanPull(true);
      setStartY(e.touches[0].clientY);
    }
  };

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    if (disabled || isRefreshing || !canPull) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;

    // Only allow pulling down
    if (deltaY > 0 && isAtTop()) {
      e.preventDefault(); // Prevent default scroll behavior
      
      const distance = Math.min(deltaY * 0.5, MAX_PULL_DISTANCE); // Damping effect
      setPullDistance(distance);
      setIsPulling(distance > 20); // Start showing pull indicator after 20px
    }
  }, [disabled, isRefreshing, canPull, startY]);

  // Handle touch end
  const handleTouchEnd = () => {
    if (disabled || isRefreshing || !canPull) return;

    setCanPull(false);
    
    if (pullDistance >= PULL_THRESHOLD) {
      // Trigger refresh
      setIsRefreshing(true);
      setIsPulling(false);
      setPullDistance(0);
      
      // Call the refresh function
      if (onRefresh) {
        Promise.resolve(onRefresh()).finally(() => {
          setIsRefreshing(false);
        });
      }
    } else {
      // Reset state
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  // Handle mouse events for desktop testing
  const handleMouseDown = (e) => {
    if (disabled || isRefreshing) return;
    
    if (isAtTop()) {
      setCanPull(true);
      setStartY(e.clientY);
    }
  };

  const handleMouseMove = (e) => {
    if (disabled || isRefreshing || !canPull) return;

    const currentY = e.clientY;
    const deltaY = currentY - startY;

    if (deltaY > 0 && isAtTop()) {
      const distance = Math.min(deltaY * 0.5, MAX_PULL_DISTANCE);
      setPullDistance(distance);
      setIsPulling(distance > 20);
    }
  };

  const handleMouseUp = () => {
    if (disabled || isRefreshing || !canPull) return;

    setCanPull(false);
    
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setIsPulling(false);
      setPullDistance(0);
      
      if (onRefresh) {
        Promise.resolve(onRefresh()).finally(() => {
          setIsRefreshing(false);
        });
      }
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (canPull) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [canPull, startY, pullDistance]);

  // Add touch event listeners with passive: false to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options = { passive: false };
    
    container.addEventListener('touchmove', handleTouchMove, options);
    
    return () => {
      container.removeEventListener('touchmove', handleTouchMove, options);
    };
  }, [handleTouchMove]);

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const shouldShowRefresh = isPulling || isRefreshing;

  return (
    <div className="relative h-full overflow-hidden">
      {/* Pull to refresh indicator */}
      <div 
        className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-center transition-all duration-300 ${
          shouldShowRefresh ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          height: shouldShowRefresh ? '60px' : '0px',
          transform: `translateY(${isPulling ? pullDistance - 60 : isRefreshing ? 0 : -60}px)`
        }}
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg border border-gray-200">
          <RefreshCw 
            className={`w-6 h-6 text-blue-600 transition-transform duration-300 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: isPulling ? `rotate(${pullProgress * 360}deg)` : ''
            }}
          />
        </div>
      </div>

      {/* Content container */}
      <div
        ref={containerRef}
        className="h-full overflow-auto"
        style={{
          transform: isPulling ? `translateY(${Math.min(pullDistance, 60)}px)` : '',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>

      {/* Loading overlay */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
      )}
    </div>
  );
};

export default PullToRefresh;