import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Users, Bed, Bath, Square, Heart, Eye, LogIn, User, Search, MapPin } from 'lucide-react';
import { getFeaturedProperties, propertyService } from '../services/propertyService';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import PropertyCard from '../components/PropertyCard';
import PullToRefresh from '../components/PullToRefresh';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);


  const [statistics, setStatistics] = useState({
    totalProperties: 0,
    totalUsers: 0,
    totalCities: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStatistics = async () => {
    try {
      const response = await analyticsService.getAllStatistics();
      
      if (response.success) {
        setStatistics({
          totalProperties: response.data.totalProperties,
          totalUsers: response.data.totalUsers,
          totalCities: response.data.totalCities
        });
      } else {
        console.error('Error loading statistics:', response.error);
        // Set fallback values
        setStatistics({
          totalProperties: 0,
          totalUsers: 0,
          totalCities: 0
        });
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Set fallback values
      setStatistics({
        totalProperties: 0,
        totalUsers: 0,
        totalCities: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadFeaturedProperties();
    loadStatistics();
  }, []);

  const loadFeaturedProperties = async () => {
    try {
      setLoading(true);
      const response = await getFeaturedProperties();
      if (response.success) {
        setFeaturedProperties(response.data.documents || []);
      } else {
        console.error('Error loading featured properties:', response.error);
        setFeaturedProperties([]);
      }
    } catch (error) {
      console.error('Error loading featured properties:', error);
      setFeaturedProperties([]);
    } finally {
      setLoading(false);
    }
  };



  const getImageUrl = (imageId) => {
    if (!imageId) return '/api/placeholder/400/250';
    return propertyService.getImageUrl(imageId);
  };

  const handleFavoriteToggle = async (propertyId, isFavorited) => {
    // Refresh the featured properties to update favorite status
    try {
      const response = await getFeaturedProperties();
      if (response.success) {
        setFeaturedProperties(response.data.documents || []);
      }
    } catch (error) {
      console.error('Error refreshing featured properties:', error);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      loadFeaturedProperties(),
      loadStatistics()
    ]);
    
    // Refresh notifications if user is logged in
    if (user) {
      refreshNotifications();
    }
  };



  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white overflow-hidden min-h-[60vh] flex items-center" style={{backgroundImage: 'url(/assets/hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', animation: 'heroZoom 20s ease-in-out infinite alternate', transform: 'translateZ(0)'}}>
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30 animate-pulse"></div>
        <div className="relative w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              Find Your Perfect Property
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-10 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Discover amazing properties in your desired location
            </p>
            
            {/* Action Buttons */}
            <div className="max-w-2xl mx-auto px-4">
              <div className="flex flex-col gap-4 justify-center items-stretch">
                <button
                  onClick={() => navigate('/properties')}
                  className="app-button w-full"
                >
                  <Search className="w-5 h-5 mr-3" />
                  Find Your Dream Home
                </button>
                
                {user ? (
                  <div className="flex items-center justify-center text-white/90">
                    <User className="w-5 h-5 mr-3" />
                    <span className="text-base font-medium truncate">
                      Hey, {user.name || user.email.split('@')[0]}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="app-button-secondary w-full"
                  >
                    <LogIn className="w-5 h-5 mr-3" />
                    Sign In to Continue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="px-4">
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full mb-2">
                <HomeIcon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-300 h-6 w-12 mx-auto rounded"></div>
                ) : (
                  `${(statistics.totalProperties || 0).toLocaleString()}`
                )}
              </div>
              <div className="text-sm text-gray-600 font-medium">Properties</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-green-500 rounded-full mb-2">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-300 h-6 w-12 mx-auto rounded"></div>
                ) : (
                  `${(statistics.totalUsers || 0).toLocaleString()}`
                )}
              </div>
              <div className="text-sm text-gray-600 font-medium">Users</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-500 rounded-full mb-2">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-300 h-6 w-12 mx-auto rounded"></div>
                ) : (
                  `${(statistics.totalCities || 0).toLocaleString()}`
                )}
              </div>
              <div className="text-sm text-gray-600 font-medium">Cities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-6">
        <div className="px-4">
          <div className="text-left mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Featured Properties
            </h2>
            <p className="text-gray-600 mt-2">
              Handpicked premium properties
            </p>
          </div>



          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="card animate-pulse">
                  <div className="h-48 bg-gray-300 rounded-t-xl"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.$id} property={property} onFavoriteToggle={handleFavoriteToggle} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No featured properties available at the moment.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/properties')}
              className="btn-primary"
            >
              View All Properties
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Find your perfect property in three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Search</h3>
              <p className="text-gray-600">
                Use our advanced search filters to find properties that match your criteria
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <Eye className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Explore</h3>
              <p className="text-gray-600">
                View detailed property information, photos, and virtual tours
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Connect</h3>
              <p className="text-gray-600">
                Contact property managers directly and schedule viewings
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Find Your Dream Home?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of satisfied customers who found their perfect property with us
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/properties')}
              className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Browse Properties
            </button>
            <button
              onClick={() => {
                if (user) {
                  navigate('/dashboard');
                } else {
                  navigate('/register');
                }
              }}
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>
      </div>
    </PullToRefresh>
  );
};

export default Home;