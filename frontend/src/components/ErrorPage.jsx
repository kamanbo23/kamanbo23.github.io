import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiHome, FiArrowLeft } from 'react-icons/fi';

const ErrorPage = () => {
  return (
    <div className="error-page">
      <motion.div 
        className="error-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <FiAlertTriangle className="error-icon" />
        <h1>404 - Page Not Found</h1>
        <p>Oops! The page you are looking for does not exist or has been moved.</p>
        
        <div className="error-actions">
          <Link to="/" className="home-button">
            <FiHome /> Go Home
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="back-button"
          >
            <FiArrowLeft /> Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorPage; 