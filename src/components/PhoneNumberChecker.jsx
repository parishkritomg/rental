import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/userService';
import PhoneNumberModal from './PhoneNumberModal';

const PhoneNumberChecker = ({ children }) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.$id);
          setUserProfile(profile);
          
          // Check if phone number is missing or empty
          if (!profile.phone || profile.phone.trim() === '') {
            setShowPhoneModal(true);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
      setIsLoading(false);
    };

    checkUserProfile();
  }, [user]);

  const handlePhoneAdded = (phone) => {
    setUserProfile(prev => ({ ...prev, phone }));
    setShowPhoneModal(false);
  };

  const handleCloseModal = () => {
    // Don't allow closing the modal without adding phone number
    // This ensures the phone number is mandatory
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      {userProfile && (
        <PhoneNumberModal
          isOpen={showPhoneModal}
          onClose={handleCloseModal}
          userProfile={userProfile}
          onPhoneAdded={handlePhoneAdded}
        />
      )}
    </>
  );
};

export default PhoneNumberChecker;