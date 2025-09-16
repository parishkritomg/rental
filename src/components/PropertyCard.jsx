import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Square, Calendar, Navigation, Edit, Trash2, User, MessageCircle, Eye } from 'lucide-react';
import { propertyService } from '../services/propertyService';
import { userService } from '../services/userService';
import { commentService } from '../services/commentService';
import { useAuth } from '../context/AuthContext';
import { formatDistance, getPlaceNameFromCoordinates } from '../utils/locationUtils';
import { formatPostDate } from '../utils/dateUtils';

const PropertyCard = ({ property, onFavoriteToggle, size = 'normal', distance = null, showActions = false, onEdit, onDelete }) => {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(property.isFavorited || false);
  const [isLoading, setIsLoading] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [recentComments, setRecentComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [placeName, setPlaceName] = useState(null);
  const [placeNameLoading, setPlaceNameLoading] = useState(false);

  // Check if property is favorited when component mounts
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user && property.$id) {
        try {
          const result = await propertyService.isFavorited(user.$id, property.$id);
          if (result.success) {
            setIsFavorited(result.isFavorited);
          }
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };

    checkFavoriteStatus();
  }, [user, property.$id]);

  // Load owner profile when component mounts
  useEffect(() => {
    const loadOwnerProfile = async () => {
      if (property.ownerId) {
        try {
          setOwnerLoading(true);
          const profile = await userService.getUserProfile(property.ownerId);
          setOwnerProfile(profile);
        } catch (error) {
          console.error('Error loading owner profile:', error);
          setOwnerProfile(null);
        } finally {
          setOwnerLoading(false);
        }
      }
    };

    loadOwnerProfile();
  }, [property.ownerId]);

  // Load place name from coordinates if available
  useEffect(() => {
    const loadPlaceName = async () => {
      // Only convert coordinates to place name if:
      // 1. Property has coordinates
      // 2. Property doesn't have a readable address (or address looks like coordinates)
      // 3. We haven't already loaded a place name
      if (property.latitude && property.longitude && !placeName && !placeNameLoading) {
        const addressLooksLikeCoords = /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(property.address?.trim());
        const hasReadableAddress = property.address && !addressLooksLikeCoords && property.address.length > 10;
        
        if (!hasReadableAddress) {
          try {
            setPlaceNameLoading(true);
            const name = await getPlaceNameFromCoordinates(property.latitude, property.longitude);
            setPlaceName(name);
          } catch (error) {
            console.error('Error loading place name:', error);
          } finally {
            setPlaceNameLoading(false);
          }
        }
      }
    };

    loadPlaceName();
  }, [property.latitude, property.longitude, property.address, placeName, placeNameLoading]);

  // Load comments when component mounts (only for dashboard view)
  useEffect(() => {
    const loadComments = async () => {
      if (showActions && property.$id) { // Only load for dashboard cards
        try {
          setCommentsLoading(true);
          const response = await commentService.getPropertyCommentsWithReplies(property.$id);
          if (response.success) {
            setCommentCount(response.data.length);
            setRecentComments(response.data.slice(0, 2)); // Get first 2 comments
          }
        } catch (error) {
          console.error('Error loading comments:', error);
        } finally {
          setCommentsLoading(false);
        }
      }
    };

    loadComments();
  }, [property.$id, showActions]);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // Redirect to login or show login modal
      console.log('User must be logged in to favorite properties');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await propertyService.toggleFavorite(user.$id, property.$id);
      if (result.success) {
        setIsFavorited(result.isFavorited);
        // Call the callback if provided (for parent component updates)
        if (onFavoriteToggle) {
          onFavoriteToggle(property.$id, result.isFavorited);
        }
      } else {
        console.error('Error toggling favorite:', result.error);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getImageUrl = (imageId) => {
    if (!imageId) return '/api/placeholder/400/300';
    return propertyService.getImageUrl(imageId);
  };

  const primaryImage = property.images && property.images.length > 0 
    ? getImageUrl(property.images[0]) 
    : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';

  return (
    <div className={`card group hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] ${
      size === 'small' ? 'max-w-sm w-full' : 
      size === 'square' ? 'aspect-square w-full max-w-xs mx-auto' : ''
    } touch-manipulation`}>
      <div className="relative">
        {/* Favorite Button - Outside Link */}
        <button
          onClick={handleFavoriteClick}
          disabled={isLoading}
          className="absolute top-4 right-4 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group/heart z-10 backdrop-blur-sm hover:scale-110 active:scale-95 touch-manipulation"
        >
          <Heart 
            className={`h-5 w-5 transition-colors duration-200 ${
              isFavorited 
                ? 'text-red-500 fill-current' 
                : 'text-gray-400 group-hover/heart:text-red-500'
            }`}
          />
        </button>
        
        <Link to={`/property/${property.$id}`} className="block">
        {/* Image Container */}
        <div className={`relative overflow-hidden rounded-t-xl ${
          size === 'small' ? 'h-44' : 
          size === 'square' ? 'h-36' : 'h-52'
        }`}>
          <img
            src={primaryImage}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
            }}
          />
          
          {/* Listing Type Badge */}
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-md backdrop-blur-sm ${
              property.listingType === 'sale' 
                ? 'bg-green-500/90 text-white' 
                : 'bg-blue-500/90 text-white'
            }`}>
              {property.listingType === 'sale' ? 'FOR SALE' : 'FOR RENT'}
            </span>
          </div>
          
          {/* Status Badge */}
          {property.status !== 'available' && (
            <div className="absolute top-4 left-24">
              <span className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-md backdrop-blur-sm ${
                property.status === 'rented' 
                  ? 'bg-red-500/90 text-white' 
                  : property.status === 'pending'
                  ? 'bg-yellow-500/90 text-white'
                  : 'bg-gray-500/90 text-white'
              }`}>
                {property.status === 'rented' 
                  ? (property.listingType === 'sale' ? 'SOLD' : 'RENTED')
                  : property.status.toUpperCase()
                }
              </span>
            </div>
          )}

          {/* Featured Badge */}
          {property.featured && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-yellow-400 text-yellow-900 shadow-md backdrop-blur-sm animate-pulse">
                ⭐ FEATURED
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`${
          size === 'small' ? 'p-4' : 
          size === 'square' ? 'p-3' : 'p-5'
        }`}>
          {/* Price */}
          <div className={`flex items-center justify-between ${
            size === 'small' ? 'mb-2' : 
            size === 'square' ? 'mb-2' : 'mb-3'
          }`}>
            <h3 className={`font-bold text-gray-900 ${
              size === 'small' ? 'text-xl' : 
              size === 'square' ? 'text-lg' : 'text-2xl'
            }`}>
              {formatPrice(property.price)}
              {property.listingType === 'rent' && (
                <span className="text-base font-medium text-gray-500 ml-1">/mo</span>
              )}
            </h3>
          </div>

          {/* Title */}
          <h4 className={`font-semibold text-gray-800 line-clamp-2 leading-tight ${
            size === 'small' ? 'text-lg mb-2' : 
            size === 'square' ? 'text-base mb-2' : 'text-xl mb-3'
          }`}>
            {property.title}
          </h4>

          {/* Location */}
          <div className={`flex items-start justify-between text-gray-600 ${
            size === 'small' ? 'mb-3' : 
            size === 'square' ? 'mb-2' : 'mb-4'
          }`}>
            <div className="flex items-start flex-1 min-w-0">
              <MapPin className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-gray-400" />
              <span className="text-sm line-clamp-2 leading-relaxed">
                {placeNameLoading ? (
                  'Loading location...'
                ) : (
                  placeName || property.address || 'Location not specified'
                )}
              </span>
            </div>
            {distance !== null && (
              <div className="flex items-center ml-3 text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <Navigation className="h-3 w-3 mr-1" />
                <span className="text-xs font-semibold">{formatDistance(distance)}</span>
              </div>
            )}
          </div>

          {/* Owner */}
          <div className={`flex items-center text-gray-600 ${
            size === 'small' ? 'mb-2' : 
            size === 'square' ? 'mb-2' : 'mb-3'
          }`}>
            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
              <User className="h-3 w-3 text-gray-500" />
            </div>
            {ownerLoading ? (
              <span className="text-sm text-gray-400">Loading owner...</span>
            ) : ownerProfile ? (
              <span className="text-sm font-medium">
                {ownerProfile.firstName} {ownerProfile.lastName}
              </span>
            ) : (
              <span className="text-sm text-gray-400">Owner information unavailable</span>
            )}
          </div>

          {/* Posted Date */}
          <div className={`flex items-center text-gray-500 ${
            size === 'small' ? 'mb-3' : 
            size === 'square' ? 'mb-2' : 'mb-4'
          }`}>
            <Calendar className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">
              Posted {formatPostDate(property.$createdAt || property.createdAt)}
            </span>
          </div>

          {/* Property Details */}
          <div className={`flex items-center justify-between text-sm text-gray-600 ${
            size === 'small' ? 'mb-3' : 
            size === 'square' ? 'mb-2' : 'mb-4'
          }`}>
            <div className={`flex items-center ${
              size === 'small' ? 'space-x-3' : 
              size === 'square' ? 'space-x-2' : 'space-x-5'
            }`}>
              <div className="flex items-center bg-gray-50 px-2 py-1 rounded-lg">
                <Bed className={`mr-1.5 text-gray-500 ${
                  size === 'square' ? 'h-3 w-3' : 'h-4 w-4'
                }`} />
                <span className={`font-medium ${size === 'square' ? 'text-xs' : ''}`}>{property.bedrooms}</span>
              </div>
              <div className="flex items-center bg-gray-50 px-2 py-1 rounded-lg">
                <Bath className={`mr-1.5 text-gray-500 ${
                  size === 'square' ? 'h-3 w-3' : 'h-4 w-4'
                }`} />
                <span className={`font-medium ${size === 'square' ? 'text-xs' : ''}`}>{property.bathrooms}</span>
              </div>
              {size !== 'small' && size !== 'square' && (
                <div className="flex items-center bg-gray-50 px-2 py-1 rounded-lg">
                  <Square className="h-4 w-4 mr-1.5 text-gray-500" />
                  <span className="font-medium">{property.area?.toLocaleString()}</span>
                </div>
              )}
            </div>
            {showActions && (
              <div className="flex items-center text-purple-600">
                <Eye className={`mr-1 ${
                  size === 'square' ? 'h-3 w-3' : 'h-4 w-4'
                }`} />
                <span className={`font-medium ${
                  size === 'square' ? 'text-xs' : ''
                }`}>
                  {property.views || 0} views
                  {!property.views && property.views !== 0 && (
                    <span className="text-xs text-gray-400 ml-1">(setup needed)</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Property Type and Year */}
          {size !== 'small' && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="capitalize">{property.propertyType}</span>
              {property.yearBuilt && (
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>Built {property.yearBuilt}</span>
                </div>
              )}
            </div>
          )}

          {/* Description Preview */}
          {size !== 'small' && property.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {property.description}
            </p>
          )}

          {/* Comments Section */}
          {showActions && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {commentsLoading ? 'Loading...' : `${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
                </span>
              </div>
              {recentComments.length > 0 && (
                <div className="space-y-1 mb-2">
                  {recentComments.map((comment) => (
                    <div key={comment.$id} className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                      <span className="font-medium">{comment.userName}:</span>
                      <span className="ml-1 line-clamp-1">{comment.content}</span>
                    </div>
                  ))}
                  {commentCount > 2 && (
                    <div className="text-xs text-blue-600">
                      +{commentCount - 2} more comment{commentCount - 2 !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </Link>
      
      {/* Action Buttons */}
      {showActions && (
        <div className={`flex items-center justify-between border-t border-gray-100 ${
          size === 'square' ? 'mt-1 pt-1 px-2 pb-2' : 'mt-3 pt-3 px-3 pb-3'
        }`}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit && onEdit();
            }}
            className={`flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200 ${
              size === 'square' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
            }`}
          >
            <Edit className={size === 'square' ? 'w-3 h-3' : 'w-4 h-4'} />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete && onDelete();
            }}
            className={`flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200 ${
              size === 'square' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
            }`}
          >
            <Trash2 className={size === 'square' ? 'w-3 h-3' : 'w-4 h-4'} />
            Delete
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

export default PropertyCard;