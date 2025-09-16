import React from 'react';

const TestPage = () => {
  console.log('TestPage component rendered');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'red', 
      color: 'white', 
      padding: '20px',
      fontSize: '24px'
    }}>
      <h1>TEST PAGE - If you see this, React is working!</h1>
      <p>This is a simple test to verify the app is rendering.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
};

export default TestPage;