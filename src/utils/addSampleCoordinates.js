// Utility to add sample coordinates to existing properties for testing Near You feature

import { databases, appwriteConfig } from '../lib/appwrite';
import { sampleCoordinates } from './testLocationFeature';

const { databaseId, propertiesCollectionId } = appwriteConfig;

// Function to get a random coordinate from sample cities
const getRandomCoordinates = () => {
  const cities = Object.keys(sampleCoordinates);
  const randomCity = cities[Math.floor(Math.random() * cities.length)];
  const coords = sampleCoordinates[randomCity];
  
  // Add some random variation to make properties more spread out
  const latVariation = (Math.random() - 0.5) * 0.1; // ±0.05 degrees (~5km)
  const lonVariation = (Math.random() - 0.5) * 0.1;
  
  return {
    latitude: coords.latitude + latVariation,
    longitude: coords.longitude + lonVariation,
    city: randomCity
  };
};

// Function to update properties with coordinates
export const addCoordinatesToProperties = async () => {
  try {
    console.log('🔄 Fetching existing properties...');
    
    // Get all properties
    const response = await databases.listDocuments(
      databaseId,
      propertiesCollectionId
    );
    
    if (!response.documents || response.documents.length === 0) {
      console.log('ℹ️ No properties found in database');
      return { success: true, message: 'No properties to update' };
    }
    
    console.log(`📍 Found ${response.documents.length} properties. Adding coordinates...`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const property of response.documents) {
      try {
        // Skip if property already has coordinates
        if (property.latitude && property.longitude) {
          console.log(`⏭️ Skipping ${property.title} - already has coordinates`);
          skippedCount++;
          continue;
        }
        
        // Get random coordinates
        const coords = getRandomCoordinates();
        
        // Update the property
        await databases.updateDocument(
          databaseId,
          propertiesCollectionId,
          property.$id,
          {
            latitude: coords.latitude,
            longitude: coords.longitude
          }
        );
        
        console.log(`✅ Updated ${property.title} with coordinates near ${coords.city}`);
        updatedCount++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Failed to update ${property.title}:`, error.message);
      }
    }
    
    console.log(`🎉 Coordinate update complete!`);
    console.log(`   - Updated: ${updatedCount} properties`);
    console.log(`   - Skipped: ${skippedCount} properties (already had coordinates)`);
    
    return {
      success: true,
      updated: updatedCount,
      skipped: skippedCount,
      total: response.documents.length
    };
    
  } catch (error) {
    console.error('❌ Error adding coordinates to properties:', error);
    return { success: false, error: error.message };
  }
};

// Function to remove coordinates from all properties (for testing)
export const removeCoordinatesFromProperties = async () => {
  try {
    console.log('🔄 Removing coordinates from all properties...');
    
    const response = await databases.listDocuments(
      databaseId,
      propertiesCollectionId
    );
    
    if (!response.documents || response.documents.length === 0) {
      console.log('ℹ️ No properties found in database');
      return { success: true, message: 'No properties to update' };
    }
    
    let updatedCount = 0;
    
    for (const property of response.documents) {
      try {
        if (property.latitude || property.longitude) {
          await databases.updateDocument(
            databaseId,
            propertiesCollectionId,
            property.$id,
            {
              latitude: null,
              longitude: null
            }
          );
          
          console.log(`✅ Removed coordinates from ${property.title}`);
          updatedCount++;
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`❌ Failed to update ${property.title}:`, error.message);
      }
    }
    
    console.log(`🎉 Removed coordinates from ${updatedCount} properties`);
    
    return {
      success: true,
      updated: updatedCount,
      total: response.documents.length
    };
    
  } catch (error) {
    console.error('❌ Error removing coordinates:', error);
    return { success: false, error: error.message };
  }
};

// Function to check coordinate status of properties
export const checkCoordinateStatus = async () => {
  try {
    console.log('🔍 Checking coordinate status of properties...');
    
    const response = await databases.listDocuments(
      databaseId,
      propertiesCollectionId
    );
    
    if (!response.documents || response.documents.length === 0) {
      console.log('ℹ️ No properties found in database');
      return { success: true, withCoords: 0, withoutCoords: 0, total: 0 };
    }
    
    let withCoords = 0;
    let withoutCoords = 0;
    
    response.documents.forEach(property => {
      if (property.latitude && property.longitude) {
        withCoords++;
        console.log(`✅ ${property.title} - Has coordinates (${property.latitude}, ${property.longitude})`);
      } else {
        withoutCoords++;
        console.log(`❌ ${property.title} - Missing coordinates`);
      }
    });
    
    console.log(`\n📊 Coordinate Status Summary:`);
    console.log(`   - With coordinates: ${withCoords}`);
    console.log(`   - Without coordinates: ${withoutCoords}`);
    console.log(`   - Total properties: ${response.documents.length}`);
    
    return {
      success: true,
      withCoords,
      withoutCoords,
      total: response.documents.length,
      properties: response.documents.map(p => ({
        id: p.$id,
        title: p.title,
        hasCoords: !!(p.latitude && p.longitude),
        latitude: p.latitude,
        longitude: p.longitude
      }))
    };
    
  } catch (error) {
    console.error('❌ Error checking coordinate status:', error);
    return { success: false, error: error.message };
  }
};