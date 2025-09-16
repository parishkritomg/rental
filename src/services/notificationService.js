import { databases, Query } from '../lib/appwrite';
import { appwriteConfig } from '../lib/appwrite';
import { ID } from 'appwrite';

const { databaseId, notificationsCollectionId } = appwriteConfig;
const NOTIFICATIONS_COLLECTION_ID = notificationsCollectionId || 'notifications';

export const notificationService = {
  // Create a notification when someone comments on a property
  async createCommentNotification(propertyId, propertyOwnerId, commenterId, commenterName, commentContent, propertyTitle, commentId = null) {
    try {
      console.log('Creating notification with data:', { propertyId, propertyOwnerId, commenterId, commenterName, propertyTitle, commentId });
      
      // Don't create notification if the commenter is the property owner
      if (propertyOwnerId === commenterId) {
        console.log('Skipping notification - commenter is property owner');
        return { success: true, data: null };
      }

      const notification = {
        userId: propertyOwnerId, // Who should receive the notification
        type: 'comment',
        title: 'New Comment on Your Property',
        message: `${commenterName} commented on "${propertyTitle}": ${commentContent.substring(0, 100)}${commentContent.length > 100 ? '...' : ''}`,
        propertyId: propertyId,
        commentId: commentId, // Add the comment ID for scrolling
        commenterId: commenterId,
        commenterName: commenterName,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await databases.createDocument(
        databaseId,
        NOTIFICATIONS_COLLECTION_ID,
        ID.unique(),
        notification
      );

      console.log('Notification created successfully:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error creating comment notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Create a notification when someone replies to a comment
  async createReplyNotification(propertyId, originalCommentAuthorId, originalCommentId, replierId, replierName, replyContent, propertyTitle, originalCommentContent) {
    try {
      console.log('Creating reply notification with data:', { propertyId, originalCommentAuthorId, replierId, replierName, propertyTitle });
      
      // Don't create notification if the replier is the original comment author
      if (originalCommentAuthorId === replierId) {
        console.log('Skipping notification - replier is original comment author');
        return { success: true, data: null };
      }

      const notification = {
        userId: originalCommentAuthorId, // Who should receive the notification
        type: 'reply',
        title: 'New Reply to Your Comment',
        message: `${replierName} replied to your comment on "${propertyTitle}": ${replyContent.substring(0, 100)}${replyContent.length > 100 ? '...' : ''}`,
        propertyId: propertyId,
        originalCommentId: originalCommentId,
        commenterId: replierId,
        commenterName: replierName,
        originalComment: originalCommentContent.substring(0, 50) + (originalCommentContent.length > 50 ? '...' : ''),
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await databases.createDocument(
        databaseId,
        NOTIFICATIONS_COLLECTION_ID,
        ID.unique(),
        notification
      );

      console.log('Reply notification created successfully:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error creating reply notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Get notifications for a user
  async getUserNotifications(userId, limit = 20) {
    try {
      const response = await databases.listDocuments(
        databaseId,
        NOTIFICATIONS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.orderDesc('createdAt'),
          Query.limit(limit)
        ]
      );

      return { success: true, data: response.documents };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: error.message };
    }
  },

  // Get unread notification count
  async getUnreadCount(userId) {
    try {
      const response = await databases.listDocuments(
        databaseId,
        NOTIFICATIONS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('isRead', false)
        ]
      );

      return { success: true, count: response.documents.length };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { success: false, error: error.message, count: 0 };
    }
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const result = await databases.updateDocument(
        databaseId,
        NOTIFICATIONS_COLLECTION_ID,
        notificationId,
        {
          isRead: true,
          updatedAt: new Date().toISOString()
        }
      );

      return { success: true, data: result };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      const unreadNotifications = await databases.listDocuments(
        databaseId,
        NOTIFICATIONS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('isRead', false)
        ]
      );

      const updatePromises = unreadNotifications.documents.map(notification =>
        databases.updateDocument(
          databaseId,
          NOTIFICATIONS_COLLECTION_ID,
          notification.$id,
          {
            isRead: true,
            updatedAt: new Date().toISOString()
          }
        )
      );

      await Promise.all(updatePromises);
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete a specific notification
  async deleteNotification(notificationId) {
    try {
      await databases.deleteDocument(
        databaseId,
        NOTIFICATIONS_COLLECTION_ID,
        notificationId
      );
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete all notifications for a property (used when property is deleted)
  async deleteAllNotificationsForProperty(propertyId) {
    try {
      // Get all notifications for the property
      const notificationsResponse = await databases.listDocuments(
        databaseId,
        NOTIFICATIONS_COLLECTION_ID,
        [
          Query.equal('propertyId', propertyId)
        ]
      );

      if (!notificationsResponse.documents || notificationsResponse.documents.length === 0) {
        return { success: true, deletedCount: 0 };
      }

      // Delete all notifications
      const deletePromises = notificationsResponse.documents.map(notification => 
        databases.deleteDocument(
          databaseId,
          NOTIFICATIONS_COLLECTION_ID,
          notification.$id
        )
      );

      await Promise.all(deletePromises);
      
      return { success: true, deletedCount: notificationsResponse.documents.length };
    } catch (error) {
      console.error('Error deleting notifications for property:', error);
      return { success: false, error: error.message };
    }
  }
};

export default notificationService;