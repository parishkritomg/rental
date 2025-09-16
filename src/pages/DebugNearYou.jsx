// Debug page for testing Near You feature
// This is a temporary page for debugging - can be removed after fixing the issue

import React, { useState } from 'react';
import { Navigation, MapPin, TestTube, Database, CheckCircle, XCircle } from 'lucide-react';
import { runAllTests } from '../utils/testLocationFeature';
import { addCoordinatesToProperties, removeCoordinatesFromProperties, checkCoordinateStatus } from '../utils/addSampleCoordinates';
import { getCurrentLocation } from '../utils/locationUtils';

const DebugNearYou = () => {
  const [testResults, setTestResults] = useState(null);
  const [coordinateStatus, setCoordinateStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const handleTestGeolocation = async () => {
    setLoading(true);
    addLog('Testing geolocation...', 'info');
    
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      addLog(`✅ Geolocation successful: ${location.latitude}, ${location.longitude}`, 'success');
    } catch (error) {
      addLog(`❌ Geolocation failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAllTests = async () => {
    setLoading(true);
    addLog('Running all location tests...', 'info');
    
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      addLog(args.join(' '), 'info');
      originalLog(...args);
    };
    
    console.error = (...args) => {
      addLog(args.join(' '), 'error');
      originalError(...args);
    };
    
    try {
      await runAllTests();
      setTestResults({ success: true });
    } catch (error) {
      setTestResults({ success: false, error: error.message });
    } finally {
      console.log = originalLog;
      console.error = originalError;
      setLoading(false);
    }
  };

  const handleCheckCoordinates = async () => {
    setLoading(true);
    addLog('Checking coordinate status of properties...', 'info');
    
    try {
      const status = await checkCoordinateStatus();
      setCoordinateStatus(status);
      
      if (status.success) {
        addLog(`📊 Found ${status.total} properties: ${status.withCoords} with coordinates, ${status.withoutCoords} without`, 'info');
      } else {
        addLog(`❌ Failed to check coordinates: ${status.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Error checking coordinates: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoordinates = async () => {
    setLoading(true);
    addLog('Adding sample coordinates to properties...', 'info');
    
    try {
      const result = await addCoordinatesToProperties();
      
      if (result.success) {
        addLog(`✅ Updated ${result.updated} properties with coordinates`, 'success');
        addLog(`⏭️ Skipped ${result.skipped} properties (already had coordinates)`, 'info');
        
        // Refresh coordinate status
        await handleCheckCoordinates();
      } else {
        addLog(`❌ Failed to add coordinates: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Error adding coordinates: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoordinates = async () => {
    setLoading(true);
    addLog('Removing coordinates from all properties...', 'info');
    
    try {
      const result = await removeCoordinatesFromProperties();
      
      if (result.success) {
        addLog(`✅ Removed coordinates from ${result.updated} properties`, 'success');
        
        // Refresh coordinate status
        await handleCheckCoordinates();
      } else {
        addLog(`❌ Failed to remove coordinates: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Error removing coordinates: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Near You Feature Debug</h1>
          <p className="text-gray-600">Debug and test the location-based property search feature</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            {/* Geolocation Test */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Navigation className="w-5 h-5 mr-2" />
                Geolocation Test
              </h2>
              
              <button
                onClick={handleTestGeolocation}
                disabled={loading}
                className="btn-primary mb-4"
              >
                {loading ? 'Testing...' : 'Test Geolocation API'}
              </button>
              
              {userLocation && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">Location Retrieved</span>
                  </div>
                  <p className="text-green-700">
                    Latitude: {userLocation.latitude}<br />
                    Longitude: {userLocation.longitude}
                  </p>
                </div>
              )}
            </div>

            {/* Property Coordinates */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Property Coordinates
              </h2>
              
              <div className="space-y-3">
                <button
                  onClick={handleCheckCoordinates}
                  disabled={loading}
                  className="btn-secondary w-full"
                >
                  Check Coordinate Status
                </button>
                
                <button
                  onClick={handleAddCoordinates}
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  Add Sample Coordinates
                </button>
                
                <button
                  onClick={handleRemoveCoordinates}
                  disabled={loading}
                  className="btn-danger w-full"
                >
                  Remove All Coordinates
                </button>
              </div>
              
              {coordinateStatus && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">Coordinate Status</h3>
                  <div className="text-blue-700 text-sm space-y-1">
                    <p>Total Properties: {coordinateStatus.total}</p>
                    <p>With Coordinates: {coordinateStatus.withCoords}</p>
                    <p>Without Coordinates: {coordinateStatus.withoutCoords}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Full Test Suite */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <TestTube className="w-5 h-5 mr-2" />
                Full Test Suite
              </h2>
              
              <button
                onClick={handleRunAllTests}
                disabled={loading}
                className="btn-primary mb-4"
              >
                {loading ? 'Running Tests...' : 'Run All Tests'}
              </button>
              
              {testResults && (
                <div className={`border rounded-lg p-4 ${
                  testResults.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    {testResults.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    <span className={`font-medium ${
                      testResults.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResults.success ? 'All Tests Passed' : 'Tests Failed'}
                    </span>
                  </div>
                  {testResults.error && (
                    <p className="text-red-700 mt-2">{testResults.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Logs */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Debug Logs
              </h2>
              <button
                onClick={clearLogs}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear Logs
              </button>
            </div>
            
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-400">No logs yet. Run some tests to see output here.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`mb-1 ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    'text-gray-100'
                  }`}>
                    <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Debugging Instructions</h2>
          <div className="prose text-gray-600">
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>Test Geolocation:</strong> Check if the browser can access your location</li>
              <li><strong>Check Coordinates:</strong> See which properties have latitude/longitude data</li>
              <li><strong>Add Sample Coordinates:</strong> Add random coordinates to properties for testing</li>
              <li><strong>Run Full Tests:</strong> Test all location utilities and distance calculations</li>
              <li><strong>Test Near You:</strong> Go to Properties page and click "Near You" button</li>
            </ol>
            
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                <strong>Note:</strong> This debug page is for development only. 
                Remove it before deploying to production.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugNearYou;