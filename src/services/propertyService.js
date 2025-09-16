import { databases, storage, Query, appwriteConfig } from '../lib/appwrite';
import { ID } from 'appwrite';

const { databaseId, propertiesCollectionId, favoritesCollectionId, storageId } = appwriteConfig;

export const propertyService = {
  // Create a new property
  async createProperty(propertyData) {
    try {
      const response = await databases.createDocument(
        databaseId,
        propertiesCollectionId,
        ID.unique(),
        propertyData
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get all properties with optional filters
  async getProperties(filters = {}) {
    try {
      const queries = [];
      
      if (filters.minPrice) {
        queries.push(Query.greaterThanEqual('price', filters.minPrice));
      }
      if (filters.maxPrice) {
        queries.push(Query.lessThanEqual('price', filters.maxPrice));
      }
      if (filters.propertyType) {
        queries.push(Query.equal('propertyType', filters.propertyType));
      }
      if (filters.bedrooms) {
        queries.push(Query.equal('bedrooms', filters.bedrooms));
      }
      if (filters.location) {
        queries.push(Query.contains('location', filters.location));
      }
      if (filters.status) {
        queries.push(Query.equal('status', filters.status));
      }
      if (filters.listingType && filters.listingType.length > 0) {
        // Handle multiple listing types with OR condition
        if (filters.listingType.length === 1) {
          queries.push(Query.equal('listingType', filters.listingType[0]));
        } else {
          // If both rent and sale are selected, we don't need to filter by listingType
          // as we want to show all properties
        }
      }

      // Add sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'price-low':
            queries.push(Query.orderAsc('price'));
            break;
          case 'price-high':
            queries.push(Query.orderDesc('price'));
            break;
          case 'newest':
            queries.push(Query.orderDesc('$createdAt'));
            break;
          default:
            queries.push(Query.orderDesc('$createdAt'));
        }
      }

      // Add pagination
      if (filters.limit) {
        queries.push(Query.limit(filters.limit));
      }
      if (filters.offset) {
        queries.push(Query.offset(filters.offset));
      }

      const response = await databases.listDocuments(
        databaseId,
        propertiesCollectionId,
        queries
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get a single property by ID
  async getProperty(propertyId) {
    try {
      const response = await databases.getDocument(
        databaseId,
        propertiesCollectionId,
        propertyId
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update a property
  async updateProperty(propertyId, propertyData) {
    try {
      const response = await databases.updateDocument(
        databaseId,
        propertiesCollectionId,
        propertyId,
        propertyData
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete a property
  async deleteProperty(propertyId) {
    try {
      // First, delete all comments associated with this property
      const { commentService } = await import('./commentService');
      const commentDeletionResult = await commentService.deleteAllCommentsForProperty(propertyId);
      
      if (!commentDeletionResult.success) {
        console.warn('Failed to delete comments for property:', commentDeletionResult.error);
        // Continue with property deletion even if comment deletion fails
      } else {
        console.log(`Deleted ${commentDeletionResult.deletedCount} comments for property ${propertyId}`);
      }

      // Second, delete all notifications associated with this property
      const { notificationService } = await import('./notificationService');
      const notificationDeletionResult = await notificationService.deleteAllNotificationsForProperty(propertyId);
      
      if (!notificationDeletionResult.success) {
        console.warn('Failed to delete notifications for property:', notificationDeletionResult.error);
        // Continue with property deletion even if notification deletion fails
      } else {
        console.log(`Deleted ${notificationDeletionResult.deletedCount} notifications for property ${propertyId}`);
      }

      // Finally, delete the property itself
      await databases.deleteDocument(
        databaseId,
        propertiesCollectionId,
        propertyId
      );
      
      return { 
        success: true, 
        deletedComments: commentDeletionResult.deletedCount || 0,
        deletedNotifications: notificationDeletionResult.deletedCount || 0
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Upload property images
  async uploadImages(files) {
    try {
      const uploadPromises = files.map(file => 
        storage.createFile(storageId, ID.unique(), file)
      );
      const responses = await Promise.all(uploadPromises);
      return { success: true, data: responses };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get image URL
  getImageUrl(fileId) {
    return storage.getFileView(storageId, fileId);
  },

  // Delete image
  async deleteImage(fileId) {
    try {
      await storage.deleteFile(storageId, fileId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get featured properties
  async getFeaturedProperties(limit = 6) {
    try {
      const response = await databases.listDocuments(
        databaseId,
        propertiesCollectionId,
        [
          Query.limit(limit),
          Query.orderDesc('$createdAt')
        ]
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Search properties with enhanced location and name matching
  async searchProperties(searchTerm, userLocation = null) {
    try {
      // Split search term into individual keywords for AND logic
      const keywords = searchTerm.trim().toLowerCase().split(/\s+/).filter(keyword => keyword.length > 0);
      
      if (keywords.length === 0) {
        // If no valid keywords, return all properties
        const response = await databases.listDocuments(
          databaseId,
          propertiesCollectionId,
          [Query.limit(100)]
        );
        return { success: true, data: response };
      }
      
      // For multi-keyword search, we need to implement AND logic
      // Since Appwrite doesn't support complex AND/OR combinations directly,
      // we'll fetch all properties and filter them manually
      const response = await databases.listDocuments(
        databaseId,
        propertiesCollectionId,
        [Query.limit(1000)] // Get more properties for better filtering
      );
      
      let properties = response.documents || [];
      
      // Filter properties where ALL keywords are found in ANY of the searchable fields
      properties = properties.filter(property => {
        return keywords.every(keyword => {
          const searchableText = [
            property.title || '',
            property.description || '',
            property.location || '',
            property.address || '',
            property.city || '',
            property.state || '',
            property.neighborhood || ''
          ].join(' ').toLowerCase();
          
          return searchableText.includes(keyword);
        });
      });
       
       // If user location is provided, calculate distances and sort by proximity
      if (userLocation && userLocation.latitude && userLocation.longitude) {
        const { calculateDistance } = await import('../utils/locationUtils');
        
        properties = properties.map(property => {
          if (property.latitude && property.longitude) {
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              property.latitude,
              property.longitude
            );
            return { ...property, distance };
          }
          return { ...property, distance: null };
        });
        
        // Sort by relevance score (combination of text match and proximity)
        properties.sort((a, b) => {
          // Calculate relevance scores
          const aScore = this.calculateRelevanceScore(a, searchTerm);
          const bScore = this.calculateRelevanceScore(b, searchTerm);
          
          // If relevance scores are similar, prioritize by distance
          if (Math.abs(aScore - bScore) < 0.1) {
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          }
          
          return bScore - aScore; // Higher score first
        });
      } else {
        // Sort by relevance score only
        properties.sort((a, b) => {
          const aScore = this.calculateRelevanceScore(a, searchTerm);
          const bScore = this.calculateRelevanceScore(b, searchTerm);
          return bScore - aScore;
        });
      }
      
      return { success: true, data: { ...response, documents: properties } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Calculate relevance score for search results with multi-keyword support
  calculateRelevanceScore(property, searchTerm) {
    const keywords = searchTerm.trim().toLowerCase().split(/\s+/).filter(keyword => keyword.length > 0);
    let totalScore = 0;
    
    // Calculate score for each keyword and sum them up
    keywords.forEach(keyword => {
      let keywordScore = 0;
      
      // Exact matches in title get highest score
      if (property.title && property.title.toLowerCase().includes(keyword)) {
        keywordScore += property.title.toLowerCase() === keyword ? 10 : 5;
      }
      
      // Location matches get high score
      if (property.location && property.location.toLowerCase().includes(keyword)) {
        keywordScore += property.location.toLowerCase() === keyword ? 8 : 4;
      }
      
      // City matches
      if (property.city && property.city.toLowerCase().includes(keyword)) {
        keywordScore += property.city.toLowerCase() === keyword ? 7 : 3;
      }
      
      // Address matches
      if (property.address && property.address.toLowerCase().includes(keyword)) {
        keywordScore += property.address.toLowerCase() === keyword ? 6 : 2;
      }
      
      // Neighborhood matches
      if (property.neighborhood && property.neighborhood.toLowerCase().includes(keyword)) {
        keywordScore += property.neighborhood.toLowerCase() === keyword ? 5 : 2;
      }
      
      // State matches
      if (property.state && property.state.toLowerCase().includes(keyword)) {
        keywordScore += property.state.toLowerCase() === keyword ? 4 : 1;
      }
      
      // Description matches get lower score
      if (property.description && property.description.toLowerCase().includes(keyword)) {
        keywordScore += 1;
      }
      
      totalScore += keywordScore;
    });
    
    // Bonus for matching more keywords
    totalScore += keywords.length * 0.5;
    
    return totalScore;
  },

  // Get user favorites
  async getUserFavorites(userId) {
    try {
      // Step 1: Get all user's favorites
      const favoritesResponse = await databases.listDocuments(
        databaseId,
        favoritesCollectionId,
        [Query.equal('userId', userId)]
      );
      
      if (favoritesResponse.documents.length === 0) {
        return { 
          success: true, 
          data: { 
            documents: [],
            total: 0
          }
        };
      }
      
      // Step 2: Get all properties and filter for favorites
      const allPropertiesResponse = await databases.listDocuments(
        databaseId,
        propertiesCollectionId
      );
      
      // Step 3: Match favorites with existing properties
      const favoritePropertyIds = favoritesResponse.documents.map(fav => fav.propertyId);
      const favoriteProperties = allPropertiesResponse.documents
        .filter(property => favoritePropertyIds.includes(property.$id))
        .map(property => ({ ...property, isFavorited: true }));
      
      return { 
        success: true, 
        data: { 
          documents: favoriteProperties,
          total: favoriteProperties.length
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Add property to favorites
  async addToFavorites(userId, propertyId) {
    try {
      // Check if already favorited
      const existing = await databases.listDocuments(
        databaseId,
        favoritesCollectionId,
        [
          Query.equal('userId', userId),
          Query.equal('propertyId', propertyId)
        ]
      );
      
      if (existing.documents.length > 0) {
        return { success: false, error: 'Property already in favorites' };
      }
      
      const response = await databases.createDocument(
        databaseId,
        favoritesCollectionId,
        ID.unique(),
        {
          userId,
          propertyId
        }
      );
      
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Remove property from favorites
  async removeFromFavorites(userId, propertyId) {
    try {
      const existing = await databases.listDocuments(
        databaseId,
        favoritesCollectionId,
        [
          Query.equal('userId', userId),
          Query.equal('propertyId', propertyId)
        ]
      );
      
      if (existing.documents.length === 0) {
        return { success: false, error: 'Property not in favorites' };
      }
      
      await databases.deleteDocument(
        databaseId,
        favoritesCollectionId,
        existing.documents[0].$id
      );
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Toggle favorite status
  async toggleFavorite(userId, propertyId) {
    try {
      const existing = await databases.listDocuments(
        databaseId,
        favoritesCollectionId,
        [
          Query.equal('userId', userId),
          Query.equal('propertyId', propertyId)
        ]
      );
      
      if (existing.documents.length > 0) {
        // Remove from favorites
        await databases.deleteDocument(
          databaseId,
          favoritesCollectionId,
          existing.documents[0].$id
        );
        return { success: true, isFavorited: false };
      } else {
        // Add to favorites
        const result = await databases.createDocument(
          databaseId,
          favoritesCollectionId,
          ID.unique(),
          {
            userId,
            propertyId
          }
        );
        return { success: true, isFavorited: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Check if property is favorited by user
  async isFavorited(userId, propertyId) {
    try {
      const response = await databases.listDocuments(
        databaseId,
        favoritesCollectionId,
        [
          Query.equal('userId', userId),
          Query.equal('propertyId', propertyId)
        ]
      );
      
      return { success: true, isFavorited: response.documents.length > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get user properties
  async getUserProperties(userId) {
    try {
      const response = await databases.listDocuments(
        databaseId,
        propertiesCollectionId,
        [
          Query.equal('ownerId', userId),
          Query.orderDesc('$createdAt')
        ]
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Increment property views count
  async incrementPropertyViews(propertyId) {
    try {
      // Get current property data
      const propertyResponse = await databases.getDocument(
        databaseId,
        propertiesCollectionId,
        propertyId
      );
      
      if (!propertyResponse) {
        return { success: false, error: 'Property not found' };
      }
      
      // Increment views count (initialize to 1 if not exists)
      const currentViews = propertyResponse.views || 0;
      const updatedViews = currentViews + 1;
      
      // Update property with new view count
      const response = await databases.updateDocument(
        databaseId,
        propertiesCollectionId,
        propertyId,
        { views: updatedViews }
      );
      
      return { success: true, data: response, views: updatedViews };
    } catch (error) {
      // If the error is about missing attribute, provide helpful message
      if (error.message.includes('views') || error.message.includes('attribute')) {
        console.warn('Views field may not exist in database. Please add views attribute to properties collection.');
        return { success: false, error: 'Views field not configured in database', needsSetup: true };
      }
      console.error('Error incrementing property views:', error);
      return { success: false, error: error.message };
    }
  },

  // Update property status
  async updatePropertyStatus(propertyId, status) {
    try {
      const response = await databases.updateDocument(
        databaseId,
        propertiesCollectionId,
        propertyId,
        {
          status: status
        }
      );
      return { success: true, data: response };
    } catch (error) {
      console.error('Error updating property status:', error);
      return { success: false, error: error.message };
    }
  },

  // Search properties near a user's zip code
  async searchPropertiesNearZipCode(userZipCode, limit = 50) {
    try {
      // Get all properties
      const response = await databases.listDocuments(
        databaseId,
        propertiesCollectionId,
        [Query.limit(1000)]
      );
      
      let properties = response.documents || [];
      
      // Filter out properties without zip codes
      properties = properties.filter(property => property.zipCode);
      
      // Calculate zip code proximity and sort
      properties = properties.map(property => {
        const distance = this.calculateZipCodeProximity(userZipCode, property.zipCode);
        return { ...property, zipCodeDistance: distance };
      });
      
      // Sort by zip code proximity (lower distance = closer)
      properties.sort((a, b) => a.zipCodeDistance - b.zipCodeDistance);
      
      // Limit results
      if (limit) {
        properties = properties.slice(0, limit);
      }
      
      return { success: true, data: { ...response, documents: properties } };
    } catch (error) {
      console.error('Error searching properties near zip code:', error);
      return { success: false, error: error.message };
    }
  },

  // Calculate proximity between two zip codes
  calculateZipCodeProximity(zipCode1, zipCode2) {
    // Remove any non-numeric characters and get first 5 digits
    const zip1 = zipCode1.replace(/\D/g, '').substring(0, 5);
    const zip2 = zipCode2.replace(/\D/g, '').substring(0, 5);
    
    // If either zip code is invalid, return high distance
    if (zip1.length !== 5 || zip2.length !== 5) {
      return 999999;
    }
    
    // Exact match
    if (zip1 === zip2) {
      return 0;
    }
    
    // Calculate numerical difference
    const num1 = parseInt(zip1);
    const num2 = parseInt(zip2);
    const difference = Math.abs(num1 - num2);
    
    // Zip codes are generally organized geographically
    // Smaller numerical differences often indicate closer proximity
    return difference;
  }
};

// Named exports for convenience
export const {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  uploadImages,
  getImageUrl,
  deleteImage,
  getFeaturedProperties,
  searchProperties,
  searchPropertiesNearZipCode,
  getUserFavorites,
  getUserProperties,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  isFavorited,
  incrementPropertyViews,
  updatePropertyStatus
} = propertyService;

export default propertyService;