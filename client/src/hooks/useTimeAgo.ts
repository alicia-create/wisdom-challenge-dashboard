import { useState, useEffect } from 'react';

/**
 * Hook to display relative time (e.g., "2 minutes ago", "just now")
 * Updates every 10 seconds to keep the display fresh
 */
export function useTimeAgo(timestamp: Date | number | string | undefined): string {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (!timestamp) {
      setTimeAgo('');
      return;
    }

    const calculateTimeAgo = () => {
      const now = new Date().getTime();
      const then = new Date(timestamp).getTime();
      const diffMs = now - then;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);

      if (diffSec < 10) {
        return 'just now';
      } else if (diffSec < 60) {
        return `${diffSec} seconds ago`;
      } else if (diffMin < 60) {
        return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
      } else if (diffHour < 24) {
        return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
      } else {
        const diffDays = Math.floor(diffHour / 24);
        return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
      }
    };

    // Initial calculation
    setTimeAgo(calculateTimeAgo());

    // Update every 10 seconds
    const interval = setInterval(() => {
      setTimeAgo(calculateTimeAgo());
    }, 10000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return timeAgo;
}
