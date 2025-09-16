import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, LogIn, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { commentService } from '../services/commentService';
import { userService } from '../services/userService';

const CommentForm = ({ propertyId, propertyOwnerId, propertyTitle, onCommentSubmit }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Load user profile on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          const profile = await userService.getUserProfile(user.$id);
          setUserProfile(profile);
        } catch (error) {
          console.warn('Failed to load user profile:', error);
        }
      }
    };
    
    loadUserProfile();
  }, [user]);

  // Generate consistent profile colors based on name
  const getProfileColors = (name) => {
    if (!name) return 'from-blue-500 to-blue-600';
    const colors = [
      'from-blue-500 to-blue-600',
      'from-blue-400 to-blue-500',
      'from-indigo-500 to-blue-600',
      'from-cyan-500 to-blue-500',
      'from-blue-600 to-indigo-600',
      'from-slate-500 to-blue-600'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        content: comment.trim(),
        userId: user.$id,
        userName: user.name || user.email,
        propertyId: propertyId,
        propertyOwnerId: propertyOwnerId,
        propertyTitle: propertyTitle,
        parentCommentId: null // This is a top-level comment
      };

      const result = await commentService.createComment(commentData);
      
      if (result.success) {
        setComment('');
        if (onCommentSubmit) {
          onCommentSubmit(result.data);
        }
      } else {
        console.error('Comment submission failed:', result.error);
        alert('Failed to submit comment: ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Error submitting comment: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <LogIn className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">Please log in to leave a comment</p>
        <button
          onClick={() => window.location.href = '/login'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex gap-3">
        <div className="relative">
          {userProfile?.avatar ? (
            <img 
              src={userService.getProfilePhotoUrl(userProfile.avatar)}
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
              userProfile?.avatar ? 'hidden' : ''
            }`}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
        <div className="flex-1">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Share your thoughts about this property..."
            required
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;