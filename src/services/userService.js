import { account, databases, storage, DATABASE_ID, USERS_COLLECTION_ID, STORAGE_BUCKET_ID } from '../lib/appwrite';
import { Query } from 'appwrite';

// Get user profile from database
export const getUserProfile = async (userId) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );
    
    if (response.documents.length > 0) {
      return response.documents[0];
    }
    
    // If no profile exists, create a default one
    const user = await account.get();
    const newProfile = await databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      'unique()',
      {
        userId: userId,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ')[1] || '',
        phone: '',
        avatar: '',
        bio: '',
        isLandlord: false,
        verified: false
      }
    );
    
    return newProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Create user profile
export const createUserProfile = async (userId, userData) => {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      'unique()',
      {
        userId: userId,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        avatar: '',
        bio: '',
        isLandlord: false,
        verified: false
      }
    );
    return response;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (profileId, profileData) => {
  try {
    const response = await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      profileId,
      profileData
    );
    return response;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Upload profile photo
export const uploadProfilePhoto = async (file) => {
  try {
    const response = await storage.createFile(
      STORAGE_BUCKET_ID,
      'unique()',
      file
    );
    
    // Get the file URL
    const fileUrl = storage.getFileView(STORAGE_BUCKET_ID, response.$id);
    return {
      fileId: response.$id,
      fileUrl: fileUrl.href
    };
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw error;
  }
};

// Delete profile photo
export const deleteProfilePhoto = async (fileId) => {
  try {
    await storage.deleteFile(STORAGE_BUCKET_ID, fileId);
  } catch (error) {
    console.error('Error deleting profile photo:', error);
    throw error;
  }
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    await account.updatePassword(newPassword, currentPassword);
    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, error: error.message };
  }
};

// Update email
export const updateEmail = async (email, password) => {
  try {
    await account.updateEmail(email, password);
    return { success: true };
  } catch (error) {
    console.error('Error updating email:', error);
    return { success: false, error: error.message };
  }
};

// Update name
export const updateName = async (name) => {
  try {
    await account.updateName(name);
    return { success: true };
  } catch (error) {
    console.error('Error updating name:', error);
    return { success: false, error: error.message };
  }
};

// Send password recovery email
export const sendPasswordRecovery = async (email) => {
  try {
    const response = await account.createRecovery(
      email,
      `${window.location.origin}/reset-password`
    );
    return response;
  } catch (error) {
    console.error('Error sending password recovery:', error);
    throw error;
  }
};

// Complete password recovery
export const completePasswordRecovery = async (userId, secret, password) => {
  try {
    const response = await account.updateRecovery(
      userId,
      secret,
      password
    );
    return response;
  } catch (error) {
    console.error('Error completing password recovery:', error);
    throw error;
  }
};

// Get profile photo URL
export const getProfilePhotoUrl = (fileId) => {
  if (!fileId || typeof fileId !== 'string' || fileId.trim() === '') {
    console.warn('Invalid fileId provided for profile photo:', fileId);
    return null;
  }
  
  try {
    // Check if STORAGE_BUCKET_ID is configured
    if (!STORAGE_BUCKET_ID) {
      console.error('STORAGE_BUCKET_ID is not configured');
      return null;
    }
    
    const url = storage.getFileView(STORAGE_BUCKET_ID, fileId);
    const urlString = url.href || url.toString();
    console.log('Generated profile photo URL:', urlString, 'for fileId:', fileId);
    return urlString;
  } catch (error) {
    console.error('Error generating profile photo URL:', error, 'fileId:', fileId, 'bucket:', STORAGE_BUCKET_ID);
    return null;
  }
};

// Check if email already exists in Appwrite Auth
export const checkEmailExists = async (email) => {
  try {
    // Try to get user by email - this will throw an error if user doesn't exist
    const users = await account.listSessions();
    // Since we can't directly query users by email in Appwrite client SDK,
    // we'll need to check during the registration attempt
    return { exists: false };
  } catch (error) {
    return { exists: false };
  }
};

// Check if phone number already exists in user profiles
export const checkPhoneExists = async (phone) => {
  try {
    // Skip check if phone is empty or null
    if (!phone || phone.trim() === '') {
      return { exists: false };
    }
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('phone', phone.trim())]
    );
    
    console.log('Phone check result:', { phone, exists: response.documents.length > 0 });
    return { exists: response.documents.length > 0 };
  } catch (error) {
    console.error('Error checking phone existence:', error);
    return { exists: false };
  }
};

// Get all users
export const getAllUsers = async () => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.orderDesc('$createdAt')]
    );
    
    return response.documents;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

// Send email verification
export const sendEmailVerification = async () => {
  try {
    const promise = await account.createVerification('http://localhost:5174/verify-email');
    console.log('Email verification sent:', promise);
    return { success: true, message: 'Verification email sent successfully' };
  } catch (error) {
    console.error('Error sending email verification:', error);
    throw error;
  }
};

// Verify email with userId and secret
export const verifyEmail = async (userId, secret) => {
  try {
    const promise = await account.updateVerification(userId, secret);
    console.log('Email verified successfully:', promise);
    return { success: true, message: 'Email verified successfully' };
  } catch (error) {
    console.error('Error verifying email:', error);
    throw error;
  }
};

// Send SMS OTP to phone number
export const sendPhoneOTP = async (phoneNumber) => {
  try {
    const promise = await account.createPhoneToken('unique()', phoneNumber);
    console.log('SMS OTP sent:', promise);
    return { success: true, userId: promise.userId, message: 'OTP sent to your phone number' };
  } catch (error) {
    console.error('Error sending SMS OTP:', error);
    throw error;
  }
};

// Verify phone OTP
export const verifyPhoneOTP = async (userId, otp) => {
  try {
    const promise = await account.createSession(userId, otp);
    console.log('Phone OTP verified successfully:', promise);
    return { success: true, message: 'Phone number verified successfully' };
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    throw error;
  }
};

export const userService = {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
  changePassword,
  updateEmail,
  updateName,
  sendPasswordRecovery,
  completePasswordRecovery,
  getProfilePhotoUrl,
  checkEmailExists,
  checkPhoneExists,
  getAllUsers,
  sendEmailVerification,
  verifyEmail
};