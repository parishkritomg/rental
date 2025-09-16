import { databases, Query, appwriteConfig } from '../lib/appwrite';
import { ID } from 'appwrite';
import { getUserProfile } from './userService';
import { notificationService } from './notificationService';

const { databaseId, commentsCollectionId } = appwriteConfig;

export const commentService = {
  // Create a new comment
  async createComment(commentData) {
    try {
      const response = await databases.createDocument(
        databaseId,
        commentsCollectionId,
        ID.unique(),
        {
          ...commentData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );

      // Create notification for property owner if comment is from someone else
      if (commentData.propertyOwnerId && commentData.userId !== commentData.propertyOwnerId) {
        console.log('Attempting to create notification for comment:', commentData);
        try {
          const notificationResult = await notificationService.createCommentNotification(
            commentData.propertyId,
            commentData.propertyOwnerId,
            commentData.userId,
            commentData.userName || 'Someone',
            commentData.content,
            commentData.propertyTitle || 'your property',
            response.$id // Pass the comment ID for scrolling
          );
          console.log('Notification creation result:', notificationResult);
        } catch (notificationError) {
          console.error('Error creating notification:', notificationError);
          // Don't fail the comment creation if notification fails
        }
      } else {
        console.log('Skipping notification creation:', { 
          hasPropertyOwnerId: !!commentData.propertyOwnerId, 
          isDifferentUser: commentData.userId !== commentData.propertyOwnerId 
        });
      }

      return { success: true, data: response };
    } catch (error) {
      console.error('Error creating comment:', error);
      return { success: false, error: error.message };
    }
  },

  // Get comments for a property
  async getPropertyComments(propertyId) {
    try {
      const response = await databases.listDocuments(
        databaseId,
        commentsCollectionId,
        [
          Query.equal('propertyId', propertyId),
          Query.isNull('parentCommentId'), // Only get top-level comments
          Query.orderDesc('createdAt')
        ]
      );
      return { success: true, data: response.documents };
    } catch (error) {
      console.error('Error fetching comments:', error);
      return { success: false, error: error.message };
    }
  },

  // Get replies for a comment
  async getCommentReplies(commentId) {
    try {
      const response = await databases.listDocuments(
        databaseId,
        commentsCollectionId,
        [
          Query.equal('parentCommentId', commentId),
          Query.orderAsc('createdAt')
        ]
      );
      return { success: true, data: response.documents };
    } catch (error) {
      console.error('Error fetching replies:', error);
      return { success: false, error: error.message };
    }
  },

  // Update a comment
  async updateComment(commentId, updateData) {
    try {
      const response = await databases.updateDocument(
        databaseId,
        commentsCollectionId,
        commentId,
        {
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      );
      return { success: true, data: response };
    } catch (error) {
      console.error('Error updating comment:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete a comment
  async deleteComment(commentId) {
    try {
      await databases.deleteDocument(
        databaseId,
        commentsCollectionId,
        commentId
      );
      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }
  },

  // Pin a comment (property owner only)
  async pinComment(commentId, propertyOwnerId, currentUserId) {
    try {
      // Verify that the current user is the property owner
      if (currentUserId !== propertyOwnerId) {
        return { success: false, error: 'Only property owners can pin comments' };
      }

      const response = await databases.updateDocument(
        databaseId,
        commentsCollectionId,
        commentId,
        {
          pinned: true,
          pinnedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      return { success: true, data: response };
    } catch (error) {
      console.error('Error pinning comment:', error);
      return { success: false, error: error.message };
    }
  },

  // Unpin a comment (property owner only)
  async unpinComment(commentId, propertyOwnerId, currentUserId) {
    try {
      // Verify that the current user is the property owner
      if (currentUserId !== propertyOwnerId) {
        return { success: false, error: 'Only property owners can unpin comments' };
      }

      const response = await databases.updateDocument(
        databaseId,
        commentsCollectionId,
        commentId,
        {
          pinned: false,
          pinnedAt: null,
          updatedAt: new Date().toISOString()
        }
      );
      return { success: true, data: response };
    } catch (error) {
      console.error('Error unpinning comment:', error);
      return { success: false, error: error.message };
    }
  },

  // Create a reply to a comment
  async createReply(replyData) {
    try {
      const response = await databases.createDocument(
        databaseId,
        commentsCollectionId,
        ID.unique(),
        {
          ...replyData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );

      // Create notification for the comment author being replied to
      if (replyData.replyToCommentId && replyData.userId) {
        try {
          // Get the original comment to find its author
          const originalComment = await databases.getDocument(
            databaseId,
            commentsCollectionId,
            replyData.replyToCommentId
          );

          // Only create notification if replying to someone else's comment
          if (originalComment.userId !== replyData.userId) {
            console.log('Creating reply notification for comment author:', originalComment.userId);
            
            await notificationService.createReplyNotification(
              replyData.propertyId,
              originalComment.userId, // Original comment author
              originalComment.$id, // Original comment ID
              replyData.userId, // Reply author
              replyData.userName || 'Someone',
              replyData.content,
              replyData.propertyTitle || 'a property',
              originalComment.content
            );
          }
        } catch (notificationError) {
          console.error('Error creating reply notification:', notificationError);
          // Don't fail the reply creation if notification fails
        }
      }

      return { success: true, data: response };
    } catch (error) {
      console.error('Error creating reply:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete all comments for a property (used when property is deleted)
  async deleteAllCommentsForProperty(propertyId) {
    try {
      // Get all comments for the property (including replies)
      const allCommentsResponse = await databases.listDocuments(
        databaseId,
        commentsCollectionId,
        [
          Query.equal('propertyId', propertyId)
        ]
      );

      if (!allCommentsResponse.documents || allCommentsResponse.documents.length === 0) {
        return { success: true, deletedCount: 0 };
      }

      // Delete all comments
      const deletePromises = allCommentsResponse.documents.map(comment => 
        databases.deleteDocument(
          databaseId,
          commentsCollectionId,
          comment.$id
        )
      );

      await Promise.all(deletePromises);
      
      return { success: true, deletedCount: allCommentsResponse.documents.length };
    } catch (error) {
      console.error('Error deleting comments for property:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all comments and replies for a property (nested structure)
  async getPropertyCommentsWithReplies(propertyId) {
    try {
      // Get all comments for the property
      const allCommentsResponse = await databases.listDocuments(
        databaseId,
        commentsCollectionId,
        [
          Query.equal('propertyId', propertyId),
          Query.orderDesc('createdAt')
        ]
      );

      if (!allCommentsResponse.documents) {
        return { success: true, data: [] };
      }

      const allComments = allCommentsResponse.documents;
      
      // Get unique user IDs from all comments
      const userIds = [...new Set(allComments.map(comment => comment.userId))];
      
      // Fetch user profiles for all users
      const userProfiles = {};
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const profile = await getUserProfile(userId);
            userProfiles[userId] = profile;
          } catch (error) {
            console.warn(`Failed to fetch profile for user ${userId}:`, error);
            userProfiles[userId] = null;
          }
        })
      );
      
      // Helper function to build nested comment tree
      const buildCommentTree = (parentId = null) => {
        return allComments
          .filter(comment => comment.parentCommentId === parentId)
          .sort((a, b) => {
            // For top-level comments, sort pinned first, then by date
            if (!parentId) {
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              return new Date(b.createdAt) - new Date(a.createdAt);
            }
            // For replies, sort by creation date (oldest first)
            return new Date(a.createdAt) - new Date(b.createdAt);
          })
          .map(comment => ({
            ...comment,
            userProfile: userProfiles[comment.userId],
            replies: buildCommentTree(comment.$id)
          }));
      };
      
      // Build the nested comment tree starting from top-level comments
      const nestedComments = buildCommentTree();

      return { success: true, data: nestedComments };
    } catch (error) {
      console.error('Error fetching comments with replies:', error);
      return { success: false, error: error.message };
    }
  }
};

export const {
  createComment,
  getPropertyComments,
  getCommentReplies,
  updateComment,
  deleteComment,
  deleteAllCommentsForProperty,
  pinComment,
  unpinComment,
  createReply,
  getPropertyCommentsWithReplies
} = commentService;

export default commentService;