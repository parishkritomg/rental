import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Share2, MapPin, Bed, Bath, Square, Calendar, Phone, ChevronLeft, ChevronRight, Mail, ZoomIn, ZoomOut, X, Copy, Check, User, Settings, Lock, MessageCircle, Eye } from 'lucide-react';
import { getProperty, propertyService, updatePropertyStatus } from '../services/propertyService';
import { analyticsService } from '../services/analyticsService';
import { getUserProfile, userService } from '../services/userService';
import { commentService } from '../services/commentService';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { formatPostDate } from '../utils/dateUtils';
import PropertyCard from '../components/PropertyCard';
import Comment from '../components/Comment';
import CommentForm from '../components/CommentForm';
import PullToRefresh from '../components/PullToRefresh';


const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [otherProperties, setOtherProperties] = useState([]);
  const [otherPropertiesLoading, setOtherPropertiesLoading] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [isScrollingToComment, setIsScrollingToComment] = useState(false);

  // Function to scroll to a specific comment
  const scrollToComment = (commentId) => {
    const commentElement = document.getElementById(`comment-${commentId}`);
    if (commentElement) {
      commentElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      // Add a highlight effect
      commentElement.classList.add('bg-yellow-100');
      setTimeout(() => {
        commentElement.classList.remove('bg-yellow-100');
      }, 3000);
    }
  };
  
  // Check if current user is the property owner
  const isOwner = user && property && property.ownerId === user.$id;

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Copy to clipboard functionality
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'phone') {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      } else if (type === 'email') {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };




  const handleFavoriteToggle = async () => {
    if (!user) {
      // Redirect to login with current location for redirect back
      navigate('/login', { state: { from: location } });
      return;
    }

    setFavoriteLoading(true);
    try {
      const result = await propertyService.toggleFavorite(user.$id, id);
      if (result.success) {
        setIsFavorite(result.isFavorited);
      } else {
        console.error('Error toggling favorite:', result.error);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  console.log('PropertyDetail component rendered with ID:', id);

  // Add timeout for loading state to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setError('Request timed out. Please try again.');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    loadProperty();
  }, [id]);

  // Refresh function for pull-to-refresh
  const handleRefresh = async () => {
    // Reload all property data
    await loadProperty();
    // Note: loadProperty already calls loadOwnerProfile, loadOtherProperties, and loadComments
    
    // Refresh notifications if user is logged in
    if (user) {
      refreshNotifications();
    }
  };

  // Keyboard navigation for modal
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          closeModal();
          break;
        case 'ArrowLeft':
          if (property?.images && property.images.length > 1) {
            prevImage();
          }
          break;
        case 'ArrowRight':
          if (property?.images && property.images.length > 1) {
            nextImage();
          }
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, property?.images]);

  const loadOtherProperties = async () => {
    try {
      setOtherPropertiesLoading(true);
      const response = await propertyService.getFeaturedProperties(6);
      if (response && response.success) {
        // Filter out the current property from the list
        const filteredProperties = response.data.documents.filter(prop => prop.$id !== id);
        setOtherProperties(filteredProperties.slice(0, 5)); // Show only 5 other properties
      }
    } catch (error) {
      console.error('Error loading other properties:', error);
    } finally {
      setOtherPropertiesLoading(false);
    }
  };

  const loadOwnerProfile = async (ownerId) => {
    try {
      setOwnerLoading(true);
      console.log('Loading owner profile for ownerId:', ownerId);
      const profile = await getUserProfile(ownerId);
      console.log('Owner profile loaded:', profile);
      if (profile && profile.avatar) {
        console.log('Owner has avatar:', profile.avatar);
      } else {
        console.log('Owner has no avatar or profile is null');
      }
      setOwnerProfile(profile);
    } catch (error) {
      console.error('Error loading owner profile:', error);
      setOwnerProfile(null);
    } finally {
      setOwnerLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      setCommentsError(null);
      const response = await commentService.getPropertyCommentsWithReplies(id);
      if (response.success) {
        setComments(response.data);
      } else {
        setCommentsError(response.error);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      setCommentsError('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  // Handle scrolling to specific comment from URL parameter or hash
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const commentId = searchParams.get('commentId');
    const hash = location.hash;
    
    if (commentId && comments.length > 0 && !commentsLoading) {
      // Show "Taking you to comments" animation
      setIsScrollingToComment(true);
      
      // Wait for animation, then scroll to comment
      setTimeout(() => {
        scrollToComment(commentId);
        setIsScrollingToComment(false);
      }, 2000); // Show animation for 2 seconds
    } else if (hash === '#comments' && comments.length > 0 && !commentsLoading) {
      // Show "Taking you to comments" animation
      setIsScrollingToComment(true);
      
      // Wait for animation, then scroll to comments section
      setTimeout(() => {
        const commentsSection = document.getElementById('comments-section');
        if (commentsSection) {
          commentsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
        setIsScrollingToComment(false);
      }, 2000); // Show animation for 2 seconds
    }
  }, [comments, commentsLoading, location.search, location.hash]);

  const handleCommentSubmit = (newComment) => {
    setComments(prevComments => [newComment, ...prevComments]);
  };

  const handleReplySubmit = (newReply) => {
    setComments(prevComments => 
      prevComments.map(comment => {
        if (comment.$id === newReply.parentCommentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply]
          };
        }
        return comment;
      })
    );
  };

  const handleCommentEdit = (commentId, newContent) => {
    setComments(prevComments => 
      prevComments.map(comment => {
        if (comment.$id === commentId) {
          return { ...comment, content: newContent, updatedAt: new Date().toISOString() };
        }
        // Check replies
        if (comment.replies) {
          const updatedReplies = comment.replies.map(reply => 
            reply.$id === commentId 
              ? { ...reply, content: newContent, updatedAt: new Date().toISOString() }
              : reply
          );
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      })
    );
  };

  const handleCommentDelete = (commentId) => {
    setComments(prevComments => {
      // Remove top-level comment
      const filtered = prevComments.filter(comment => comment.$id !== commentId);
      // Remove replies
      return filtered.map(comment => ({
        ...comment,
        replies: comment.replies ? comment.replies.filter(reply => reply.$id !== commentId) : []
      }));
    });
  };

  const loadProperty = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading property with ID:', id);
      
      if (!id) {
        throw new Error('Property ID is missing');
      }

      // Test if we can reach the API at all
      console.log('Testing API connection...');
      
      const response = await getProperty(id);
      console.log('Raw API response:', response);
      
      if (response && response.success) {
        setProperty(response.data);
        console.log('Property loaded successfully:', response.data);
        
        // Property type will be displayed as a badge in the UI
        
        // Check if property is favorited by current user
        if (user) {
          try {
            const favoriteResult = await propertyService.isFavorited(user.$id, id);
            if (favoriteResult.success) {
              setIsFavorite(favoriteResult.isFavorited);
            }
          } catch (favoriteError) {
            console.warn('Failed to check favorite status:', favoriteError);
          }
        }
        
        // Track property view and increment view count
        try {
          // Track view in analytics
          await analyticsService.trackView(id, user?.$id);
          // Increment property view count in real-time
          const viewResult = await propertyService.incrementPropertyViews(id);
          if (!viewResult.success && viewResult.needsSetup) {
            console.warn('View tracking setup needed. Please check APPWRITE_SETUP_VIEWS.md for instructions.');
          }
        } catch (analyticsError) {
          console.warn('Analytics tracking failed:', analyticsError);
        }
        
        // Load owner profile
        if (response.data.ownerId) {
          loadOwnerProfile(response.data.ownerId);
        }
        
        // Load other properties
        loadOtherProperties();
        
        // Load comments
        loadComments();
      } else {
        const errorMsg = response?.error || 'Property not found or API error';
        console.error('API returned error:', errorMsg);
        setError(errorMsg);
        setProperty(null);
      }
    } catch (error) {
      console.error('Exception during property loading:', error);
      setError(`Network error: ${error.message}`);
      setProperty(null);
    } finally {
      setLoading(false);
    }
  };



  const nextImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => 
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  const getImageUrl = (imageId) => {
    if (!imageId) return '/api/placeholder/800/600';
    return propertyService.getImageUrl(imageId);
  };

  const openModal = () => {
    setIsModalOpen(true);
    setZoomLevel(1);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setZoomLevel(1);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
    setCopiedUrl(false);
  };

  const copyPropertyUrl = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out this property: ${property.title}`);
    const body = encodeURIComponent(`I found this amazing property that might interest you:\n\n${property.title}\nLocation: ${property.location}\nPrice: $${property.price?.toLocaleString()}/month\n\nView details: ${window.location.href}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareOnFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`Check out this property: ${property.title} - $${property.price?.toLocaleString()}/month`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`Check out this property: ${property.title}\nLocation: ${property.location}\nPrice: $${property.price?.toLocaleString()}/month\n\n${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Handle property status update (for owners only)
  const handleStatusUpdate = async (newStatus) => {
    if (!isOwner || !property) return;
    
    try {
      setStatusUpdating(true);
      const response = await updatePropertyStatus(property.$id, newStatus);
      
      if (response.success) {
        // Update the local property state
        setProperty(prev => ({ ...prev, status: newStatus }));
        alert(`Property status updated to ${newStatus}`);
      } else {
        alert('Failed to update property status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating property status:', error);
      alert('An error occurred while updating the property status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Property</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button onClick={loadProperty} className="btn-primary">
              Try Again
            </button>
            <button onClick={() => navigate('/properties')} className="btn-secondary">
              Back to Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property not found</h2>
          <p className="text-gray-600 mb-4">The property you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/properties')} className="btn-primary">
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-gray-50 relative">
      {/* Taking you to comments animation overlay */}
      {isScrollingToComment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4 shadow-xl">
            <MessageCircle className="w-12 h-12 text-blue-600" />
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-medium text-gray-900">Taking you to comments</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                property?.listingType === 'rent' 
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {property?.listingType === 'rent' ? 'For Rent' : 'For Sale'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleFavoriteToggle}
                disabled={favoriteLoading}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isFavorite 
                    ? 'text-red-500' 
                    : 'text-gray-400 hover:text-red-500'
                } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button 
                onClick={handleShare}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="Share property"
              >
                <Share2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-responsive py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Carousel */}
            <div className="relative mb-8">
              <div className="relative w-full h-96 rounded-xl overflow-hidden bg-gray-200 cursor-pointer group" onClick={openModal}>
                <img
                  src={property.images?.[currentImageIndex] ? getImageUrl(property.images[currentImageIndex]) : '/api/placeholder/800/600'}
                  alt={property.title}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <ZoomIn className="w-5 h-5" />
                </div>
              </div>
              
              {property.images && property.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {property.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Property Info */}
            <div className="card p-6 mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-5 h-5 mr-2" />
                    {property.location}
                  </div>
                  <div className="flex items-center text-gray-500 mb-4">
                    <Calendar className="w-5 h-5 mr-2" />
                    <span className="text-sm">
                      Posted {formatPostDate(property.$createdAt || property.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    ${property.price?.toLocaleString()}
                    {property.listingType === 'rent' && (
                      <span className="text-lg text-gray-600">/month</span>
                    )}
                  </div>
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    property.status === 'available' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {property.status === 'available' 
                      ? 'Available' 
                      : property.status === 'rented'
                      ? (property.listingType === 'sale' ? 'Sold' : 'Rented')
                      : property.status.charAt(0).toUpperCase() + property.status.slice(1)
                    }
                  </div>
                </div>
              </div>

              {/* Property Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4 border-t border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">{property.bedrooms}</span>
                  <span className="text-gray-600">Bedrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">{property.bathrooms}</span>
                  <span className="text-gray-600">Bathrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Square className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">{property.area}</span>
                  <span className="text-gray-600">sq ft</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">
                    {property.views !== undefined ? property.views.toLocaleString() : '0'}
                    {property.views === undefined && (
                      <span className="text-xs text-gray-400 ml-1">(setup needed)</span>
                    )}
                  </span>
                  <span className="text-gray-600">Views</span>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {property.description || 'No description available.'}
                </p>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Amenities</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-600">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Owner Profile Card */}
            <div className="card p-6 mb-6 relative">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Property Owner</h3>
              
              {!user ? (
                <div className="relative">
                  {/* Blurred content */}
                  <div className="filter blur-sm pointer-events-none">
                    <div className="flex items-center space-x-3 p-3 rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">John Doe</h4>
                        <p className="text-sm text-gray-600">Property Owner</p>
                      </div>
                    </div>
                  </div>
                  {/* Login overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-700 font-medium mb-3">Login to view owner details</p>
                      <button
                        onClick={() => navigate('/login', { state: { from: location } })}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        Login
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {ownerLoading ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                      </div>
                    </div>
                  ) : ownerProfile ? (
                    <div 
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/properties?owner=${property.ownerId}`)}
                      title="View all properties by this owner"
                    >
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {ownerProfile.avatar && ownerProfile.avatar.trim() !== '' ? (
                          <img
                            src={userService.getProfilePhotoUrl(ownerProfile.avatar)}
                            alt={`${ownerProfile.firstName} ${ownerProfile.lastName}`}
                            className="w-full h-full object-cover"
                            onLoad={() => {
                              console.log('Profile photo loaded successfully for:', ownerProfile.avatar);
                            }}
                            onError={(e) => {
                              console.error('Failed to load profile photo. Avatar field:', ownerProfile.avatar);
                              console.error('Generated URL:', userService.getProfilePhotoUrl(ownerProfile.avatar));
                              console.error('Owner profile data:', ownerProfile);
                              e.target.style.display = 'none';
                              const fallbackIcon = e.target.parentNode.querySelector('.fallback-icon');
                              if (fallbackIcon) {
                                fallbackIcon.style.display = 'flex';
                              }
                            }}
                          />
                        ) : (
                          console.log('No valid avatar field in owner profile. Avatar value:', ownerProfile?.avatar, 'Profile:', ownerProfile)
                        )}
                        <User 
                          className={`w-6 h-6 text-gray-400 fallback-icon ${ownerProfile.avatar && ownerProfile.avatar.trim() !== '' ? 'hidden' : 'flex'}`} 
                          style={{ display: ownerProfile.avatar && ownerProfile.avatar.trim() !== '' ? 'none' : 'flex' }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {ownerProfile.firstName} {ownerProfile.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {ownerProfile.isLandlord ? 'Professional Landlord' : 'Property Owner'}
                          {ownerProfile.verified && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Verified
                            </span>
                          )}
                        </p>
                        {ownerProfile.bio && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {ownerProfile.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-4">
                      Owner information not available
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Contact Card */}
            <div className="card p-6 mb-6 relative">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {isOwner ? 'Property Management' : 'Contact Property Manager'}
              </h3>
              
              {isOwner && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Owner Controls</span>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/dashboard', { state: { defaultTab: 'properties' } })}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Go to Dashboard
                    </button>
                    
                    <div className="border-t border-blue-200 pt-3">
                      <p className="text-sm text-blue-800 mb-2 font-medium">Update Property Status:</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleStatusUpdate('available')}
                          disabled={statusUpdating || property.status === 'available'}
                          className={`px-3 py-2 text-xs font-medium rounded transition-colors ${
                            property.status === 'available'
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-white text-green-700 border border-green-300 hover:bg-green-50'
                          } disabled:opacity-50`}
                        >
                          Available
                        </button>
                        <button
                          onClick={() => handleStatusUpdate('rented')}
                          disabled={statusUpdating || property.status === 'rented'}
                          className={`px-3 py-2 text-xs font-medium rounded transition-colors ${
                            property.status === 'rented'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-white text-red-700 border border-red-300 hover:bg-red-50'
                          } disabled:opacity-50`}
                        >
                          {property.listingType === 'sale' ? 'Sold' : 'Rented'}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate('maintenance')}
                          disabled={statusUpdating || property.status === 'maintenance'}
                          className={`px-3 py-2 text-xs font-medium rounded transition-colors ${
                            property.status === 'maintenance'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              : 'bg-white text-yellow-700 border border-yellow-300 hover:bg-yellow-50'
                          } disabled:opacity-50`}
                        >
                          Maintenance
                        </button>
                      </div>
                      {statusUpdating && (
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                          <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          Updating status...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {!user && !isOwner ? (
                <div className="relative">
                  {/* Blurred content */}
                  <div className="filter blur-sm pointer-events-none">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-600">(555) 123-4567</span>
                        </div>
                        <button className="p-2 text-gray-400 rounded-md">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-600">contact@example.com</span>
                        </div>
                        <button className="p-2 text-gray-400 rounded-md">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <button className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                        <Phone className="w-5 h-5" />
                        Call Now
                      </button>
                    </div>
                  </div>
                  {/* Login overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-lg">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-700 font-medium mb-3">Login to view contact details</p>
                      <button
                        onClick={() => navigate('/login', { state: { from: location } })}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        Login
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">
                          {property.contactPhone ? formatPhoneNumber(property.contactPhone) : 'Phone not provided'}
                        </span>
                      </div>
                      {property.contactPhone && (
                        <button
                          onClick={() => copyToClipboard(property.contactPhone, 'phone')}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
                          title="Copy phone number"
                        >
                          {copiedPhone ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">{property.contactEmail || 'Email not provided'}</span>
                      </div>
                      {property.contactEmail && (
                        <button
                          onClick={() => copyToClipboard(property.contactEmail, 'email')}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
                          title="Copy email address"
                        >
                          {copiedEmail ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {!isOwner && (
                    <div className="space-y-3">
                      {property.status === 'available' ? (
                        <button
                          onClick={() => window.open(`tel:${property.contactPhone}`)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:bg-green-600"
                          disabled={!property.contactPhone}
                        >
                          <Phone className="w-5 h-5" />
                          {property.contactPhone ? 'Call Now' : 'Phone Not Available'}
                        </button>
                      ) : (
                        <button
                          className="w-full bg-red-600 text-white font-semibold py-3 px-4 rounded-lg cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                          disabled
                        >
                          <Phone className="w-5 h-5" />
                          {property.status === 'rented' 
                            ? (property.listingType === 'sale' ? 'Sold' : 'Rented')
                            : property.status.charAt(0).toUpperCase() + property.status.slice(1)
                          }
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Property Details */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Property Details</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Type:</span>
                  <span className="font-medium capitalize">{property.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available From:</span>
                  <span className="font-medium">
                    {property.availableFrom ? new Date(property.availableFrom).toLocaleDateString() : 'Immediately'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lease Term:</span>
                  <span className="font-medium">{property.leaseTerm || '12 months'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pet Policy:</span>
                  <span className="font-medium">{property.petFriendly ? 'Pets allowed' : 'No pets'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Parking:</span>
                  <span className="font-medium">{property.parking ? 'Included' : 'Not included'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div id="comments-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Comments {comments.length > 0 && `(${comments.length})`}
            </h2>
          </div>
          
          {/* Comment Form */}
          <div className="mb-4">
            <CommentForm 
              propertyId={id}
              propertyOwnerId={property?.ownerId}
              propertyTitle={property?.title}
              onCommentSubmit={handleCommentSubmit}
            />
          </div>
          
          {/* Comments List */}
          {commentsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/6"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : commentsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 mb-4">{commentsError}</p>
              <button
                onClick={loadComments}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <Comment
                  key={comment.$id}
                  comment={comment}
                  propertyOwnerId={property?.ownerId}
                  onEdit={handleCommentEdit}
                  onDelete={handleCommentDelete}
                  onReplySubmit={handleReplySubmit}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
              <p className="text-gray-600">Be the first to share your thoughts about this property!</p>
            </div>
          )}
        </div>
      </div>

      {/* Other Properties Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Other Properties</h2>
          
          {otherPropertiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : otherProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {otherProperties.map((otherProperty) => (
                <PropertyCard
                  key={otherProperty.$id}
                  property={otherProperty}
                  size="normal"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No other properties available at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full z-10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 flex gap-2 z-10">
              <button
                onClick={zoomOut}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={resetZoom}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-full text-sm font-medium transition-colors"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={zoomIn}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                disabled={zoomLevel >= 3}
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Arrows */}
            {property.images && property.images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full z-10 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full z-10 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image Container */}
            <div className="relative overflow-hidden max-w-full max-h-full">
              <img
                src={property.images?.[currentImageIndex] ? getImageUrl(property.images[currentImageIndex]) : '/api/placeholder/800/600'}
                alt={property.title}
                className="max-w-full max-h-full object-contain transition-transform duration-200 cursor-move"
                style={{ transform: `scale(${zoomLevel})` }}
                draggable={false}
              />
            </div>

            {/* Image Counter */}
            {property.images && property.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {property.images.length}
              </div>
            )}

            {/* Thumbnail Strip */}
            {property.images && property.images.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
                {property.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? 'border-white' : 'border-white/30 hover:border-white/60'
                    }`}
                  >
                    <img
                      src={getImageUrl(property.images[index])}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Share Property</h3>
              <button
                onClick={closeShareModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Copy URL */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-3">
                    <p className="text-sm font-medium text-gray-900 mb-1">Property URL</p>
                    <p className="text-sm text-gray-600 truncate">{window.location.href}</p>
                  </div>
                  <button
                    onClick={copyPropertyUrl}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      copiedUrl 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    {copiedUrl ? (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Copied!
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Copy className="w-4 h-4" />
                        Copy
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Share Options */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-3">Share via</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={shareViaEmail}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Email</span>
                  </button>
                  
                  <button
                    onClick={shareOnWhatsApp}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">W</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">WhatsApp</span>
                  </button>
                  
                  <button
                    onClick={shareOnFacebook}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">f</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Facebook</span>
                  </button>
                  
                  <button
                    onClick={shareOnTwitter}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">T</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Twitter</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </PullToRefresh>
  );
};

export default PropertyDetail;