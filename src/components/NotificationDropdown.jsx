import React, { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, Trash2, Check, CheckCheck, Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotificationDropdown = ({ onClose }) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    fetchNotifications 
  } = useNotifications();



  // Click outside handling is now managed by the parent component

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.$id);
    }

    // Navigate to the property for both comment and reply notifications
    if ((notification.type === 'comment' || notification.type === 'reply') && notification.propertyId) {
      // Show loading animation for comment/reply notifications
      setIsNavigating(true);
      
      // Wait a moment to show the animation
      setTimeout(() => {
        // For reply notifications, navigate with the original comment ID to scroll to it
        if (notification.type === 'reply' && notification.originalCommentId) {
          navigate(`/property/${notification.propertyId}?commentId=${notification.originalCommentId}`);
        } else if (notification.type === 'comment' && notification.commentId) {
          // For comment notifications, navigate with the comment ID to scroll to it
          navigate(`/property/${notification.propertyId}?commentId=${notification.commentId}`);
        } else {
          // If no commentId is available, still navigate to the property but scroll to comments section
          navigate(`/property/${notification.propertyId}#comments`);
        }
        if (onClose) onClose();
        setIsNavigating(false);
      }, 1500); // Show animation for 1.5 seconds
    } else {
      // For other notification types, just mark as read and close dropdown
      if (onClose) onClose();
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Menu - Always visible when component is rendered */}
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3 w-3" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto relative">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.$id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 mt-1 ${
                        notification.type === 'comment' || notification.type === 'reply' ? 'text-blue-500' : 'text-gray-400'
                      }`}>
                        {notification.type === 'comment' || notification.type === 'reply' ? (
                          <MessageCircle className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-xs mt-1 ${
                              !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" title="Unread" />
                            )}
                            <button
                              onClick={(e) => handleDeleteNotification(e, notification.$id)}
                              className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1"
                              title="Delete notification"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Navigation Loading Overlay */}
            {isNavigating && (
              <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <MessageCircle className="w-8 h-8 text-blue-600 mr-3" />
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Taking you to comments...</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
    </div>
  );
};

export default NotificationDropdown;