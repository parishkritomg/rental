import React from 'react';

const StandaloneTest = () => {
  console.log('StandaloneTest component rendered at:', new Date().toISOString());
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'green',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '24px',
      zIndex: 9999
    }}>
      <h1>STANDALONE TEST COMPONENT</h1>
      <p>This should ALWAYS be visible!</p>
      <p>Time: {new Date().toLocaleString()}</p>
      <p>If you see this green page, React rendering works!</p>
    </div>
  );
};

export default StandaloneTest;