// src/components/ContactUs.js
import React from 'react';
import './ContactUs.css'; // Create this file for styling
import { FaGithub, FaLinkedin } from 'react-icons/fa'; // Import icons

const ContactUs = () => {
  return (
    <div className="contact-page">
      <h1 className="contact-title">Contact Me</h1>
      <div className="contact-container">
        <p><strong>Name:</strong> Nishyanth Nandagopal</p>
        <p><strong>Phone:</strong> +91-9741206664</p>
        <p><strong>Email:</strong> nishyanthnandagopal@gmail.com</p>
        
      </div>

      <div className="contact-icons">
  <a href="https://github.com/Nishyanthn" target="_blank" rel="noopener noreferrer">
    <FaGithub className="social-icon" />
  </a>
  <a href="http://www.linkedin.com/in/nishyanth-nandagopal" target="_blank" rel="noopener noreferrer">
    <FaLinkedin className="social-icon" />
  </a>
</div>

    </div>
  );
};

export default ContactUs;
