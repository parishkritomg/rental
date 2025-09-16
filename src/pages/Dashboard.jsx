import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { propertyService } from '../services/propertyService';
import { analyticsService } from '../services/analyticsService';
import PropertyCard from '../components/PropertyCard';
import PullToRefresh from '../components/PullToRefresh';
import { Home, Heart, BarChart3, Plus, Eye, TrendingUp, Grid3X3 } from 'lucide-react';

const Dashboard = ({ defaultTab }) => {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [userProperties, setUserProperties] = useState([]);
  const [favoriteProperties, setFavoriteProperties] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalFavorites: 0,
    totalProperties: 0
  });
  const [loading, setLoading] = useState({
    properties: false,
    favorites: false,
    analytics: false
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  // Set initial tab based on props or location state
  useEffect(() => {
    const stateTab = location.state?.defaultTab;
    const initialTab = stateTab || defaultTab || 'overview';
    setActiveTab(initialTab);
  }, [defaultTab, location.state]);

  // Load user properties
  const loadUserProperties = async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, properties: true }));
    try {
      const response = await propertyService.getUserProperties(user.$id);
      if (response.success) {
        setUserProperties(response.data.documents || []);
      }
    } catch (error) {
      console.error('Error loading user properties:', error);
    } finally {
      setLoading(prev => ({ ...prev, properties: false }));
    }
  };

  // Load user favorites
  const loadUserFavorites = async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, favorites: true }));
    try {
      const response = await propertyService.getUserFavorites(user.$id);
      if (response.success) {
        setFavoriteProperties(response.data.documents || []);
      }
    } catch (error) {
      console.error('Error loading user favorites:', error);
    } finally {
      setLoading(prev => ({ ...prev, favorites: false }));
    }
  };

  // Load analytics data
  const loadAnalytics = async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, analytics: true }));
    try {
      const viewsResponse = await analyticsService.getUserPropertiesViews(user.$id);
      
      setAnalytics({
        totalViews: viewsResponse.success ? viewsResponse.totalViews : 0,
        totalFavorites: favoriteProperties.length,
        totalProperties: userProperties.length
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }));
    }
  };

  useEffect(() => {
    if (user) {
      loadUserProperties();
      loadUserFavorites();
    }
  }, [user]);

  useEffect(() => {
    if (user && userProperties.length >= 0) {
      loadAnalytics();
    }
  }, [user, userProperties, favoriteProperties]);

  // Refresh function for pull-to-refresh
  const handleRefresh = async () => {
    if (!user) return;
    
    // Reload all dashboard data including notifications
    await Promise.all([
      loadUserProperties(),
      loadUserFavorites()
    ]);
    
    // Refresh notifications
    refreshNotifications();
    
    // Analytics will be reloaded automatically via useEffect
  };

  const handleFavoriteToggle = (propertyId, isFavorited) => {
    if (!isFavorited) {
      // Remove from favorites list
      setFavoriteProperties(prev => prev.filter(prop => prop.$id !== propertyId));
    }
  };

  const handleEdit = (property) => {
    // Navigate to edit property page
    navigate(`/property/edit/${property.$id}`);
  };

  const handleDelete = (property) => {
    // Show confirmation modal
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;
    
    try {
      const result = await propertyService.deleteProperty(propertyToDelete.$id);
      if (result.success) {
        // Remove property from local state
        setUserProperties(prev => 
          prev.filter(property => property.$id !== propertyToDelete.$id)
        );
        // Update analytics
        setAnalytics(prev => ({
          ...prev,
          totalProperties: prev.totalProperties - 1
        }));
        console.log('Property deleted successfully');
      } else {
        console.error('Failed to delete property:', result.error);
        alert('Failed to delete property. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('An error occurred while deleting the property.');
    } finally {
      setShowDeleteModal(false);
      setPropertyToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPropertyToDelete(null);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Grid3X3 },
    { id: 'properties', label: 'My Properties', icon: Home },
    { id: 'favorites', label: 'Favorites', icon: Heart }
  ];

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.name || user.email}!</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard Overview</h2>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  {loading.properties ? (
                        <div className="flex items-center justify-center w-16 h-8">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <span className="text-3xl font-bold text-gray-900">{userProperties.length}</span>
                      )}
                </div>
                <Home className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  {loading.analytics ? (
                        <div className="flex items-center justify-center w-16 h-8">
                          <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <span className="text-3xl font-bold text-gray-900">{analytics.totalViews}</span>
                      )}
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Favorites</p>
                  {loading.analytics ? (
                        <div className="flex items-center justify-center w-16 h-8">
                          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <span className="text-3xl font-bold text-gray-900">{analytics.totalFavorites}</span>
                      )}
                </div>
                <Heart className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/property/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add New Property
              </button>
              <button
                onClick={() => setActiveTab('properties')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Manage Properties
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Heart className="w-5 h-5" />
                View Favorites
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            {userProperties.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">You have {userProperties.length} active {userProperties.length === 1 ? 'property' : 'properties'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Total views across all properties: {analytics.totalViews}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Total favorites saved: {analytics.totalFavorites}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Grid3X3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No activity yet. Start by adding your first property!</p>
                <button
                  onClick={() => navigate('/property/new')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Property
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'properties' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">My Properties</h2>
            <button
              onClick={() => navigate('/property/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Property
            </button>
          </div>
          
          {loading.properties ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : userProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userProperties.map((property) => (
                <PropertyCard
                  key={property.$id}
                  property={property}
                  showActions={true}
                  onEdit={() => handleEdit(property)}
                  onDelete={() => handleDelete(property)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
              <p className="text-gray-600 mb-6">Start by adding your first property to the platform.</p>
              <button
                onClick={() => navigate('/property/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Your First Property
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Favorite Properties</h2>
          
          {loading.favorites ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : favoriteProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteProperties.map((property) => (
                <PropertyCard
                  key={property.$id}
                  property={property}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
              <p className="text-gray-600 mb-6">Browse properties and save your favorites here.</p>
              <a
                href="/properties"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Browse Properties
              </a>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
               Are you sure you want to delete "{propertyToDelete?.title}"? 
               <span className="block mt-2 font-medium text-red-600">
                 This action cannot be undone and people will not be able to view your property anymore.
               </span>
             </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </PullToRefresh>
  );
};

export default Dashboard;