import { Client, Account, Databases, Storage, Query, ID } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database and Collection IDs from environment variables
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const PROPERTIES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PROPERTIES_COLLECTION_ID;
export const USERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
export const FAVORITES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FAVORITES_COLLECTION_ID;

export const VIEWS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_VIEWS_COLLECTION_ID;
export const INQUIRIES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_INQUIRIES_COLLECTION_ID;
export const COMMENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;
export const NOTIFICATIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID;

// Storage Bucket ID
export const STORAGE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID;

// Helper functions
export const appwriteConfig = {
  client,
  account,
  databases,
  storage,
  databaseId: DATABASE_ID,
  propertiesCollectionId: PROPERTIES_COLLECTION_ID,
  usersCollectionId: USERS_COLLECTION_ID,
  favoritesCollectionId: FAVORITES_COLLECTION_ID,

  viewsCollectionId: VIEWS_COLLECTION_ID,
  inquiriesCollectionId: INQUIRIES_COLLECTION_ID,
  commentsCollectionId: COMMENTS_COLLECTION_ID,
  notificationsCollectionId: NOTIFICATIONS_COLLECTION_ID,
  storageId: STORAGE_BUCKET_ID,
};

export { Query, ID };
export default client;