import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Plus, AlertTriangle, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProperty, updateProperty, uploadImages } from '../services/propertyService';
import { getUserProfile } from '../services/userService';
import { validateFieldForPhoneNumbers } from '../utils/phoneValidation';
import { geocodeAddress } from '../services/locationService';

const EditProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    address: '',
    zipCode: '',
    country: 'United States',
    latitude: '',
    longitude: '',
    propertyType: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    area: '',
    furnished: false,
    petFriendly: false,
    parking: false,
    amenities: [],
    contactEmail: user?.email || '',
    contactPhone: '',
    status: 'available'
  });
  const [newAmenity, setNewAmenity] = useState('');
  const [phoneValidationErrors, setPhoneValidationErrors] = useState({});
  const [showPhoneNotification, setShowPhoneNotification] = useState(false);

  const [geocodingLocation, setGeocodingLocation] = useState(false);

  // Load existing property data
  useEffect(() => {
    const loadPropertyData = async () => {
      try {
        const result = await getProperty(id);
        if (result.success) {
          const property = result.data;
          
          // Check if user owns this property
          if (property.ownerId !== user.$id) {
            alert('You can only edit your own properties.');
            navigate('/dashboard');
            return;
          }

          // Get user profile phone as fallback if property doesn't have contactPhone
          let fallbackPhone = '';
          if (!property.contactPhone) {
            try {
              const profile = await getUserProfile();
              fallbackPhone = profile?.phone || '';
            } catch (error) {
              console.error('Error fetching user profile for fallback phone:', error);
            }
          }

          setFormData({
            title: property.title || '',
            description: property.description || '',
            price: property.price?.toString() || '',
            location: property.location || '',
            address: property.address || '',
            zipCode: property.zipCode || '',
            country: property.country || 'United States',
            latitude: property.latitude || '',
            longitude: property.longitude || '',
            propertyType: property.propertyType || 'apartment',
            listingType: property.listingType || 'rent',
            bedrooms: property.bedrooms || 1,
            bathrooms: property.bathrooms || 1,
            area: property.area?.toString() || '',
            furnished: property.furnished || false,
            petFriendly: property.petFriendly || false,
            parking: property.parking || false,
            amenities: property.amenities || [],
            contactEmail: property.contactEmail || user?.email || '',
            contactPhone: property.contactPhone || fallbackPhone,
            status: property.status || 'available'
          });
          
          // Set existing images
          setExistingImages(property.images || []);
        } else {
          alert('Error loading property: ' + result.error);
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error loading property:', error);
        alert('Error loading property. Please try again.');
        navigate('/dashboard');
      } finally {
        setLoadingProperty(false);
      }
    };

    if (id && user) {
      loadPropertyData();
    } else if (!id) {
      navigate('/dashboard');
    }
  }, [id, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Always update the form data first
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Validate for phone numbers in restricted fields
    if (type !== 'checkbox' && (name === 'title' || name === 'description')) {
      const validation = validateFieldForPhoneNumbers(name, newValue);
      
      if (!validation.isValid) {
        setPhoneValidationErrors(prev => ({
          ...prev,
          [name]: validation.message
        }));
        setShowPhoneNotification(true);
        // Auto-hide notification after 5 seconds
        setTimeout(() => setShowPhoneNotification(false), 5000);
      } else {
        // Clear error if field is now valid
        setPhoneValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const removeExistingImage = (imageId) => {
    setExistingImages(prev => prev.filter(img => img !== imageId));
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };



  const handleAddressChange = async (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, address: value }));
    
    // Auto-geocode when user stops typing
    if (value.length > 5) {
      clearTimeout(window.geocodeTimeout);
      window.geocodeTimeout = setTimeout(async () => {
        setGeocodingLocation(true);
        try {
          const result = await geocodeAddress(value);
          if (result.success) {
            setFormData(prev => ({
              ...prev,
              latitude: result.data.latitude,
              longitude: result.data.longitude
            }));
          }
        } catch (error) {
          console.error('Error auto-geocoding address:', error);
        } finally {
          setGeocodingLocation(false);
        }
      }, 1000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for phone validation errors
    if (Object.keys(phoneValidationErrors).length > 0) {
      alert('Please fix the phone number validation errors before submitting.');
      setShowPhoneNotification(true);
      return;
    }
    
    setLoading(true);

    try {
      // Upload new images if any
      let newImageUrls = [];
      if (images.length > 0) {
        const imageFiles = images.map(img => img.file);
        const uploadResult = await uploadImages(imageFiles);
        if (uploadResult.success) {
          newImageUrls = uploadResult.data.map(file => file.$id);
        }
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls];

      // Create updated property data
      const propertyData = {
        ...formData,
        price: parseInt(formData.price),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area: parseInt(formData.area),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        images: allImages
      };

      const result = await updateProperty(id, propertyData);
      
      if (result.success) {
        // Clean up object URLs
        images.forEach(img => URL.revokeObjectURL(img.preview));
        navigate('/dashboard');
      } else {
        alert('Error updating property: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating property:', error);
      alert('Error updating property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProperty) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container-responsive py-4">
          <div className="flex items-center gap-4">
            <h1 className="heading-lg text-gray-900">Edit Property</h1>
          </div>
        </div>
      </div>

      <div className="container-responsive py-8">
        {/* Phone Number Notification */}
        {showPhoneNotification && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-1">Phone Number Not Allowed</h3>
                <p className="text-sm text-red-700">
                  Please add your phone number in the designated phone number section only, not in other fields.
                </p>
              </div>
              <button
                onClick={() => setShowPhoneNotification(false)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`input ${phoneValidationErrors.title ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                      required
                      placeholder="e.g., Modern Downtown Apartment"
                    />
                    {phoneValidationErrors.title && (
                      <p className="mt-1 text-sm text-red-600">{phoneValidationErrors.title}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Type *
                    </label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className="input"
                      required
                    >
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="condo">Condo</option>
                      <option value="studio">Studio</option>
                      <option value="townhouse">Townhouse</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Listing Type *
                    </label>
                    <select
                      name="listingType"
                      value={formData.listingType}
                      onChange={handleInputChange}
                      className="input"
                      required
                    >
                      <option value="rent">For Rent</option>
                      <option value="sale">For Sale</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.listingType === 'rent' ? 'Monthly Rent ($) *' : 'Sale Price ($) *'}
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="input"
                      required
                      min="0"
                      placeholder={formData.listingType === 'rent' ? '1500' : '250000'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bedrooms *
                    </label>
                    <select
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      className="input"
                      required
                    >
                      {[1,2,3,4,5,6].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bathrooms *
                    </label>
                    <select
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      className="input"
                      required
                    >
                      {[1,1.5,2,2.5,3,3.5,4].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area (sq ft) *
                    </label>
                    <input
                      type="number"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      className="input"
                      required
                      min="0"
                      placeholder="850"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className={`input ${phoneValidationErrors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    required
                    placeholder="Describe your property..."
                  />
                  {phoneValidationErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{phoneValidationErrors.description}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
                
                <div className="space-y-4">


                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City/Area *
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="input"
                        required
                        placeholder="e.g., Downtown, Suburbs"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Zip Code *
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="input"
                        required
                        placeholder="e.g., 10001"
                        pattern="[0-9]{5}(-[0-9]{4})?"
                        title="Please enter a valid zip code (e.g., 12345 or 12345-6789)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country *
                      </label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="input"
                        required
                      >
                        <option value="Afghanistan">Afghanistan</option>
                        <option value="Albania">Albania</option>
                        <option value="Algeria">Algeria</option>
                        <option value="Andorra">Andorra</option>
                        <option value="Angola">Angola</option>
                        <option value="Antigua and Barbuda">Antigua and Barbuda</option>
                        <option value="Argentina">Argentina</option>
                        <option value="Armenia">Armenia</option>
                        <option value="Australia">Australia</option>
                        <option value="Austria">Austria</option>
                        <option value="Azerbaijan">Azerbaijan</option>
                        <option value="Bahamas">Bahamas</option>
                        <option value="Bahrain">Bahrain</option>
                        <option value="Bangladesh">Bangladesh</option>
                        <option value="Barbados">Barbados</option>
                        <option value="Belarus">Belarus</option>
                        <option value="Belgium">Belgium</option>
                        <option value="Belize">Belize</option>
                        <option value="Benin">Benin</option>
                        <option value="Bhutan">Bhutan</option>
                        <option value="Bolivia">Bolivia</option>
                        <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                        <option value="Botswana">Botswana</option>
                        <option value="Brazil">Brazil</option>
                        <option value="Brunei">Brunei</option>
                        <option value="Bulgaria">Bulgaria</option>
                        <option value="Burkina Faso">Burkina Faso</option>
                        <option value="Burundi">Burundi</option>
                        <option value="Cabo Verde">Cabo Verde</option>
                        <option value="Cambodia">Cambodia</option>
                        <option value="Cameroon">Cameroon</option>
                        <option value="Canada">Canada</option>
                        <option value="Central African Republic">Central African Republic</option>
                        <option value="Chad">Chad</option>
                        <option value="Chile">Chile</option>
                        <option value="China">China</option>
                        <option value="Colombia">Colombia</option>
                        <option value="Comoros">Comoros</option>
                        <option value="Congo">Congo</option>
                        <option value="Costa Rica">Costa Rica</option>
                        <option value="Croatia">Croatia</option>
                        <option value="Cuba">Cuba</option>
                        <option value="Cyprus">Cyprus</option>
                        <option value="Czech Republic">Czech Republic</option>
                        <option value="Democratic Republic of the Congo">Democratic Republic of the Congo</option>
                        <option value="Denmark">Denmark</option>
                        <option value="Djibouti">Djibouti</option>
                        <option value="Dominica">Dominica</option>
                        <option value="Dominican Republic">Dominican Republic</option>
                        <option value="Ecuador">Ecuador</option>
                        <option value="Egypt">Egypt</option>
                        <option value="El Salvador">El Salvador</option>
                        <option value="Equatorial Guinea">Equatorial Guinea</option>
                        <option value="Eritrea">Eritrea</option>
                        <option value="Estonia">Estonia</option>
                        <option value="Eswatini">Eswatini</option>
                        <option value="Ethiopia">Ethiopia</option>
                        <option value="Fiji">Fiji</option>
                        <option value="Finland">Finland</option>
                        <option value="France">France</option>
                        <option value="Gabon">Gabon</option>
                        <option value="Gambia">Gambia</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Germany">Germany</option>
                        <option value="Ghana">Ghana</option>
                        <option value="Greece">Greece</option>
                        <option value="Grenada">Grenada</option>
                        <option value="Guatemala">Guatemala</option>
                        <option value="Guinea">Guinea</option>
                        <option value="Guinea-Bissau">Guinea-Bissau</option>
                        <option value="Guyana">Guyana</option>
                        <option value="Haiti">Haiti</option>
                        <option value="Honduras">Honduras</option>
                        <option value="Hungary">Hungary</option>
                        <option value="Iceland">Iceland</option>
                        <option value="India">India</option>
                        <option value="Indonesia">Indonesia</option>
                        <option value="Iran">Iran</option>
                        <option value="Iraq">Iraq</option>
                        <option value="Ireland">Ireland</option>
                        <option value="Israel">Israel</option>
                        <option value="Italy">Italy</option>
                        <option value="Ivory Coast">Ivory Coast</option>
                        <option value="Jamaica">Jamaica</option>
                        <option value="Japan">Japan</option>
                        <option value="Jordan">Jordan</option>
                        <option value="Kazakhstan">Kazakhstan</option>
                        <option value="Kenya">Kenya</option>
                        <option value="Kiribati">Kiribati</option>
                        <option value="Kuwait">Kuwait</option>
                        <option value="Kyrgyzstan">Kyrgyzstan</option>
                        <option value="Laos">Laos</option>
                        <option value="Latvia">Latvia</option>
                        <option value="Lebanon">Lebanon</option>
                        <option value="Lesotho">Lesotho</option>
                        <option value="Liberia">Liberia</option>
                        <option value="Libya">Libya</option>
                        <option value="Liechtenstein">Liechtenstein</option>
                        <option value="Lithuania">Lithuania</option>
                        <option value="Luxembourg">Luxembourg</option>
                        <option value="Madagascar">Madagascar</option>
                        <option value="Malawi">Malawi</option>
                        <option value="Malaysia">Malaysia</option>
                        <option value="Maldives">Maldives</option>
                        <option value="Mali">Mali</option>
                        <option value="Malta">Malta</option>
                        <option value="Marshall Islands">Marshall Islands</option>
                        <option value="Mauritania">Mauritania</option>
                        <option value="Mauritius">Mauritius</option>
                        <option value="Mexico">Mexico</option>
                        <option value="Micronesia">Micronesia</option>
                        <option value="Moldova">Moldova</option>
                        <option value="Monaco">Monaco</option>
                        <option value="Mongolia">Mongolia</option>
                        <option value="Montenegro">Montenegro</option>
                        <option value="Morocco">Morocco</option>
                        <option value="Mozambique">Mozambique</option>
                        <option value="Myanmar">Myanmar</option>
                        <option value="Namibia">Namibia</option>
                        <option value="Nauru">Nauru</option>
                        <option value="Nepal">Nepal</option>
                        <option value="Netherlands">Netherlands</option>
                        <option value="New Zealand">New Zealand</option>
                        <option value="Nicaragua">Nicaragua</option>
                        <option value="Niger">Niger</option>
                        <option value="Nigeria">Nigeria</option>
                        <option value="North Korea">North Korea</option>
                        <option value="North Macedonia">North Macedonia</option>
                        <option value="Norway">Norway</option>
                        <option value="Oman">Oman</option>
                        <option value="Pakistan">Pakistan</option>
                        <option value="Palau">Palau</option>
                        <option value="Palestine">Palestine</option>
                        <option value="Panama">Panama</option>
                        <option value="Papua New Guinea">Papua New Guinea</option>
                        <option value="Paraguay">Paraguay</option>
                        <option value="Peru">Peru</option>
                        <option value="Philippines">Philippines</option>
                        <option value="Poland">Poland</option>
                        <option value="Portugal">Portugal</option>
                        <option value="Qatar">Qatar</option>
                        <option value="Romania">Romania</option>
                        <option value="Russia">Russia</option>
                        <option value="Rwanda">Rwanda</option>
                        <option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
                        <option value="Saint Lucia">Saint Lucia</option>
                        <option value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</option>
                        <option value="Samoa">Samoa</option>
                        <option value="San Marino">San Marino</option>
                        <option value="Sao Tome and Principe">Sao Tome and Principe</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="Senegal">Senegal</option>
                        <option value="Serbia">Serbia</option>
                        <option value="Seychelles">Seychelles</option>
                        <option value="Sierra Leone">Sierra Leone</option>
                        <option value="Singapore">Singapore</option>
                        <option value="Slovakia">Slovakia</option>
                        <option value="Slovenia">Slovenia</option>
                        <option value="Solomon Islands">Solomon Islands</option>
                        <option value="Somalia">Somalia</option>
                        <option value="South Africa">South Africa</option>
                        <option value="South Korea">South Korea</option>
                        <option value="South Sudan">South Sudan</option>
                        <option value="Spain">Spain</option>
                        <option value="Sri Lanka">Sri Lanka</option>
                        <option value="Sudan">Sudan</option>
                        <option value="Suriname">Suriname</option>
                        <option value="Sweden">Sweden</option>
                        <option value="Switzerland">Switzerland</option>
                        <option value="Syria">Syria</option>
                        <option value="Taiwan">Taiwan</option>
                        <option value="Tajikistan">Tajikistan</option>
                        <option value="Tanzania">Tanzania</option>
                        <option value="Thailand">Thailand</option>
                        <option value="Timor-Leste">Timor-Leste</option>
                        <option value="Togo">Togo</option>
                        <option value="Tonga">Tonga</option>
                        <option value="Trinidad and Tobago">Trinidad and Tobago</option>
                        <option value="Tunisia">Tunisia</option>
                        <option value="Turkey">Turkey</option>
                        <option value="Turkmenistan">Turkmenistan</option>
                        <option value="Tuvalu">Tuvalu</option>
                        <option value="Uganda">Uganda</option>
                        <option value="Ukraine">Ukraine</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="United States">United States</option>
                        <option value="Uruguay">Uruguay</option>
                        <option value="Uzbekistan">Uzbekistan</option>
                        <option value="Vanuatu">Vanuatu</option>
                        <option value="Vatican City">Vatican City</option>
                        <option value="Venezuela">Venezuela</option>
                        <option value="Vietnam">Vietnam</option>
                        <option value="Yemen">Yemen</option>
                        <option value="Zambia">Zambia</option>
                        <option value="Zimbabwe">Zimbabwe</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Address *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleAddressChange}
                          className="input"
                          required
                          placeholder="123 Main Street, City, State"
                        />
                        {geocodingLocation && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="loading-spinner w-4 h-4"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coordinates Display */}
                  {formData.latitude && formData.longitude && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-800">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">Location coordinates found!</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Lat: {parseFloat(formData.latitude).toFixed(6)}, Lng: {parseFloat(formData.longitude).toFixed(6)}
                      </p>
                    </div>
                  )}


                </div>
              </div>

              {/* Features */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="furnished"
                      checked={formData.furnished}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Furnished</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="petFriendly"
                      checked={formData.petFriendly}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Pet Friendly</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="parking"
                      checked={formData.parking}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Parking Available</span>
                  </label>
                </div>
              </div>

              {/* Amenities */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    className="input flex-1"
                    placeholder="Add amenity (e.g., Swimming Pool, Gym)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                  />
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="btn-secondary"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Property Status */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Status</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="input"
                    required
                  >
                    <option value="available">Available</option>
                    <option value="rented">{formData.listingType === 'rent' ? 'Rented' : 'Sold'}</option>
                    <option value="pending">Pending</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                  <p className="text-sm text-gray-600 mt-1">
                    Mark as "{formData.listingType === 'rent' ? 'Rented' : 'Sold'}" when the property is no longer available.
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Images */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Images</h2>
                
                <div className="space-y-4">
                  {/* Existing Images */}
                  {existingImages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Current Images</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {existingImages.map((imageId, index) => (
                          <div key={imageId} className="relative group">
                            <img
                              src={`https://cloud.appwrite.io/v1/storage/buckets/property-images/files/${imageId}/view?project=68c4288c003b7b8b8b8b`}
                              alt={`Property ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(imageId)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* New Images */}
                  <label className="block">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to add more images</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each</p>
                    </div>
                  </label>
                  
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {images.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.preview}
                            alt="Preview"
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="card p-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="loading-spinner w-4 h-4"></div>
                      Updating Property...
                    </div>
                  ) : (
                    'Update Property'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProperty;