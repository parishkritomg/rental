import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import MobileAppHeader from './components/MobileAppHeader';
import MobileAppNavigation from './components/MobileAppNavigation';
import SplashScreen from './components/SplashScreen';
import ScrollToTop from './components/ScrollToTop';
import NotificationBanner from './components/NotificationBanner';
import NotificationDropdown from './components/NotificationDropdown';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Dashboard from './pages/Dashboard';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import VerifyPhone from './pages/VerifyPhone';
import TestPage from './pages/TestPage';
import DebugNearYou from './pages/DebugNearYou';
import ProtectedRoute from './components/ProtectedRoute';
import PhoneNumberChecker from './components/PhoneNumberChecker';

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const { unreadCount } = useNotifications();
  
  // Show back button on all pages except home page
  const showBack = location.pathname !== '/';
  
  // Pages that shouldn't show bottom navigation
  const pagesWithoutBottomNav = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/verify-phone'];
  const showBottomNav = !pagesWithoutBottomNav.includes(location.pathname);
  
  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handleNotificationClick = () => {
    setShowNotificationDropdown(!showNotificationDropdown);
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotificationDropdown && !event.target.closest('.notification-dropdown-container')) {
        setShowNotificationDropdown(false);
      }
    };

    if (showNotificationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showNotificationDropdown]);
  
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }
  
  return (
    <div className="app-container">
      <MobileAppHeader 
        showBack={showBack}
        showNotifications={showBottomNav}
        onDashboardClick={handleDashboardClick}
        onNotificationClick={handleNotificationClick}
        unreadCount={unreadCount}
      />
      {showNotificationDropdown && (
        <div className="fixed top-16 right-4 z-50 notification-dropdown-container">
          <NotificationDropdown onClose={() => setShowNotificationDropdown(false)} />
        </div>
      )}
      <NotificationBanner />
      <main className="app-content">
        <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/property/:id" element={<PropertyDetail />} />

              <Route path="/test" element={<TestPage />} />
            
              <Route path="/debug-near-you" element={<DebugNearYou />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/verify-phone" element={<VerifyPhone />} />

              <Route path="/dashboard" element={<Dashboard />} />
              <Route 
                path="/property/new" 
                element={
                  <ProtectedRoute>
                    <AddProperty />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/property/edit/:id" 
                element={
                  <ProtectedRoute>
                    <EditProperty />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/favorites" 
                element={
                  <ProtectedRoute>
                    <Dashboard defaultTab="favorites" />
                  </ProtectedRoute>
                } 
              />
              


            </Routes>
      </main>
      {showBottomNav && <MobileAppNavigation />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
        <NotificationProvider>
          <PhoneNumberChecker>
            <Router>
              <ScrollToTop />
              <AppContent />
            </Router>
          </PhoneNumberChecker>
        </NotificationProvider>
      </AuthProvider>
  );
}

export default App;
