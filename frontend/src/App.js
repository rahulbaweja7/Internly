import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import Dashboard from './components/Dashboard'; 
import AddJob from './components/ui/AddJob';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add" element={<AddJob />} />
      </Routes>
    </Router>
  );
}

export default App;
