import React, { useState, useEffect } from 'react';
import { MessageCircle, MoreVertical, Edit, Trash2, Reply, Crown, Heart, Pin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { commentService } from '../services/commentService';
import { userService } from '../services/userService';

const Comment = ({ 
  comment, 
  propertyOwnerId, 
  onReply, 
  onEdit, 
  onDelete, 
  onReplySubmit,
  level = 0 
}) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [isPinning, setIsPinning] = useState(false);

  const isOwner = comment.userId === propertyOwnerId;
  const isCurrentUser = user && comment.userId === user.$id;
  const isPropertyOwner = user && user.$id === propertyOwnerId;
  const canEdit = isCurrentUser;
  const canDelete = isCurrentUser;
  const canPin = isPropertyOwner && !comment.parentCommentId; // Only property owners can pin top-level comments

  // Load current user profile for reply form
  useEffect(() => {
    const loadCurrentUserProfile = async () => {
      if (user) {
        try {
          const profile = await userService.getUserProfile(user.$id);
          setCurrentUserProfile(profile);
        } catch (error) {
          console.warn('Failed to load current user profile:', error);
        }
      }
    };
    
    loadCurrentUserProfile();
  }, [user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      return date.toLocaleDateString();
    }
  };

  const getProfileColors = (name) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-blue-400 to-blue-500',
      'from-indigo-500 to-blue-600',
      'from-cyan-500 to-blue-500',
      'from-blue-600 to-indigo-600',
      'from-slate-500 to-blue-600'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const replyData = {
        content: replyText.trim(),
        userId: user.$id,
        userName: user.name || user.email,
        propertyId: comment.propertyId,
        parentCommentId: comment.parentCommentId || comment.$id, // For nested replies, use the top-level comment ID
        replyToCommentId: comment.$id // Track which specific comment this is replying to
      };

      const result = await commentService.createReply(replyData);
      if (result.success) {
        setReplyText('');
        setShowReplyForm(false);
        if (onReplySubmit) {
          onReplySubmit(result.data);
        }
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editText.trim()) return;

    setIsUpdating(true);
    try {
      const result = await commentService.updateComment(comment.$id, {
        content: editText.trim()
      });
      if (result.success) {
        setIsEditing(false);
        if (onEdit) {
          onEdit(comment.$id, editText.trim());
        }
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePinToggle = async () => {
    if (!canPin || isPinning) return;

    setIsPinning(true);
    try {
      const result = comment.pinned 
        ? await commentService.unpinComment(comment.$id, propertyOwnerId, user.$id)
        : await commentService.pinComment(comment.$id, propertyOwnerId, user.$id);
      
      if (result.success) {
        // Update the comment object locally to reflect the change
        comment.pinned = !comment.pinned;
        comment.pinnedAt = comment.pinned ? new Date().toISOString() : null;
        // Force a re-render by updating a state that doesn't affect the UI
        setShowMenu(false);
      } else {
        console.error('Error toggling pin:', result.error);
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    } finally {
      setIsPinning(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const result = await commentService.deleteComment(comment.$id);
      if (result.success && onDelete) {
        onDelete(comment.$id);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Limit nesting depth for better UX
  const maxNestingLevel = 5;
  const effectiveLevel = Math.min(level, maxNestingLevel);
  const indentationClass = effectiveLevel > 0 ? `ml-${Math.min(effectiveLevel * 4, 16)} border-l-2 border-gray-200 pl-4` : '';

  return (
    <div className={indentationClass}>
      <div 
        id={`comment-${comment.$id}`}
        className={`bg-white rounded-lg shadow-sm border p-3 mb-2 transition-colors duration-300 ${
        comment.pinned 
          ? 'border-blue-300 bg-blue-50/30 shadow-md' 
          : 'border-gray-200'
      } ${effectiveLevel > 0 ? 'bg-gray-50/50' : ''}`}>
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2">
            <div className="relative">
              {comment.userProfile?.avatar ? (
                <img 
                  src={userService.getProfilePhotoUrl(comment.userProfile.avatar)}
                  alt={comment.userName || 'User'}
                  className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-sm"
                  onError={(e) => {
                    // Fallback to gradient avatar if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-6 h-6 bg-gradient-to-br ${getProfileColors(comment.userName)} rounded-full flex items-center justify-center text-white font-medium text-xs ${
                  comment.userProfile?.avatar ? 'hidden' : ''
                }`}
              >
                {comment.userName ? comment.userName.charAt(0).toUpperCase() : 'U'}
              </div>
              {isOwner && (
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
                  <Crown className="w-1.5 h-1.5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">
                  {comment.userName || 'Anonymous'}
                </span>
                {isOwner && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                    <Crown className="w-3 h-3" />
                    Owner
                  </span>
                )}
                {comment.pinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    <Pin className="w-3 h-3" />
                    Pinned
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{formatDate(comment.createdAt)}</span>
                {comment.updatedAt !== comment.createdAt && (
                  <span className="text-blue-500">(edited)</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          {(canEdit || canDelete || canPin) && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[100px]">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                  {canPin && (
                    <button
                      onClick={() => {
                        handlePinToggle();
                        setShowMenu(false);
                      }}
                      disabled={isPinning}
                      className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Pin className="w-3 h-3" />
                      {isPinning ? 'Processing...' : (comment.pinned ? 'Unpin' : 'Pin')}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <form onSubmit={handleEdit} className="mb-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={isUpdating || !editText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.content);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-3">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
          </div>
        )}

        {/* Comment Actions */}
        {!isEditing && user && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              <Reply className="w-4 h-4" />
              Reply
            </button>
            {comment.replies && comment.replies.length > 0 && (
              <span className="text-sm text-gray-500">
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>
        )}

        {/* Reply Form */}
        {showReplyForm && user && (
          <form onSubmit={handleReplySubmit} className="mt-4 border-t border-gray-100 pt-4">
            {/* Replying to indicator */}
            {level > 0 && (
              <div className="mb-3 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                <span className="font-medium">Replying to {comment.userProfile?.name || comment.userName || 'User'}</span>
                <span className="ml-2 text-gray-500">"</span>
                <span className="text-gray-700 italic">
                  {comment.content.length > 50 ? comment.content.substring(0, 50) + '...' : comment.content}
                </span>
                <span className="text-gray-500">"</span>
              </div>
            )}
            <div className="flex gap-3">
              <div className="relative">
                {currentUserProfile?.avatar ? (
                  <img 
                    src={userService.getProfilePhotoUrl(currentUserProfile.avatar)}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                    onError={(e) => {
                      // Fallback to gradient avatar if image fails to load
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-8 h-8 bg-gradient-to-br ${getProfileColors(user.name)} rounded-full flex items-center justify-center text-white font-medium text-sm ${
                    currentUserProfile?.avatar ? 'hidden' : ''
                  }`}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              <div className="flex-1">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Write a reply..."
                  required
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !replyText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isSubmitting ? 'Posting...' : 'Reply'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyText('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Render Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.$id}
              comment={reply}
              propertyOwnerId={propertyOwnerId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReplySubmit={onReplySubmit}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;