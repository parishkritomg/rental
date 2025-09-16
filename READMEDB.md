# Appwrite Database Setup Guide

This guide will walk you through setting up the Appwrite database for Zentro.

## Prerequisites

- Appwrite Cloud account or self-hosted Appwrite instance
- Project created in Appwrite Console
- Basic understanding of NoSQL databases

## Step 1: Create Appwrite Project

1. **Sign up/Login to Appwrite**
   - Go to [Appwrite Cloud](https://cloud.appwrite.io/) or your self-hosted instance
   - Create an account or login to existing account

2. **Create New Project**
   - Click "Create Project"
   - Enter project name: `Zentro`
   - Note down your **Project ID** (you'll need this for `.env` file)

## Step 2: Configure Project Settings

1. **Add Platform**
   - Go to "Settings" → "Platforms"
   - Click "Add Platform" → "Web App"
   - Name: `Zentro Web`
   - Hostname: `localhost` (for development)
   - Add production domain when deploying

2. **API Keys**
   - Go to "Settings" → "API Keys"
   - Note down your **API Endpoint** and **Project ID**

## Step 3: Create Database

1. **Navigate to Databases**
   - In Appwrite Console, go to "Databases"
   - Click "Create Database"
   - Database ID: `rental-app-db`
   - Name: `Rental App Database`

## Step 4: Create Collections

### Collection 1: Properties

1. **Create Properties Collection**
   - Click "Create Collection"
   - Collection ID: `properties`
   - Name: `Properties`

2. **Configure Properties Attributes**
   Add the following attributes:

   | Attribute | Type | Size | Required | Default | Array |
   |-----------|------|------|----------|---------|-------|
   | `title` | String | 255 | Yes | - | No |
   | `description` | String | 2000 | Yes | - | No |
   | `price` | Integer | - | Yes | - | No |
   | `location` | String | 255 | Yes | - | No |
   | `address` | String | 500 | Yes | - | No |
   | `propertyType` | String | 50 | Yes | - | No |
   | `bedrooms` | Integer | - | Yes | - | No |
   | `bathrooms` | Integer | - | Yes | - | No |
   | `area` | Integer | - | Yes | - | No |
   | `furnished` | Boolean | - | No | false | No |
   | `petFriendly` | Boolean | - | No | false | No |
   | `parking` | Boolean | - | No | false | No |
   | `amenities` | String | 50 | No | - | Yes |
   | `images` | String | 255 | No | - | Yes |
   | `featured` | Boolean | - | No | false | No |
   | `status` | String | 20 | Yes | available | No |
   | `ownerId` | String | 255 | Yes | - | No |
   | `contactEmail` | String | 255 | Yes | - | No |
   | `contactPhone` | String | 20 | No | - | No |
   | `latitude` | Float | - | No | - | No |
   | `longitude` | Float | - | No | - | No |

3. **Configure Properties Permissions**
   - **Create**: Users (authenticated users can create)
   - **Read**: Any (public can read)
   - **Update**: Users (only property owner can update)
   - **Delete**: Users (only property owner can delete)

4. **Create Properties Indexes**
   - Index 1: `price` (ascending)
   - Index 2: `location` (ascending)
   - Index 3: `propertyType` (ascending)
   - Index 4: `bedrooms` (ascending)
   - Index 5: `featured` (ascending)
   - Index 6: `status` (ascending)
   - Index 7: `ownerId` (ascending)

### Collection 2: Users (Optional - if extending default auth)

1. **Create Users Collection**
   - Collection ID: `user-profiles`
   - Name: `User Profiles`

2. **Configure User Profiles Attributes**
   | Attribute | Type | Size | Required | Default | Array |
   |-----------|------|------|----------|---------|-------|
   | `userId` | String | 255 | Yes | - | No |
   | `firstName` | String | 100 | Yes | - | No |
   | `lastName` | String | 100 | Yes | - | No |
   | `phone` | String | 20 | No | - | No |
   | `avatar` | String | 255 | No | - | No |
   | `bio` | String | 500 | No | - | No |
   | `isLandlord` | Boolean | - | No | false | No |
   | `verified` | Boolean | - | No | false | No |

### Collection 3: Favorites

1. **Create Favorites Collection**
   - Collection ID: `favorites`
   - Name: `User Favorites`

2. **Configure Favorites Attributes**
   | Attribute | Type | Size | Required | Default | Array |
   |-----------|------|------|----------|---------|-------|
   | `userId` | String | 255 | Yes | - | No |
   | `propertyId` | String | 255 | Yes | - | No |

3. **Create Favorites Indexes**
   - Index 1: `userId` (ascending)
   - Index 2: `propertyId` (ascending)
   - Index 3: Compound index: `userId` + `propertyId` (unique)

### Collection 4: Messages/Inquiries

1. **Create Messages Collection**
   - Collection ID: `messages`
   - Name: `Property Inquiries`

2. **Configure Messages Attributes**
   | Attribute | Type | Size | Required | Default | Array |
   |-----------|------|------|----------|---------|-------|
   | `propertyId` | String | 255 | Yes | - | No |
   | `senderName` | String | 100 | Yes | - | No |
   | `senderEmail` | String | 255 | Yes | - | No |
   | `senderPhone` | String | 20 | No | - | No |
   | `message` | String | 1000 | Yes | - | No |
   | `status` | String | 20 | Yes | unread | No |
   | `ownerId` | String | 255 | Yes | - | No |

## Step 5: Configure Storage

1. **Create Storage Bucket**
   - Go to "Storage"
   - Click "Create Bucket"
   - Bucket ID: `property-images`
   - Name: `Property Images`
   - Maximum file size: `10MB`
   - Allowed file extensions: `jpg,jpeg,png,webp`

2. **Configure Storage Permissions**
   - **Create**: Users (authenticated users can upload)
   - **Read**: Any (public can view images)
   - **Update**: Users (file owner only)
   - **Delete**: Users (file owner only)

## Step 6: Environment Configuration

Update your `.env` file with the following variables:

```env
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id-here
VITE_APPWRITE_DATABASE_ID=rental-app-db
VITE_APPWRITE_PROPERTIES_COLLECTION_ID=properties
VITE_APPWRITE_USERS_COLLECTION_ID=user-profiles
VITE_APPWRITE_FAVORITES_COLLECTION_ID=favorites
VITE_APPWRITE_MESSAGES_COLLECTION_ID=messages
VITE_APPWRITE_STORAGE_ID=property-images
```

## Step 7: Test Database Connection

1. **Update Appwrite Configuration**
   - Ensure `src/lib/appwrite.js` uses the correct environment variables
   - Test the connection by running the development server

2. **Verify Collections**
   - Try creating a test property through your application
   - Check if data appears in Appwrite Console

## Step 8: Sample Data (Optional)

You can add sample properties directly in Appwrite Console:

1. Go to "Databases" → "rental-app-db" → "properties"
2. Click "Create Document"
3. Add sample property data for testing

### Sample Property Document:
```json
{
  "title": "Modern Downtown Apartment",
  "description": "Beautiful 2-bedroom apartment in the heart of downtown",
  "price": 2500,
  "location": "Downtown",
  "address": "123 Main St, City, State 12345",
  "propertyType": "apartment",
  "bedrooms": 2,
  "bathrooms": 2,
  "area": 1200,
  "furnished": true,
  "petFriendly": false,
  "parking": true,
  "amenities": ["gym", "pool", "laundry"],
  "featured": true,
  "status": "available",
  "ownerId": "user-id-here",
  "contactEmail": "owner@example.com",
  "contactPhone": "+1234567890"
}
```

## Security Best Practices

1. **Permissions**: Always set appropriate read/write permissions
2. **Validation**: Use Appwrite's built-in validation rules
3. **Rate Limiting**: Configure rate limits in Appwrite settings
4. **API Keys**: Never expose API keys in client-side code
5. **HTTPS**: Always use HTTPS in production

## Troubleshooting

### Common Issues:

1. **Connection Failed**
   - Check project ID and endpoint URL
   - Verify platform configuration
   - Ensure CORS settings allow your domain

2. **Permission Denied**
   - Check collection permissions
   - Verify user authentication status
   - Review attribute-level permissions

3. **Document Creation Failed**
   - Validate required attributes
   - Check data types and sizes
   - Verify unique constraints

## Next Steps

1. Set up authentication (if not already done)
2. Implement real-time subscriptions for live updates
3. Add search functionality with Appwrite's full-text search
4. Configure backup and monitoring
5. Set up production environment

## Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite React SDK](https://appwrite.io/docs/quick-starts/react)
- [Database Best Practices](https://appwrite.io/docs/databases)
- [Security Guidelines](https://appwrite.io/docs/security)

---

**Note**: Replace `your-project-id-here` and other placeholder values with your actual Appwrite project details.