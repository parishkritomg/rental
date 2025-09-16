/**
 * Appwrite Database Setup Script
 * Run this script to automatically create all collections, attributes, and indexes
 * 
 * Prerequisites:
 * 1. Install Appwrite SDK: npm install appwrite
 * 2. Set up your .env file with Appwrite credentials
 * 3. Run: node setup-appwrite-db.js
 */

import { Client, Databases, Storage, Permission, Role, ID } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

// Check for required environment variables
if (!process.env.VITE_APPWRITE_PROJECT_ID) {
  console.error('❌ Missing VITE_APPWRITE_PROJECT_ID in .env file');
  process.exit(1);
}

if (!process.env.APPWRITE_API_KEY) {
  console.error('❌ Missing APPWRITE_API_KEY in .env file');
  console.log('\n📝 To get your API key:');
  console.log('1. Go to https://cloud.appwrite.io/console');
  console.log('2. Select your project');
  console.log('3. Go to Settings → API Keys');
  console.log('4. Create a new API key with Database and Storage permissions');
  console.log('5. Add APPWRITE_API_KEY=your-key-here to your .env file');
  process.exit(1);
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '68c421f100155aee655e'; // Use existing database
const PROPERTIES_COLLECTION_ID = process.env.VITE_APPWRITE_PROPERTIES_COLLECTION_ID || 'properties';
const USER_PROFILES_COLLECTION_ID = process.env.VITE_APPWRITE_USERS_COLLECTION_ID || 'user-profiles';
const FAVORITES_COLLECTION_ID = process.env.VITE_APPWRITE_FAVORITES_COLLECTION_ID || 'favorites';
const MESSAGES_COLLECTION_ID = process.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID || 'messages';
const COMMENTS_COLLECTION_ID = process.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID || 'comments';
const NOTIFICATIONS_COLLECTION_ID = process.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID || 'notifications';
const STORAGE_BUCKET_ID = process.env.VITE_APPWRITE_STORAGE_ID || 'property-images';

async function setupDatabase() {
  try {
    console.log('🚀 Starting Appwrite Database Setup...');

    // Step 1: Create or use database
    console.log('📊 Setting up database...');
    let DATABASE_ID_TO_USE;
    try {
      // Try to list databases first to see what exists
      const databasesList = await databases.list();
      console.log(`ℹ️  Found ${databasesList.databases.length} existing databases`);
      
      if (databasesList.databases.length > 0) {
        // Use the first existing database
        const existingDb = databasesList.databases[0];
        console.log(`ℹ️  Using existing database: ${existingDb.name} (${existingDb.$id})`);
        DATABASE_ID_TO_USE = existingDb.$id;
      } else {
        // Create new database if none exist
        const newDb = await databases.create(DATABASE_ID, 'Rental App Database');
        console.log('✅ Database created successfully');
        DATABASE_ID_TO_USE = newDb.$id;
      }
    } catch (error) {
      console.error('❌ Error with database setup:', error.message);
      throw error;
    }

    // Step 2: Create Properties Collection
    console.log('🏠 Creating Properties collection...');
    try {
      await databases.createCollection(
        DATABASE_ID_TO_USE,
        PROPERTIES_COLLECTION_ID,
        'Properties',
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );
      console.log('✅ Properties collection created');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Properties collection already exists');
      } else {
        throw error;
      }
    }

    // Step 3: Create Properties Attributes
    console.log('📝 Creating Properties attributes...');
    const propertiesAttributes = [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000, required: true },
      { key: 'price', type: 'integer', required: true },
      { key: 'location', type: 'string', size: 255, required: true },
      { key: 'address', type: 'string', size: 500, required: true },
      { key: 'zipCode', type: 'string', size: 20, required: true },
      { key: 'country', type: 'string', size: 100, required: false, default: 'United States' },
      { key: 'propertyType', type: 'string', size: 50, required: true },
      { key: 'bedrooms', type: 'integer', required: true },
      { key: 'bathrooms', type: 'integer', required: true },
      { key: 'area', type: 'integer', required: true },
      { key: 'furnished', type: 'boolean', required: false, default: false },
      { key: 'petFriendly', type: 'boolean', required: false, default: false },
      { key: 'parking', type: 'boolean', required: false, default: false },
      { key: 'amenities', type: 'string', size: 50, required: false, array: true },
      { key: 'images', type: 'string', size: 255, required: false, array: true },
      { key: 'featured', type: 'boolean', required: false, default: false },
      { key: 'listingType', type: 'string', size: 20, required: false, default: 'rent' },
      { key: 'status', type: 'string', size: 20, required: true, default: 'available' },
      { key: 'ownerId', type: 'string', size: 255, required: true },
      { key: 'contactEmail', type: 'string', size: 255, required: true },
      { key: 'contactPhone', type: 'string', size: 20, required: false },
      { key: 'latitude', type: 'float', required: false },
      { key: 'longitude', type: 'float', required: false },
      { key: 'views', type: 'integer', required: false, default: 0 }
    ];

    for (const attr of propertiesAttributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            DATABASE_ID_TO_USE,
            PROPERTIES_COLLECTION_ID,
            attr.key,
            attr.size,
            attr.required,
            attr.default,
            attr.array || false
          );
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            DATABASE_ID_TO_USE,
            PROPERTIES_COLLECTION_ID,
            attr.key,
            attr.required,
            null,
            null,
            attr.default
          );
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            DATABASE_ID_TO_USE,
            PROPERTIES_COLLECTION_ID,
            attr.key,
            attr.required,
            attr.default
          );
        } else if (attr.type === 'float') {
          await databases.createFloatAttribute(
            DATABASE_ID_TO_USE,
            PROPERTIES_COLLECTION_ID,
            attr.key,
            attr.required
          );
        }
        console.log(`✅ Created attribute: ${attr.key}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attributes
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Attribute ${attr.key} already exists`);
        } else {
          console.error(`❌ Error creating attribute ${attr.key}:`, error.message);
        }
      }
    }

    // Step 4: Create Properties Indexes
    console.log('🔍 Creating Properties indexes...');
    const propertiesIndexes = [
      { key: 'price_index', type: 'key', attributes: ['price'] },
      { key: 'location_index', type: 'key', attributes: ['location'] },
      { key: 'propertyType_index', type: 'key', attributes: ['propertyType'] },
      { key: 'bedrooms_index', type: 'key', attributes: ['bedrooms'] },
      { key: 'featured_index', type: 'key', attributes: ['featured'] },
      { key: 'status_index', type: 'key', attributes: ['status'] },
      { key: 'ownerId_index', type: 'key', attributes: ['ownerId'] }
    ];

    for (const index of propertiesIndexes) {
      try {
        await databases.createIndex(
          DATABASE_ID_TO_USE,
          PROPERTIES_COLLECTION_ID,
          index.key,
          index.type,
          index.attributes
        );
        console.log(`✅ Created index: ${index.key}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between indexes
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Index ${index.key} already exists`);
        } else {
          console.error(`❌ Error creating index ${index.key}:`, error.message);
        }
      }
    }

    // Step 5: Create User Profiles Collection
    console.log('👤 Creating User Profiles collection...');
    try {
      await databases.createCollection(
        DATABASE_ID_TO_USE,
        USER_PROFILES_COLLECTION_ID,
        'User Profiles',
        [          Permission.read(Role.any()),          Permission.create(Role.users()),          Permission.update(Role.users()),          Permission.delete(Role.users())        ]
      );
      console.log('✅ User Profiles collection created');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  User Profiles collection already exists');
      } else {
        throw error;
      }
    }

    // Step 6: Create User Profiles Attributes
    console.log('📝 Creating User Profiles attributes...');
    const userProfilesAttributes = [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'firstName', type: 'string', size: 100, required: true },
      { key: 'lastName', type: 'string', size: 100, required: true },
      { key: 'phone', type: 'string', size: 20, required: false },
      { key: 'avatar', type: 'string', size: 255, required: false },
      { key: 'bio', type: 'string', size: 500, required: false },
      { key: 'isLandlord', type: 'boolean', required: false, default: false },
      { key: 'verified', type: 'boolean', required: false, default: false }
    ];

    for (const attr of userProfilesAttributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            DATABASE_ID_TO_USE,
            USER_PROFILES_COLLECTION_ID,
            attr.key,
            attr.size,
            attr.required,
            attr.default
          );
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            DATABASE_ID_TO_USE,
            USER_PROFILES_COLLECTION_ID,
            attr.key,
            attr.required,
            attr.default
          );
        }
        console.log(`✅ Created user profile attribute: ${attr.key}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  User profile attribute ${attr.key} already exists`);
        } else {
          console.error(`❌ Error creating user profile attribute ${attr.key}:`, error.message);
        }
      }
    }

    // Step 7: Create Favorites Collection
    console.log('❤️  Creating Favorites collection...');
    try {
      await databases.createCollection(
        DATABASE_ID_TO_USE,
        FAVORITES_COLLECTION_ID,
        'User Favorites',
        [
          Permission.read(Role.users()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );
      console.log('✅ Favorites collection created');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Favorites collection already exists');
      } else {
        throw error;
      }
    }

    // Step 8: Create Favorites Attributes
    console.log('📝 Creating Favorites attributes...');
    const favoritesAttributes = [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'propertyId', type: 'string', size: 255, required: true }
    ];

    for (const attr of favoritesAttributes) {
      try {
        await databases.createStringAttribute(
          DATABASE_ID_TO_USE,
          FAVORITES_COLLECTION_ID,
          attr.key,
          attr.size,
          attr.required
        );
        console.log(`✅ Created favorites attribute: ${attr.key}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Favorites attribute ${attr.key} already exists`);
        } else {
          console.error(`❌ Error creating favorites attribute ${attr.key}:`, error.message);
        }
      }
    }

    // Step 9: Create Favorites Indexes
    console.log('🔍 Creating Favorites indexes...');
    const favoritesIndexes = [
      { key: 'userId_index', type: 'key', attributes: ['userId'] },
      { key: 'propertyId_index', type: 'key', attributes: ['propertyId'] },
      { key: 'user_property_unique', type: 'unique', attributes: ['userId', 'propertyId'] }
    ];

    for (const index of favoritesIndexes) {
      try {
        await databases.createIndex(
          DATABASE_ID_TO_USE,
          FAVORITES_COLLECTION_ID,
          index.key,
          index.type,
          index.attributes
        );
        console.log(`✅ Created favorites index: ${index.key}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Favorites index ${index.key} already exists`);
        } else {
          console.error(`❌ Error creating favorites index ${index.key}:`, error.message);
        }
      }
    }

    // Step 10: Create Messages Collection
    console.log('💬 Creating Messages collection...');
    try {
      await databases.createCollection(
        DATABASE_ID_TO_USE,
        MESSAGES_COLLECTION_ID,
        'Property Inquiries',
        [
          Permission.read(Role.users()),
          Permission.create(Role.any()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );
      console.log('✅ Messages collection created');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Messages collection already exists');
      } else {
        throw error;
      }
    }

    // Step 11: Create Messages Attributes
    console.log('📝 Creating Messages attributes...');
    const messagesAttributes = [
      { key: 'propertyId', type: 'string', size: 255, required: true },
      { key: 'senderName', type: 'string', size: 100, required: true },
      { key: 'senderEmail', type: 'string', size: 255, required: true },
      { key: 'senderPhone', type: 'string', size: 20, required: false },
      { key: 'message', type: 'string', size: 1000, required: true },
      { key: 'status', type: 'string', size: 50, required: false, default: 'pending' },
      { key: 'ownerId', type: 'string', size: 255, required: true }
    ];

    for (const attr of messagesAttributes) {
      try {
        await databases.createStringAttribute(
          DATABASE_ID_TO_USE,
          MESSAGES_COLLECTION_ID,
          attr.key,
          attr.size,
          attr.required,
          attr.default
        );
        console.log(`✅ Created messages attribute: ${attr.key}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Messages attribute ${attr.key} already exists`);
        } else {
          console.error(`❌ Error creating messages attribute ${attr.key}:`, error.message);
        }
      }
    }

    // Step 12: Create Messages Indexes
    console.log('🔍 Creating Messages indexes...');
    const messagesIndexes = [
      { key: 'propertyId_index', type: 'key', attributes: ['propertyId'] },
      { key: 'ownerId_index', type: 'key', attributes: ['ownerId'] },
      { key: 'status_index', type: 'key', attributes: ['status'] }
    ];

    for (const index of messagesIndexes) {
      try {
        await databases.createIndex(
          DATABASE_ID_TO_USE,
          MESSAGES_COLLECTION_ID,
          index.key,
          index.type,
          index.attributes
        );
        console.log(`✅ Created messages index: ${index.key}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Messages index ${index.key} already exists`);
        } else {
          console.error(`❌ Error creating messages index ${index.key}:`, error.message);
        }
      }
    }

    // Step 13: Create Comments Collection
    console.log('💬 Creating Comments collection...');
    try {
      await databases.createCollection(
        DATABASE_ID_TO_USE,
        COMMENTS_COLLECTION_ID,
        'Property Comments',
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );
      console.log('✅ Comments collection created');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Comments collection already exists');
      } else {
        throw error;
      }
    }

    // Step 14: Create Comments Attributes
    console.log('📝 Creating Comments attributes...');
    const commentsAttributes = [
      { key: 'propertyId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'userName', type: 'string', size: 100, required: true },
      { key: 'content', type: 'string', size: 1000, required: true },
      { key: 'propertyOwnerId', type: 'string', size: 255, required: false },
      { key: 'propertyTitle', type: 'string', size: 255, required: false },
      { key: 'parentCommentId', type: 'string', size: 255, required: false },
      { key: 'isOwner', type: 'boolean', required: false, default: false },
      { key: 'pinned', type: 'boolean', required: false, default: false },
      { key: 'pinnedAt', type: 'datetime', required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ];

    for (const attr of commentsAttributes) {
      try {
        if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            DATABASE_ID_TO_USE,
            COMMENTS_COLLECTION_ID,
            attr.key,
            attr.required,
            attr.default
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            DATABASE_ID_TO_USE,
            COMMENTS_COLLECTION_ID,
            attr.key,
            attr.required
          );
        } else {
          await databases.createStringAttribute(
            DATABASE_ID_TO_USE,
            COMMENTS_COLLECTION_ID,
            attr.key,
            attr.size,
            attr.required
          );
        }
        console.log(`✅ Created comments attribute: ${attr.key}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Comments attribute ${attr.key} already exists`);
        } else {
          console.error(`❌ Error creating comments attribute ${attr.key}:`, error.message);
        }
      }
    }

    // Step 15: Create Comments Indexes
    console.log('🔍 Creating Comments indexes...');
    const commentsIndexes = [
      { key: 'propertyId_index', type: 'key', attributes: ['propertyId'] },
      { key: 'userId_index', type: 'key', attributes: ['userId'] },
      { key: 'parentCommentId_index', type: 'key', attributes: ['parentCommentId'] },
      { key: 'createdAt_index', type: 'key', attributes: ['createdAt'] }
    ];

    for (const index of commentsIndexes) {
      try {
        await databases.createIndex(
          DATABASE_ID_TO_USE,
          COMMENTS_COLLECTION_ID,
          index.key,
          index.type,
          index.attributes
        );
        console.log(`✅ Created comments index: ${index.key}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Comments index ${index.key} already exists`);
        } else {
          console.error(`❌ Error creating comments index ${index.key}:`, error.message);
        }
      }
    }

    // Step 16: Create Notifications Collection
    console.log('🔔 Creating Notifications collection...');
    try {
      await databases.createCollection(
        DATABASE_ID_TO_USE,
        NOTIFICATIONS_COLLECTION_ID,
        'User Notifications',
        [
          Permission.read(Role.users()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );
      console.log('✅ Notifications collection created');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Notifications collection already exists');
      } else {
        console.error('❌ Error creating notifications collection:', error.message);
        throw error;
      }
    }

    // Step 17: Create Notifications Attributes
    console.log('📝 Creating Notifications attributes...');
    const notificationsAttributes = [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'message', type: 'string', size: 1000, required: true },
      { key: 'propertyId', type: 'string', size: 255, required: false },
      { key: 'commentId', type: 'string', size: 255, required: false },
      { key: 'originalCommentId', type: 'string', size: 255, required: false },
      { key: 'commenterId', type: 'string', size: 255, required: false },
      { key: 'commenterName', type: 'string', size: 255, required: false },
      { key: 'originalComment', type: 'string', size: 500, required: false },
      { key: 'isRead', type: 'boolean', required: true, default: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ];

    for (const attr of notificationsAttributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            DATABASE_ID_TO_USE,
            NOTIFICATIONS_COLLECTION_ID,
            attr.key,
            attr.size,
            attr.required,
            attr.default
          );
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            DATABASE_ID_TO_USE,
            NOTIFICATIONS_COLLECTION_ID,
            attr.key,
            attr.required,
            attr.default
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            DATABASE_ID_TO_USE,
            NOTIFICATIONS_COLLECTION_ID,
            attr.key,
            attr.required,
            attr.default
          );
        }
        console.log(`✅ Created notifications attribute: ${attr.key}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Notifications attribute ${attr.key} already exists`);
        } else {
          console.error(`❌ Error creating notifications attribute ${attr.key}:`, error.message);
        }
      }
    }

    // Step 18: Create Notifications Indexes
    console.log('🔍 Creating Notifications indexes...');
    const notificationsIndexes = [
      { key: 'userId_index', type: 'key', attributes: ['userId'] },
      { key: 'type_index', type: 'key', attributes: ['type'] },
      { key: 'isRead_index', type: 'key', attributes: ['isRead'] },
      { key: 'createdAt_index', type: 'key', attributes: ['createdAt'] }
    ];

    for (const index of notificationsIndexes) {
      try {
        await databases.createIndex(
          DATABASE_ID_TO_USE,
          NOTIFICATIONS_COLLECTION_ID,
          index.key,
          index.type,
          index.attributes
        );
        console.log(`✅ Created notifications index: ${index.key}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Notifications index ${index.key} already exists`);
        } else {
          console.error(`❌ Error creating notifications index ${index.key}:`, error.message);
        }
      }
    }

    // Step 19: Create Storage Bucket
    console.log('🗂️  Setting up Storage bucket...');
    try {
      // Try to list existing buckets first
      const bucketsList = await storage.listBuckets();
      console.log(`ℹ️  Found ${bucketsList.buckets.length} existing buckets`);
      
      if (bucketsList.buckets.length > 0) {
        // Use the first existing bucket
        const existingBucket = bucketsList.buckets[0];
        console.log(`ℹ️  Using existing bucket: ${existingBucket.name} (${existingBucket.$id})`);
      } else {
        // Try to create new bucket
        await storage.createBucket(
          STORAGE_BUCKET_ID,
          'Property Images',
          [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
          ],
          false, // fileSecurity
          true,  // enabled
          10485760, // maxFileSize (10MB)
          ['jpg', 'jpeg', 'png', 'webp'], // allowedFileExtensions
          'gzip', // compression
          false, // encryption
          false  // antivirus
        );
        console.log('✅ Storage bucket created');
      }
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Storage bucket already exists');
      } else if (error.code === 403) {
        console.log('⚠️  Storage bucket limit reached on free plan. Using existing buckets.');
      } else {
        console.error('❌ Storage bucket error:', error.message);
      }
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Database: rental-app-db');
    console.log('✅ Collections: properties, user-profiles, favorites, messages, comments, notifications');
    console.log('✅ Storage: property-images bucket');
    console.log('✅ All attributes and indexes created');
    console.log('\n🔧 Next steps:');
    console.log('1. Update your .env file with the collection IDs');
    console.log('2. Test the connection in your React app');
    console.log('3. Add sample data if needed');
    console.log('\n🚀 Your Appwrite database is ready to use!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();

// Export for potential reuse
export {
  setupDatabase,
  DATABASE_ID,
  PROPERTIES_COLLECTION_ID,
  USER_PROFILES_COLLECTION_ID,
  FAVORITES_COLLECTION_ID,
  MESSAGES_COLLECTION_ID,
  COMMENTS_COLLECTION_ID,
  NOTIFICATIONS_COLLECTION_ID,
  STORAGE_BUCKET_ID
};

export default setupDatabase;