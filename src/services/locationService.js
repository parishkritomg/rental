// Location service for geocoding and reverse geocoding
// Uses geocode.maps.co API (5,000 free requests/day)

const GEOCODING_API_BASE = 'https://geocode.maps.co';
const API_KEY = import.meta.env.VITE_GEOCODING_API_KEY || 'YOUR_API_KEY_HERE';

// Check if API key is properly configured
const isApiKeyConfigured = () => {
  return API_KEY && API_KEY !== 'YOUR_API_KEY_HERE' && API_KEY.trim() !== '';
};

// Get user-friendly error message for missing API key
const getApiKeyErrorMessage = () => {
  return 'Location search requires an API key. Please check the .env file for setup instructions.';
};

/**
 * Convert a place name/address to coordinates (geocoding)
 * @param {string} address - The address or place name to geocode
 * @returns {Promise<{success: boolean, data?: {latitude: number, longitude: number, display_name: string}, error?: string}>}
 */
export const geocodeAddress = async (address) => {
  try {
    if (!address || address.trim() === '') {
      return {
        success: false,
        error: 'Address is required'
      };
    }

    const encodedAddress = encodeURIComponent(address.trim());
    const url = `${GEOCODING_API_BASE}/search?q=${encodedAddress}&api_key=${API_KEY}&limit=1&format=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'No location found for the provided address'
      };
    }
    
    const result = data[0];
    
    return {
      success: true,
      data: {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        display_name: result.display_name,
        place_name: extractPlaceName(result.display_name)
      }
    };
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      success: false,
      error: error.message || 'Failed to geocode address'
    };
  }
};

/**
 * Convert coordinates to a readable address (reverse geocoding)
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @returns {Promise<{success: boolean, data?: {address: string, city: string, country: string}, error?: string}>}
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    if (!latitude || !longitude) {
      return {
        success: false,
        error: 'Latitude and longitude are required'
      };
    }

    const url = `${GEOCODING_API_BASE}/reverse?lat=${latitude}&lon=${longitude}&api_key=${API_KEY}&format=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.display_name) {
      return {
        success: false,
        error: 'No address found for the provided coordinates'
      };
    }
    
    return {
      success: true,
      data: {
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
        country: data.address?.country || 'Unknown',
        place_name: extractPlaceName(data.display_name)
      }
    };
    
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      success: false,
      error: error.message || 'Failed to reverse geocode coordinates'
    };
  }
};

/**
 * Get user's current location and convert it to a readable place name
 * @returns {Promise<{success: boolean, data?: {latitude: number, longitude: number, place_name: string}, error?: string}>}
 */
export const getCurrentLocationWithPlace = async () => {
  try {
    // Get current coordinates
    const position = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
    
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    
    // Convert coordinates to place name
    const reverseResult = await reverseGeocode(latitude, longitude);
    
    if (!reverseResult.success) {
      // Return coordinates even if reverse geocoding fails
      return {
        success: true,
        data: {
          latitude,
          longitude,
          place_name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        }
      };
    }
    
    return {
      success: true,
      data: {
        latitude,
        longitude,
        place_name: reverseResult.data.place_name,
        full_address: reverseResult.data.address
      }
    };
    
  } catch (error) {
    console.error('Get current location error:', error);
    
    let errorMessage = 'Unable to get your location. ';
    
    if (error.code === 1) {
      errorMessage += 'Please allow location access and try again.';
    } else if (error.code === 2) {
      errorMessage += 'Location information is unavailable.';
    } else if (error.code === 3) {
      errorMessage += 'Location request timed out. Please try again.';
    } else {
      errorMessage += error.message || 'Please check your location settings.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Extract a clean place name from a full address
 * @param {string} fullAddress - The full address string
 * @returns {string} - A clean place name
 */
const extractPlaceName = (fullAddress) => {
  if (!fullAddress) return 'Unknown Location';
  
  // Split by comma and take the first 2-3 parts for a clean place name
  const parts = fullAddress.split(',').map(part => part.trim());
  
  if (parts.length >= 2) {
    // Return city and state/country (first 2 meaningful parts)
    return parts.slice(0, 2).join(', ');
  }
  
  return parts[0] || 'Unknown Location';
};

/**
 * Search for places by name with autocomplete suggestions
 * @param {string} query - The search query
 * @param {number} limit - Maximum number of results (default: 5)
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const searchPlaces = async (query, limit = 5) => {
  try {
    if (!query || query.trim().length < 2) {
      return {
        success: false,
        error: 'Query must be at least 2 characters long'
      };
    }

    // Check if API key is configured
    if (!isApiKeyConfigured()) {
      return {
        success: false,
        error: getApiKeyErrorMessage()
      };
    }

    const encodedQuery = encodeURIComponent(query.trim());
    const url = `${GEOCODING_API_BASE}/search?q=${encodedQuery}&api_key=${API_KEY}&limit=${limit}&format=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid API key. Please check your geocoding API key configuration.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return {
        success: true,
        data: []
      };
    }
    
    const results = data.map(item => ({
      place_name: extractPlaceName(item.display_name),
      full_address: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon)
    }));
    
    return {
      success: true,
      data: results
    };
    
  } catch (error) {
    console.error('Place search error:', error);
    return {
      success: false,
      error: error.message || 'Failed to search places'
    };
  }
};

export default {
  geocodeAddress,
  reverseGeocode,
  getCurrentLocationWithPlace,
  searchPlaces
};