// Script to add views field to existing properties in Appwrite
import { databases, appwriteConfig } from './src/lib/appwrite.js';

const { databaseId, propertiesCollectionId } = appwriteConfig;

async function addViewsFieldToProperties() {
  try {
    console.log('Adding views field to existing properties...');
    
    // Get all properties
    const response = await databases.listDocuments(
      databaseId,
      propertiesCollectionId,
      []
    );
    
    console.log(`Found ${response.documents.length} properties`);
    
    // Update each property to add views field if it doesn't exist
    for (const property of response.documents) {
      if (property.views === undefined) {
        try {
          await databases.updateDocument(
            databaseId,
            propertiesCollectionId,
            property.$id,
            { views: 0 }
          );
          console.log(`Added views field to property ${property.$id}`);
        } catch (error) {
          console.error(`Failed to update property ${property.$id}:`, error.message);
        }
      } else {
        console.log(`Property ${property.$id} already has views field: ${property.views}`);
      }
    }
    
    console.log('Finished adding views field to properties');
  } catch (error) {
    console.error('Error adding views field:', error);
  }
}

addViewsFieldToProperties();