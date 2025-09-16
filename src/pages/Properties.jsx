import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Grid, List, ChevronLeft, ChevronRight, Navigation } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import PullToRefresh from '../components/PullToRefresh';
import { getProperties, searchProperties, getUserProperties, searchPropertiesNearZipCode } from '../services/propertyService';
import { getCurrentLocation, getCurrentLocationWithName, sortPropertiesByDistance } from '../utils/locationUtils';
import { getUserProfile } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Properties = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    listingType: [], // For Rent and For Sale checkboxes
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest'
  });
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const propertiesPerPage = 12;
  
  // Get owner ID and search term from URL parameters
  const ownerId = searchParams.get('owner');
  const urlSearchTerm = searchParams.get('search');

  useEffect(() => {
    // Set search term from URL if present
    if (urlSearchTerm && urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
    }
    
    // Set filters from URL parameters
    const urlType = searchParams.get('type');
    const urlListingType = searchParams.get('listingType');
    const urlMinPrice = searchParams.get('minPrice');
    const urlMaxPrice = searchParams.get('maxPrice');
    const urlSortBy = searchParams.get('sortBy');
    
    if (urlType || urlListingType || urlMinPrice || urlMaxPrice || urlSortBy) {
      setFilters(prev => ({
        ...prev,
        type: urlType || prev.type,
        listingType: urlListingType ? urlListingType.split(',') : prev.listingType,
        minPrice: urlMinPrice || prev.minPrice,
        maxPrice: urlMaxPrice || prev.maxPrice,
        sortBy: urlSortBy || prev.sortBy
      }));
    }
  }, [urlSearchTerm, searchParams]);

  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      
      let response;
      if (ownerId) {
        // Load properties by specific owner
        response = await getUserProperties(ownerId);
      } else {
        // Load all properties with filters - map filter names to service expectations
        const serviceFilters = {
          limit: propertiesPerPage,
          offset: (currentPage - 1) * propertiesPerPage,
          sortBy: filters.sortBy === 'nearest' ? 'newest' : filters.sortBy,
        };
        
        // Map filter names to what the service expects
        if (filters.type) {
          serviceFilters.propertyType = filters.type;
        }
        if (filters.listingType && filters.listingType.length > 0) {
          serviceFilters.listingType = filters.listingType;
        }
        if (filters.minPrice) {
          serviceFilters.minPrice = parseInt(filters.minPrice);
        }
        if (filters.maxPrice) {
          serviceFilters.maxPrice = parseInt(filters.maxPrice);
        }
        
        response = await getProperties(serviceFilters);
      }
      
      if (response.success) {
        let propertiesData = response.data.documents || [];
        
        // If sorting by nearest and user location is available
        if (filters.sortBy === 'nearest' && userLocation) {
          const propertiesWithCoords = propertiesData.filter(p => p.latitude && p.longitude);
          const propertiesWithoutCoords = propertiesData.filter(p => !p.latitude || !p.longitude);
          
          if (propertiesWithCoords.length === 0 && propertiesWithoutCoords.length > 0) {
            addNotification(
              'Properties don\'t have location coordinates yet. Distance sorting is not available.',
              'warning'
            );
            // Reset to default sorting
            setFilters(prev => ({ ...prev, sortBy: 'newest' }));
            propertiesData = propertiesWithoutCoords;
          } else {
            // Sort properties with coordinates by distance
            const sortedWithCoords = sortPropertiesByDistance(
              propertiesWithCoords,
              userLocation.latitude,
              userLocation.longitude
            );
            
            // Combine sorted properties with coordinates first, then those without
            propertiesData = [...sortedWithCoords, ...propertiesWithoutCoords];
            
            if (propertiesWithoutCoords.length > 0) {
              addNotification(
                `Showing ${propertiesWithCoords.length} properties by distance. ${propertiesWithoutCoords.length} properties don\'t have location data.`,
                'info'
              );
            }
          }
        }
        
        setProperties(propertiesData);
      } else {
        console.error('Error loading properties:', response.error);
        setProperties([]);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, currentPage, filters, userLocation, propertiesPerPage]);

  const handleSearchInternal = useCallback(async () => {
    if (!searchTerm.trim()) {
      loadProperties();
      return;
    }
    
    try {
      setLoading(true);
      // Pass user location for proximity-based ranking only if user clicked "Near me"
      const response = await searchProperties(searchTerm, filters.sortBy === 'nearest' ? userLocation : null);
      if (response.success) {
        let searchResults = response.data.documents || [];
        
        // Apply filters to search results
        if (filters.type) {
          searchResults = searchResults.filter(property => property.propertyType === filters.type);
        }
        if (filters.listingType && filters.listingType.length > 0) {
          searchResults = searchResults.filter(property => {
            return filters.listingType.includes(property.listingType);
          });
        }
        if (filters.minPrice) {
          searchResults = searchResults.filter(property => {
            const price = property.price || 0;
            return price >= parseInt(filters.minPrice);
          });
        }
        if (filters.maxPrice) {
          searchResults = searchResults.filter(property => {
            const price = property.price || 0;
            return price <= parseInt(filters.maxPrice);
          });
        }
        
        setProperties(searchResults);
      } else {
        console.error('Error searching properties:', response.error);
        setProperties([]);
      }
      setCurrentPage(1);
    } catch (error) {
      console.error('Error searching properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, userLocation, loadProperties]);

  useEffect(() => {
    // Perform search if there's a search term, otherwise load all properties
    if (searchTerm.trim()) {
      handleSearchInternal();
    } else {
      loadProperties();
    }
  }, [currentPage, filters, ownerId, searchTerm, handleSearchInternal, loadProperties]);

  useEffect(() => {
    if (ownerId) {
      loadOwnerProfile();
    } else {
      setOwnerProfile(null);
    }
  }, [ownerId]);

  const loadOwnerProfile = async () => {
    if (!ownerId) return;
    
    try {
      setOwnerLoading(true);
      const profile = await getUserProfile(ownerId);
      setOwnerProfile(profile);
    } catch (error) {
      console.error('Error loading owner profile:', error);
      setOwnerProfile(null);
    } finally {
      setOwnerLoading(false);
    }
  };

  const handleNearYou = async () => {
    try {
      setLocationLoading(true);
      
      // Prompt user for their zip code
      const userZipCode = prompt('Enter your zip code to find nearby properties:');
      
      if (!userZipCode) {
        addNotification('Zip code is required to find nearby properties.', 'error');
        return;
      }
      
      // Validate zip code format (basic validation)
      const zipCodePattern = /^\d{5}(-\d{4})?$/;
      if (!zipCodePattern.test(userZipCode.trim())) {
        addNotification('Please enter a valid 5-digit zip code.', 'error');
        return;
      }
      
      // Search for properties near the zip code
      const result = await searchPropertiesNearZipCode(userZipCode.trim());
      
      if (result.success) {
        setProperties(result.data.documents);
        setTotalPages(1); // Reset pagination for zip code search
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, sortBy: 'zipcode' }));
        
        addNotification(`Found ${result.data.documents.length} properties near zip code ${userZipCode}. Results sorted by proximity.`, 'success');
      } else {
        throw new Error(result.error || 'Failed to search properties by zip code');
      }
      
    } catch (error) {
      console.error('Zip code search error:', error);
      addNotification('Unable to search properties by zip code. Please try again.', 'error');
      
      // Reset to default sorting if search fails
      setFilters(prev => ({ ...prev, sortBy: 'newest' }));
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    // Update URL with search parameter
    const newSearchParams = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      newSearchParams.set('search', searchTerm.trim());
    } else {
      newSearchParams.delete('search');
    }
    navigate(`${window.location.pathname}?${newSearchParams.toString()}`, { replace: true });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      listingType: [],
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest'
    });
    setSearchTerm('');
    setCurrentPage(1);
    // Clear search parameter from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('search');
    window.history.replaceState({}, '', `${window.location.pathname}?${newSearchParams.toString()}`);
  };

  const totalPages = Math.ceil(properties.length / propertiesPerPage);
  const startIndex = (currentPage - 1) * propertiesPerPage;
  const endIndex = startIndex + propertiesPerPage;
  const currentProperties = properties.slice(startIndex, endIndex);

  // Refresh function for pull-to-refresh
  const handleRefresh = async () => {
    // Reset to first page and reload data
    setCurrentPage(1);
    
    if (searchTerm.trim()) {
      await handleSearchInternal();
    } else {
      await loadProperties();
    }
    
    // Reload owner profile if viewing owner's properties
    if (ownerId) {
      await loadOwnerProfile();
    }
    
    // Refresh notifications if user is logged in
    if (user) {
      refreshNotifications();
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                {ownerId && ownerProfile ? (
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Properties by {ownerProfile.firstName} {ownerProfile.lastName}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {properties.length} {properties.length === 1 ? 'property' : 'properties'} available
                    </p>
                  </div>
                ) : ownerId && ownerLoading ? (
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Properties</h1>
                    <p className="text-gray-600 mt-1">Loading owner information...</p>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Properties</h1>
                    <p className="text-gray-600 mt-1">Find your perfect property</p>
                  </div>
                )}
              </div>
              
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by property name, location, city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                  />
                  {searchTerm && userLocation && filters.sortBy === 'nearest' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        📍 Sorted by proximity
                      </span>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Property Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Type
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="input"
                    >
                      <option value="">All Types</option>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="condo">Condo</option>
                      <option value="studio">Studio</option>
                    </select>
                  </div>

                  {/* Listing Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Listing Type
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.listingType.includes('rent')}
                          onChange={(e) => {
                            const newListingType = e.target.checked
                              ? [...filters.listingType, 'rent']
                              : filters.listingType.filter(type => type !== 'rent');
                            handleFilterChange('listingType', newListingType);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">For Rent</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.listingType.includes('sale')}
                          onChange={(e) => {
                            const newListingType = e.target.checked
                              ? [...filters.listingType, 'sale']
                              : filters.listingType.filter(type => type !== 'sale');
                            handleFilterChange('listingType', newListingType);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">For Sale</span>
                      </label>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Min Price"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        className="input"
                        min="0"
                      />
                      <input
                        type="number"
                        placeholder="Max Price"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        className="input"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Near You */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zip Code Search
                    </label>
                    <button
                      onClick={handleNearYou}
                      disabled={locationLoading}
                      className={`w-full btn-secondary flex items-center justify-center gap-2 ${
                        filters.sortBy === 'zipcode' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''
                      }`}
                    >
                      <Navigation className="w-4 h-4" />
                      {locationLoading ? 'Searching...' : 'Near You'}
                    </button>
                    {filters.sortBy === 'zipcode' && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Showing properties sorted by zip code proximity
                      </p>
                    )}
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="input"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      {userLocation && <option value="nearest">Nearest to Me</option>}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden btn-secondary flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                  <p className="text-gray-600">
                    {properties.length} properties found
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Properties Grid/List */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : currentProperties.length > 0 ? (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-6'}>
                  {currentProperties.map((property) => (
                    <PropertyCard
                      key={property.$id}
                      property={property}
                      viewMode={viewMode}
                      distance={filters.sortBy === 'nearest' && userLocation ? property.distance : null}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
};

export default Properties;