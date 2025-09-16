import React, { useEffect, useState } from 'react';
import { Home, Smartphone } from 'lucide-react';

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    // Show logo animation
    const logoTimer = setTimeout(() => {
      setShowLogo(true);
    }, 100);

    // Progress animation
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => {
      clearTimeout(logoTimer);
      clearInterval(progressTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex flex-col items-center justify-center z-50">
      {/* Status bar simulation */}
      <div className="status-bar" />
      
      {/* Logo and branding */}
      <div className={`flex flex-col items-center mb-12 transition-all duration-1000 ${
        showLogo ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
      }`}>
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
            <Home className="w-12 h-12 text-blue-600" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">RentEase</h1>
        <p className="text-blue-100 text-lg font-medium">Find Your Perfect Home</p>
      </div>

      {/* Loading progress */}
      <div className="w-64 mb-8">
        <div className="flex justify-between text-white text-sm mb-2">
          <span>Loading...</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* App features preview */}
      <div className="flex space-x-8 text-white text-center opacity-60">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-2">
            <Home className="w-4 h-4" />
          </div>
          <span className="text-xs">Browse</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-2">
            <Smartphone className="w-4 h-4" />
          </div>
          <span className="text-xs">Connect</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-2">
            <Home className="w-4 h-4" />
          </div>
          <span className="text-xs">Rent</span>
        </div>
      </div>

      {/* Version info */}
      <div className="absolute bottom-8 text-white text-opacity-60 text-sm">
        Version 1.0.0
      </div>
    </div>
  );
};

export default SplashScreen;