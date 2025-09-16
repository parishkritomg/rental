import React, { useState } from 'react';
import { X, Phone, AlertCircle } from 'lucide-react';
import { updateUserProfile } from '../services/userService';

const PhoneNumberModal = ({ isOpen, onClose, userProfile, onPhoneAdded }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    return /^[\+]?[1-9][\d]{0,15}$/.test(cleanPhone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    
    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await updateUserProfile(userProfile.$id, { phone: phone.trim() });
      onPhoneAdded(phone.trim());
      onClose();
    } catch (error) {
      setError('Failed to update phone number. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setPhone(e.target.value);
    if (error) {
      setError('');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Add Phone Number
                </h3>
                <p className="text-sm text-gray-500">
                  Please add your phone number to continue
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                We require a phone number for all users to improve security and communication. 
                This information will be kept private and secure.
              </p>
              
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    error ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                />
              </div>
              {error && (
                <div className="mt-2 flex items-center text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium text-white ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                } transition-colors duration-200`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </div>
                ) : (
                  'Add Phone Number'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default PhoneNumberModal;