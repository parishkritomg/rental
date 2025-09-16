import React from 'react';
import { ArrowLeft, Bell, Menu, BarChart3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const MobileAppHeader = ({ 
  title, 
  showBack = false, 
  showNotifications = true,
  showDashboard = true,
  showMenu = false,
  onMenuClick,
  onNotificationClick,
  onDashboardClick,
  unreadCount = 0
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBackClick = () => {
    navigate(-1);
  };

  const getPageTitle = () => {
    if (title) return title;
    
    switch (location.pathname) {
      case '/':
        return 'Zentro';
      case '/properties':
        return 'Properties';
      case '/add-property':
        return 'Add Property';
      case '/profile':
        return 'Profile';
      case '/login':
        return 'Sign In';
      case '/register':
        return 'Sign Up';
      default:
        return 'Zentro';
    }
  };

  return (
    <>
      <div className="status-bar" />
      <header className="app-header">
        <div className="relative flex items-center justify-between w-full">
          {/* Far Left - Logo (home page only) and navigation */}
          <div className="flex items-center space-x-3 z-10">
            {location.pathname === '/' && (
              <img 
                src="/assets/logo-for-app.png" 
                alt="Zentro Logo" 
                className="w-8 h-8"
              />
            )}
            {showBack ? (
              <button
                onClick={handleBackClick}
                className="touch-target p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
            ) : showMenu ? (
              <button
                onClick={onMenuClick}
                className="touch-target p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
            ) : null}
          </div>

          {/* Center - Zentro text on home page, title on other pages */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-[60%]">
            {location.pathname === '/' ? (
              <h1 className="text-lg font-semibold text-gray-800">Zentro</h1>
            ) : (
              <h1 className="text-lg font-semibold text-gray-800 truncate text-center px-2">
                {getPageTitle()}
              </h1>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-1 z-10">
            {showDashboard && (
              <button
                onClick={onDashboardClick}
                className="touch-target p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Dashboard"
              >
                <BarChart3 className="w-6 h-6 text-gray-700" />
              </button>
            )}
            {showNotifications && (
              <button
                onClick={onNotificationClick}
                className="touch-target p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-6 h-6 text-gray-700" />
                {/* Notification badge */}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default MobileAppHeader;