
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';  // Import the HomePage component

import TestBuild from './components/TestBuild';   // Import the TestBuild page (you can create this later)
import AnalyseDB  from './components/AnalyseDB';
import ContactUs from './components/ContactUs';
import './App.css';  // Include global styles


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />  {/* HomePage route */}
        <Route path="/build-db" element={<TestBuild />} />  {/* Future BuildDB route */}
        <Route path="/analyse-db" element={<AnalyseDB />} />  {/* Future AnalyseDB route */}
        <Route path="/contact" element={<ContactUs />} /> {/* 👈 New Contact Us route */}
        {/* Add more routes here for other pages like Analyze DB, etc. */}
      </Routes>
    </Router>
  );
}

export default App;

