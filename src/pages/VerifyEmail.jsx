import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmail } from '../services/userService';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';
import useToast from '../hooks/useToast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const { showNotification } = useToast();

  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  useEffect(() => {
    const handleVerification = async () => {
      if (!userId || !secret) {
        setVerificationStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      try {
        const result = await verifyEmail(userId, secret);
        if (result.success) {
          setVerificationStatus('success');
          setMessage('Your email has been verified successfully! Redirecting to home page...');
          showNotification('Email verified successfully!', 'success');
          
          // Redirect to home page after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setVerificationStatus('error');
          setMessage('Email verification failed. Please try again or contact support.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        setMessage('Email verification failed. The link may be expired or invalid.');
        showNotification('Email verification failed', 'error');
      }
    };

    handleVerification();
  }, [userId, secret, navigate, showNotification]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Email Verification
          </h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {verificationStatus === 'verifying' && (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600">Verifying your email...</p>
              </div>
            )}

            {verificationStatus === 'success' && (
              <div className="space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">Verification Successful!</h3>
                  <p className="text-gray-600">{message}</p>
                  <p className="text-sm text-gray-500">Redirecting to home page in 3 seconds...</p>
                </div>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div className="space-y-4">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">Verification Failed</h3>
                  <p className="text-gray-600">{message}</p>
                </div>
              </div>
            )}
          </div>


        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;