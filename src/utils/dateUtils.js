/**
 * Utility functions for date formatting
 */

/**
 * Format a date to show the exact day and date when a property was posted
 * @param {string|Date} dateString - The date string or Date object
 * @returns {string} Formatted date string (e.g., "Monday, Jan 15, 2024")
 */
export const formatPostDate = (dateString) => {
  if (!dateString) return 'Date not available';
  
  const date = new Date(dateString);
  
  // Always show the exact day and date
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  return date.toLocaleDateString('en-US', options);
};

/**
 * Get a relative time string (e.g., "2 hours ago", "3 days ago")
 * @param {string|Date} dateString - The date string or Date object
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now - date;
  
  const minutes = Math.floor(diffTime / (1000 * 60));
  const hours = Math.floor(diffTime / (1000 * 60 * 60));
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  if (minutes < 1) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (weeks < 4) {
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  } else {
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
};