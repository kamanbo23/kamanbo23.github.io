import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <section className="hero-section">
        <h1>Welcome to Research Hub</h1>
        <p className="hero-text">
          Connect with researchers, share your work, and discover groundbreaking research
        </p>
        <div className="cta-buttons">
          <Link to="/signup" className="cta-button primary">Get Started</Link>
          <Link to="/create-post" className="cta-button secondary">Share Research</Link>
        </div>
      </section>

      <section className="features-section">
        <h2>Why Join Research Hub?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Connect</h3>
            <p>Network with researchers from around the world</p>
          </div>
          <div className="feature-card">
            <h3>Share</h3>
            <p>Share your research findings and get valuable feedback</p>
          </div>
          <div className="feature-card">
            <h3>Discover</h3>
            <p>Stay updated with the latest research in your field</p>
          </div>
          <div className="feature-card">
            <h3>Collaborate</h3>
            <p>Find potential collaborators for your research projects</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;  // Ensure this export exists