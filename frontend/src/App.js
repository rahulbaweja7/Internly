import React from 'react';
import { LandingPage } from './components/LandingPage';
import './App.css';

function App() {
  const handleGetStarted = () => {
    console.log('Get Started clicked!');
    // TODO: Implement navigation to the main app
  };

  return (
    <div className="App">
      <LandingPage onGetStarted={handleGetStarted} />
    </div>
  );
}

export default App;
