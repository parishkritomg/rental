// Test script for debugging the Near You feature

import { getCurrentLocation, calculateDistance, sortPropertiesByDistance } from './locationUtils';

// Test geolocation API
export const testGeolocation = async () => {
  console.log('Testing geolocation API...');
  
  try {
    const location = await getCurrentLocation();
    console.log('✅ Geolocation successful:', location);
    return location;
  } catch (error) {
    console.error('❌ Geolocation failed:', error.message);
    throw error;
  }
};

// Test distance calculation
export const testDistanceCalculation = () => {
  console.log('Testing distance calculation...');
  
  // Test with known coordinates (New York to Los Angeles)
  const nyLat = 40.7128;
  const nyLon = -74.0060;
  const laLat = 34.0522;
  const laLon = -118.2437;
  
  const distance = calculateDistance(nyLat, nyLon, laLat, laLon);
  console.log(`Distance from NY to LA: ${distance}km (should be ~3944km)`);
  
  return distance;
};

// Test property sorting
export const testPropertySorting = () => {
  console.log('Testing property sorting...');
  
  const userLat = 40.7128; // New York
  const userLon = -74.0060;
  
  const testProperties = [
    {
      $id: '1',
      title: 'Property in LA',
      latitude: 34.0522,
      longitude: -118.2437
    },
    {
      $id: '2', 
      title: 'Property in Chicago',
      latitude: 41.8781,
      longitude: -87.6298
    },
    {
      $id: '3',
      title: 'Property in Boston',
      latitude: 42.3601,
      longitude: -71.0589
    },
    {
      $id: '4',
      title: 'Property without coordinates'
      // No latitude/longitude
    }
  ];
  
  const sortedProperties = sortPropertiesByDistance(testProperties, userLat, userLon);
  console.log('Sorted properties by distance:', sortedProperties.map(p => ({
    title: p.title,
    distance: p.distance
  })));
  
  return sortedProperties;
};

// Sample coordinates for major cities (for testing)
export const sampleCoordinates = {
  'New York': { latitude: 40.7128, longitude: -74.0060 },
  'Los Angeles': { latitude: 34.0522, longitude: -118.2437 },
  'Chicago': { latitude: 41.8781, longitude: -87.6298 },
  'Houston': { latitude: 29.7604, longitude: -95.3698 },
  'Phoenix': { latitude: 33.4484, longitude: -112.0740 },
  'Philadelphia': { latitude: 39.9526, longitude: -75.1652 },
  'San Antonio': { latitude: 29.4241, longitude: -98.4936 },
  'San Diego': { latitude: 32.7157, longitude: -117.1611 },
  'Dallas': { latitude: 32.7767, longitude: -96.7970 },
  'San Jose': { latitude: 37.3382, longitude: -121.8863 },
  'Austin': { latitude: 30.2672, longitude: -97.7431 },
  'Jacksonville': { latitude: 30.3322, longitude: -81.6557 },
  'Fort Worth': { latitude: 32.7555, longitude: -97.3308 },
  'Columbus': { latitude: 39.9612, longitude: -82.9988 },
  'Charlotte': { latitude: 35.2271, longitude: -80.8431 },
  'San Francisco': { latitude: 37.7749, longitude: -122.4194 },
  'Indianapolis': { latitude: 39.7684, longitude: -86.1581 },
  'Seattle': { latitude: 47.6062, longitude: -122.3321 },
  'Denver': { latitude: 39.7392, longitude: -104.9903 },
  'Boston': { latitude: 42.3601, longitude: -71.0589 }
};

// Run all tests
export const runAllTests = async () => {
  console.log('🧪 Running Near You feature tests...');
  
  try {
    // Test 1: Geolocation
    await testGeolocation();
    
    // Test 2: Distance calculation
    testDistanceCalculation();
    
    // Test 3: Property sorting
    testPropertySorting();
    
    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Tests failed:', error);
  }
};