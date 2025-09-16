-- Appwrite Database Schema for Rental App
-- Note: Appwrite uses NoSQL (document-based), but this shows the equivalent SQL structure
-- Use this as reference for creating collections and attributes in Appwrite Console

-- =============================================
-- DATABASE CREATION
-- =============================================
-- Database ID: rental-app-db
-- Database Name: Rental App Database

-- =============================================
-- PROPERTIES COLLECTION
-- =============================================
-- Collection ID: properties
-- Collection Name: Properties

-- Properties Table Structure (SQL equivalent)
CREATE TABLE properties (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT(2000) NOT NULL,
    price INTEGER NOT NULL,
    location VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    propertyType VARCHAR(50) NOT NULL,
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    area INTEGER NOT NULL,
    furnished BOOLEAN DEFAULT FALSE,
    petFriendly BOOLEAN DEFAULT FALSE,
    parking BOOLEAN DEFAULT FALSE,
    amenities JSON, -- Array of strings
    images JSON, -- Array of image URLs
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'available',
    ownerId VARCHAR(255) NOT NULL,
    contactEmail VARCHAR(255) NOT NULL,
    contactPhone VARCHAR(20),
    latitude FLOAT,
    longitude FLOAT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Properties Indexes
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_location ON properties(location);
CREATE INDEX idx_properties_type ON properties(propertyType);
CREATE INDEX idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX idx_properties_featured ON properties(featured);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_owner ON properties(ownerId);

-- =============================================
-- USER PROFILES COLLECTION
-- =============================================
-- Collection ID: user-profiles
-- Collection Name: User Profiles

CREATE TABLE user_profiles (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL UNIQUE,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(255),
    bio TEXT(500),
    isLandlord BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_userId ON user_profiles(userId);

-- =============================================
-- FAVORITES COLLECTION
-- =============================================
-- Collection ID: favorites
-- Collection Name: User Favorites

CREATE TABLE favorites (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    propertyId VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_property (userId, propertyId)
);

CREATE INDEX idx_favorites_userId ON favorites(userId);
CREATE INDEX idx_favorites_propertyId ON favorites(propertyId);

-- =============================================
-- MESSAGES COLLECTION
-- =============================================
-- Collection ID: messages
-- Collection Name: Property Inquiries

CREATE TABLE messages (
    id VARCHAR(255) PRIMARY KEY,
    propertyId VARCHAR(255) NOT NULL,
    senderName VARCHAR(100) NOT NULL,
    senderEmail VARCHAR(255) NOT NULL,
    senderPhone VARCHAR(20),
    message TEXT(1000) NOT NULL,
    status VARCHAR(20) DEFAULT 'unread',
    ownerId VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_propertyId ON messages(propertyId);
CREATE INDEX idx_messages_ownerId ON messages(ownerId);
CREATE INDEX idx_messages_status ON messages(status);

-- =============================================
-- STORAGE BUCKET
-- =============================================
-- Bucket ID: property-images
-- Bucket Name: Property Images
-- Max File Size: 10MB
-- Allowed Extensions: jpg, jpeg, png, webp

-- =============================================
-- SAMPLE DATA INSERTS
-- =============================================

-- Sample Properties
INSERT INTO properties (
    id, title, description, price, location, address, propertyType, 
    bedrooms, bathrooms, area, furnished, featured, ownerId, contactEmail
) VALUES 
(
    'prop_001',
    'Modern Downtown Apartment',
    'Beautiful 2-bedroom apartment in the heart of downtown with stunning city views.',
    1500,
    'Downtown',
    '123 Main Street, City Center',
    'apartment',
    2,
    2,
    850,
    true,
    true,
    'user_001',
    'owner@example.com'
),
(
    'prop_002',
    'Cozy Suburban House',
    'Spacious family home with garden and garage in quiet neighborhood.',
    2200,
    'Suburbs',
    '456 Oak Avenue, Suburbia',
    'house',
    3,
    2,
    1200,
    false,
    false,
    'user_002',
    'landlord@example.com'
);

-- Sample User Profiles
INSERT INTO user_profiles (
    id, userId, firstName, lastName, isLandlord, verified
) VALUES 
(
    'profile_001',
    'user_001',
    'John',
    'Doe',
    true,
    true
),
(
    'profile_002',
    'user_002',
    'Jane',
    'Smith',
    true,
    false
);

-- Sample Favorites
INSERT INTO favorites (id, userId, propertyId) VALUES 
('fav_001', 'user_003', 'prop_001'),
('fav_002', 'user_004', 'prop_001'),
('fav_003', 'user_003', 'prop_002');

-- Sample Messages
INSERT INTO messages (
    id, propertyId, senderName, senderEmail, message, ownerId
) VALUES 
(
    'msg_001',
    'prop_001',
    'Alice Johnson',
    'alice@example.com',
    'Hi, I am interested in viewing this apartment. When would be a good time?',
    'user_001'
),
(
    'msg_002',
    'prop_002',
    'Bob Wilson',
    'bob@example.com',
    'Is this property still available? I would like to schedule a viewing.',
    'user_002'
);

-- =============================================
-- APPWRITE CONSOLE COMMANDS (Manual Setup)
-- =============================================

/*
To create this in Appwrite Console:

1. Create Database:
   - Go to Databases → Create Database
   - Database ID: rental-app-db
   - Name: Rental App Database

2. Create Collections:
   
   A) Properties Collection:
   - Collection ID: properties
   - Name: Properties
   - Permissions: Read(Any), Create/Update/Delete(Users)
   
   B) User Profiles Collection:
   - Collection ID: user-profiles
   - Name: User Profiles
   - Permissions: Read/Create/Update/Delete(Users)
   
   C) Favorites Collection:
   - Collection ID: favorites
   - Name: User Favorites
   - Permissions: Read/Create/Update/Delete(Users)
   
   D) Messages Collection:
   - Collection ID: messages
   - Name: Property Inquiries
   - Permissions: Read(Users), Create(Any), Update/Delete(Users)

3. Create Storage Bucket:
   - Bucket ID: property-images
   - Name: Property Images
   - Max File Size: 10MB
   - File Extensions: jpg, jpeg, png, webp
   - Permissions: Read(Any), Create/Update/Delete(Users)

4. Add Attributes to each collection as shown in the table structures above

5. Create Indexes as shown in the CREATE INDEX statements
*/

-- =============================================
-- ENVIRONMENT VARIABLES NEEDED
-- =============================================

/*
Add these to your .env file:

VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=rental-app-db
VITE_APPWRITE_PROPERTIES_COLLECTION_ID=properties
VITE_APPWRITE_USERS_COLLECTION_ID=user-profiles
VITE_APPWRITE_FAVORITES_COLLECTION_ID=favorites
VITE_APPWRITE_MESSAGES_COLLECTION_ID=messages
VITE_APPWRITE_STORAGE_ID=property-images
APPWRITE_API_KEY=your-api-key-for-server-operations
*/