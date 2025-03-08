import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiUser, FiMail, FiEdit2, FiSave, FiX, FiLogOut, 
  FiCalendar, FiBookmark, FiHeart, FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi';
import './UserProfile.css';

const UserProfile = () => {
  const { userData, updateProfile, logout, isLoading, isUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setFullName(userData.full_name || '');
      setEmail(userData.email || '');
      setBio(userData.bio || '');
      setInterests(userData.interests || []);
    }
  }, [userData]);

  // Redirect if not logged in as a user
  useEffect(() => {
    if (!isUser) {
      navigate('/login');
    }
  }, [isUser, navigate]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset form to original values
    setFullName(userData.full_name || '');
    setEmail(userData.email || '');
    setBio(userData.bio || '');
    setInterests(userData.interests || []);
    setIsEditing(false);
    setMessage({ text: '', type: '' });
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateProfile({
        full_name: fullName,
        email,
        bio,
        interests
      });
      
      setIsEditing(false);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    } catch (error) {
      setMessage({ text: error.message || 'Failed to update profile', type: 'error' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!userData) {
    return (
      <div className="user-profile-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <motion.div 
      className="user-profile-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="profile-header">
        <motion.div 
          className="profile-image-container"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="profile-image">
            {userData.profile_image ? (
              <img src={userData.profile_image} alt={userData.username} />
            ) : (
              <FiUser className="default-avatar" />
            )}
          </div>
        </motion.div>
        
        <motion.div 
          className="profile-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1>{userData.username}</h1>
          <p className="join-date">Joined {new Date(userData.created_at).toLocaleDateString()}</p>
        </motion.div>
        
        <motion.button 
          className="logout-button"
          onClick={handleLogout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <FiLogOut /> Logout
        </motion.button>
      </div>

      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <FiUser /> Profile
        </button>
        <button 
          className={`tab-button ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <FiBookmark /> Saved Items
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div 
            className="profile-content"
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="profile-card">
              <div className="card-header">
                <h2>Personal Information</h2>
                {!isEditing ? (
                  <motion.button 
                    className="edit-button"
                    onClick={handleEdit}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiEdit2 /> Edit
                  </motion.button>
                ) : (
                  <motion.button 
                    className="cancel-button"
                    onClick={handleCancel}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiX /> Cancel
                  </motion.button>
                )}
              </div>

              <AnimatePresence>
                {message.text && (
                  <motion.div 
                    className={`message ${message.type}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>
                    <FiUser className="field-icon" />
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!isEditing || isLoading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FiMail className="field-icon" />
                    Email
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing || isLoading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FiUser className="field-icon" />
                    Username
                  </label>
                  <input 
                    type="text" 
                    value={userData.username}
                    disabled={true}
                  />
                  <p className="field-note">Username cannot be changed</p>
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={!isEditing || isLoading}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label>Research Interests</label>
                  <div className="interests-container">
                    {interests.map((interest, index) => (
                      <div key={index} className="interest-tag">
                        {interest}
                        {isEditing && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveInterest(interest)}
                            className="remove-interest"
                          >
                            <FiX />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {isEditing && (
                    <div className="add-interest">
                      <input 
                        type="text" 
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        placeholder="Add a research interest"
                        disabled={isLoading}
                      />
                      <button 
                        type="button" 
                        onClick={handleAddInterest}
                        disabled={!newInterest.trim() || isLoading}
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <motion.button 
                    type="submit"
                    className="save-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                    <FiSave />
                  </motion.button>
                )}
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === 'saved' && (
          <motion.div 
            className="saved-content"
            key="saved"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="saved-events">
              <h2>
                <FiCalendar /> Saved Events ({userData.saved_events?.length || 0})
              </h2>
              {userData.saved_events?.length > 0 ? (
                <p className="events-note">View your saved events in the Events tab</p>
              ) : (
                <p className="no-saved">You haven't saved any events yet</p>
              )}
            </div>

            <div className="saved-opportunities">
              <h2>
                <FiHeart /> Saved Opportunities ({userData.saved_opportunities?.length || 0})
              </h2>
              {userData.saved_opportunities?.length > 0 ? (
                <p className="opportunities-note">View your saved opportunities in the Opportunities tab</p>
              ) : (
                <p className="no-saved">You haven't saved any research opportunities yet</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserProfile; 