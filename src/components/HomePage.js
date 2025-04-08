import React from "react";
import { Link } from 'react-router-dom'; 
import './HomePage.css';

function App() {
  return (
    <div className="app">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-logo">Vocal Query</div>
        <ul className="nav-links">
          <li>Features</li>
          <li>Pricing</li>
          <li>Login</li>
          <li><Link to="/contact">Contact Us</Link></li>
        </ul>
      </nav>

      {/* Main Section */}
      <div className="main-section">
        <h1 className="heading">Welcome to Our Voice-to-SQL App!</h1>
        <p className="intro">
          Revolutionize the way you interact with databases. Our product allows
          you to speak natural language queries, automatically converting them
          into SQL and leverages the power of <strong>PostgreSQL</strong> to store your data securely and execute SQL queries efficiently.
        </p>
      </div>

      {/* Buttons Section */}
      <div className="button-section">
        <div className="button-box">
        <Link to="/build-db">
          <button className="btn">Build a Database</button>  </Link>
          <p>Create and populate a database with just your voice!</p>
        </div>
        <div className="button-box">
        <Link to="/analyse-db">
          <button className="btn">Analyze a Database</button> </Link>
          <p>Analyze, query, and manage existing databases effortlessly.</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 Voice-to-SQL App. All rights reserved.</p>
        <p>
          Made with ❤️ for innovation and simplicity.
        </p>
      </footer>
    </div>
  );
}

export default App;
