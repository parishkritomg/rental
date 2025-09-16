import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Heart, User, LogOut, Menu, X, Plus, Grid3X3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const NavLink = ({ to, children, icon: Icon, onClick }) => (
    <Link
      to={to}
      onClick={onClick || closeMobileMenu}
      className={`flex items-center space-x-3 px-4 py-3 text-base font-medium transition-all duration-200 rounded-xl touch-manipulation ${
        isActive(to) 
          ? 'text-blue-600 bg-blue-50 shadow-sm' 
          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50 active:bg-gray-100'
      }`}
    >
      {Icon && <Icon className="h-5 w-5" />}
      <span>{children}</span>
    </Link>
  );

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 safe-area-top">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-16 md:h-18">
            {/* Logo */}
            <div 
              className="flex items-center cursor-pointer touch-manipulation" 
              onClick={(e) => {
                e.preventDefault();
                closeMobileMenu();
                if (location.pathname === '/') {
                  window.location.reload();
                } else {
                  navigate('/');
                }
              }}
            >
              <img src="/assets/logo of Zentro.png" alt="Zentro" className="h-8 md:h-10 w-auto" />
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors duration-200 px-3 py-2 rounded-md ${
                  isActive('/') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Home
              </Link>
              <Link
                to="/properties"
                className={`text-sm font-medium transition-colors duration-200 px-3 py-2 rounded-md ${
                  isActive('/properties') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Properties
              </Link>
              {user && (
                <>
                  <Link
                    to="/dashboard"
                    className={`text-sm font-medium transition-colors duration-200 px-3 py-2 rounded-md ${
                      isActive('/dashboard') 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    Dashboard
                  </Link>

                </>
              )}
            </div>

            {/* Desktop User Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <NotificationDropdown />
                  <Link
                    to="/favorites"
                    className="btn-touch p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 rounded-md"
                    title="Favorites"
                  >
                    <Heart className="h-5 w-5" />
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors duration-200"
                    title="Profile"
                  >
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700 max-w-24 truncate">{user.name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn-touch p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 rounded-md"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 px-3 py-2 rounded-md"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary text-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile actions */}
            <div className="md:hidden flex items-center space-x-1">
              {user && (
                <>
                  <Link
                    to="/favorites"
                    className="btn-touch p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 rounded-lg"
                    title="Favorites"
                  >
                    <Heart className="h-5 w-5" />
                  </Link>
                </>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="btn-touch p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-200"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden" 
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile menu */}
      <div className={`mobile-menu md:hidden z-40 ${
        isMobileMenuOpen ? 'open' : 'closed'
      }`}>
        <div className="safe-area-top">
          <div className="px-6 pt-8 pb-6">
            {/* Mobile menu header */}
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center space-x-3" onClick={closeMobileMenu}>
                <img src="/assets/logo of Zentro.png" alt="Zentro" className="h-10 w-auto" />
              </Link>
              <button
                onClick={closeMobileMenu}
                className="btn-touch p-3 text-gray-400 hover:text-gray-600 rounded-xl transition-all duration-200"
                aria-label="Close mobile menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile navigation links */}
            <div className="space-y-3 mb-8">
              <NavLink to="/" icon={Home}>Home</NavLink>
              <NavLink to="/properties" icon={Search}>Properties</NavLink>
              {user && <NavLink to="/dashboard" icon={Grid3X3}>Dashboard</NavLink>}
              {user && (
                <Link
                  to="/property/new"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-4 py-3 text-base font-medium transition-all duration-200 rounded-xl touch-manipulation bg-blue-50 text-blue-600 hover:bg-blue-100"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Property</span>
                </Link>
              )}
              {user && <NavLink to="/favorites" icon={Heart}>Favorites</NavLink>}
              {user && <NavLink to="/profile" icon={User}>Profile</NavLink>}
            </div>

            {/* Mobile user actions */}
            <div className="border-t border-gray-200 pt-6">
              {user ? (
                <div className="space-y-4">
                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-4 px-4 py-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 touch-manipulation"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-3 px-4 py-4 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 touch-manipulation font-medium"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="text-base">Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="w-full flex items-center justify-center px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-all duration-200 touch-manipulation"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="w-full btn-primary justify-center py-4"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="safe-area-bottom" />
      </div>
    </>
  );
};

export default Navigation;