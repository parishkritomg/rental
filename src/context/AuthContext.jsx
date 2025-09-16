import React, { createContext, useContext, useEffect, useState } from 'react';
import { account } from '../lib/appwrite';
import { createUserProfile, getUserProfile, checkPhoneExists, sendEmailVerification } from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const session = await account.get();
      setUser(session);
      
      // Fetch user profile data including avatar
      if (session) {
        try {
          const profile = await getUserProfile(session.$id);
          setUserProfile(profile);
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          setUserProfile(null);
        }
      }
    } catch (error) {
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      
      // Fetch user profile data
      try {
        const profile = await getUserProfile(user.$id);
        setUser(user);
        setUserProfile(profile);
      } catch (profileError) {
        console.error('Error fetching user profile:', profileError);
        setUserProfile(null);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password, name, phone) => {
    try {
      console.log('Starting registration process:', { email, name, phone });
      
      // Check if phone number already exists
      if (phone && phone.trim() !== '') {
        console.log('Checking phone existence for:', phone);
        const phoneCheck = await checkPhoneExists(phone);
        console.log('Phone check result:', phoneCheck);
        if (phoneCheck.exists) {
          return { success: false, error: 'Phone number is already registered' };
        }
      }
      
      // Try to create the account - Appwrite will handle email duplication
      console.log('Creating Appwrite account...');
      await account.create('unique()', email, password, name);
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      
      // Create user profile with phone number
      const nameParts = name.split(' ');
      const profile = await createUserProfile(user.$id, {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: phone
      });
      
      setUser(user);
      setUserProfile(profile);
      
      // Send email verification
      try {
        await sendEmailVerification();
        console.log('Email verification sent');
      } catch (verificationError) {
        console.error('Failed to send verification email:', verificationError);
        // Don't fail registration if verification email fails
      }
      
      console.log('Registration successful');
      return { success: true, emailVerificationSent: true };
    } catch (error) {
      console.error('Registration error:', error);
      // Handle Appwrite email duplication error
      if (error.message.includes('user_already_exists') || error.message.includes('email') || error.code === 409) {
        return { success: false, error: 'Email is already registered' };
      }
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      setUserProfile(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    userProfile,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};