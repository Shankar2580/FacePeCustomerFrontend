import React, { useState, useEffect } from 'react';

/**
 * Get time remaining until expiry
 */
export const getTimeRemaining = (expiresAt: string) => {
  const now = new Date().getTime();
  const expires = new Date(expiresAt).getTime();
  const diff = expires - now;

  if (diff <= 0) {
    return { expired: true, minutes: 0, seconds: 0, totalSeconds: 0 };
  }

  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { expired: false, minutes, seconds, totalSeconds: Math.floor(diff / 1000) };
};

/**
 * Format time remaining as human-readable string
 */
export const formatTimeRemaining = (expiresAt: string): string => {
  const { expired, minutes, seconds } = getTimeRemaining(expiresAt);

  if (expired) return 'Expired';

  if (minutes > 0) {
    return `${minutes}m ${seconds}s left`;
  }
  return `${seconds}s left`;
};

/**
 * Check if a payment request has expired
 */
export const isExpired = (expiresAt: string): boolean => {
  const now = new Date().getTime();
  const expires = new Date(expiresAt).getTime();
  return expires <= now;
};

/**
 * Get color based on time remaining
 */
export const getExpiryColor = (expiresAt: string): string => {
  const { expired, minutes } = getTimeRemaining(expiresAt);

  if (expired) return '#6B7280'; // Grey
  if (minutes < 1) return '#EF4444'; // Red
  if (minutes < 3) return '#F59E0B'; // Orange
  return '#059669'; // Green
};

/**
 * React hook for live countdown
 */
export const useCountdown = (expiresAt: string, onExpire?: () => void) => {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(expiresAt));

  useEffect(() => {
    // Update immediately
    setTimeRemaining(getTimeRemaining(expiresAt));

    // Set up interval to update every second
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(expiresAt);
      setTimeRemaining(remaining);

      // Call onExpire callback when expired
      if (remaining.expired && onExpire) {
        onExpire();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  return timeRemaining;
};

/**
 * Format countdown as "4:32" or "0:45"
 */
export const formatCountdown = (minutes: number, seconds: number): string => {
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
