import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { X, Bell, Megaphone } from 'lucide-react';

const NotificationBanner = () => {
  const [notifications, setNotifications] = useState([]);
  const [dismissedNotifications, setDismissedNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    loadNotifications();
    // Load dismissed notifications from localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
    setDismissedNotifications(dismissed);
  }, [user]);

  const loadNotifications = async () => {
    try {
      if (user) {
        const data = await notificationService.getUserNotifications(user.$id);
        // Ensure data is always an array
        setNotifications(Array.isArray(data) ? data : []);
      } else {
        // No notifications for non-logged in users
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Set empty array on error to prevent crashes
      setNotifications([]);
    }
  };

  const dismissNotification = (notificationId) => {
    const newDismissed = [...dismissedNotifications, notificationId];
    setDismissedNotifications(newDismissed);
    localStorage.setItem('dismissedNotifications', JSON.stringify(newDismissed));
  };

  // Filter out dismissed notifications - ensure notifications is an array
  const visibleNotifications = (Array.isArray(notifications) ? notifications : []).filter(
    notification => !dismissedNotifications.includes(notification.$id)
  );

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="container-responsive py-4">
    <div className="space-y-2">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.$id}
          className={`relative px-4 py-3 rounded-lg shadow-sm border-l-4 ${
            notification.type === 'announcement'
              ? 'bg-blue-50 border-blue-400 text-blue-800'
              : 'bg-yellow-50 border-yellow-400 text-yellow-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {notification.type === 'announcement' ? (
                  <Megaphone className="h-5 w-5" />
                ) : (
                  <Bell className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{notification.title}</h4>
                <p className="mt-1 text-sm opacity-90">{notification.message}</p>
                <p className="mt-2 text-xs opacity-75">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => dismissNotification(notification.$id)}
              className="flex-shrink-0 ml-4 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
    </div>
  );
};

export default NotificationBanner;