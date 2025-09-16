import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new Client();
const databases = new Databases(client);

client
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY); // Server API key needed for database operations

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const NOTIFICATIONS_COLLECTION_ID = 'notifications';

async function createNotificationsCollection() {
  try {
    console.log('Creating notifications collection...');
    
    // Create the collection
    const collection = await databases.createCollection(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      'Notifications',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any())
      ]
    );
    
    console.log('Collection created:', collection.$id);
    
    // Create attributes
    const attributes = [
      { key: 'userId', type: 'string', size: 50, required: true }, // Who receives the notification
      { key: 'type', type: 'string', size: 50, required: true }, // 'comment', 'reply', etc.
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'message', type: 'string', size: 1000, required: true },
      { key: 'propertyId', type: 'string', size: 50, required: false }, // Related property
      { key: 'commentId', type: 'string', size: 50, required: false }, // Related comment
      { key: 'originalCommentId', type: 'string', size: 50, required: false }, // For reply notifications
      { key: 'commenterId', type: 'string', size: 50, required: false }, // Who made the comment
      { key: 'commenterName', type: 'string', size: 100, required: false }, // Commenter's name
      { key: 'isRead', type: 'boolean', required: true, default: false },
      { key: 'createdAt', type: 'string', size: 50, required: true },
      { key: 'updatedAt', type: 'string', size: 50, required: true }
    ];
    
    for (const attr of attributes) {
      console.log(`Creating attribute: ${attr.key}`);
      
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          DATABASE_ID,
          NOTIFICATIONS_COLLECTION_ID,
          attr.key,
          attr.size,
          attr.required,
          attr.default
        );
      } else if (attr.type === 'boolean') {
        await databases.createBooleanAttribute(
          DATABASE_ID,
          NOTIFICATIONS_COLLECTION_ID,
          attr.key,
          attr.required,
          attr.default
        );
      }
      
      // Wait a bit between attribute creations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('All attributes created successfully!');
    
    // Create indexes
    console.log('Creating indexes...');
    
    await databases.createIndex(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      'userId_index',
      'key',
      ['userId']
    );
    
    await databases.createIndex(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      'isRead_index',
      'key',
      ['isRead']
    );
    
    await databases.createIndex(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      'type_index',
      'key',
      ['type']
    );
    
    await databases.createIndex(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      'createdAt_index',
      'key',
      ['createdAt'],
      ['desc']
    );
    
    await databases.createIndex(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      'propertyId_index',
      'key',
      ['propertyId']
    );
    
    console.log('Indexes created successfully!');
    console.log('Notifications collection setup complete!');
    
  } catch (error) {
    console.error('Error setting up notifications collection:', error);
  }
}

// Run the setup
createNotificationsCollection();