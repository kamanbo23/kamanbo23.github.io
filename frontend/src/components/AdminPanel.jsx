import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiPlus, FiEdit2, FiTrash2, FiCheckCircle, FiAlertCircle, 
    FiCalendar, FiBriefcase, FiX, FiArrowLeft, FiSearch,
    FiSave, FiUser, FiUsers, FiBookmark
} from 'react-icons/fi';
import { eventService, opportunityService } from '../services/api';
import './AdminPanel.css';

const AdminPanel = () => {
    const { isAuthenticated, isAdmin, token } = useAuth();
    const [activeTab, setActiveTab] = useState('opportunities');
    const [opportunities, setOpportunities] = useState([]);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [formData, setFormData] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is admin, if not redirect
        if (!isAuthenticated || !isAdmin) {
            navigate('/login');
        } else {
            fetchData();
        }
    }, [isAuthenticated, isAdmin, navigate, activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'opportunities') {
                const response = await opportunityService.getOpportunities();
                setOpportunities(response.data);
            } else if (activeTab === 'events') {
                const response = await eventService.getEvents();
                setEvents(response.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setMessage({
                text: 'Failed to load data. Please try again.',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setIsEditing(true);
        setCurrentItem(null);
        
        if (activeTab === 'opportunities') {
            setFormData({
                title: '',
                organization: '',
                description: '',
                type: 'RESEARCH',
                location: '',
                deadline: new Date().toISOString().split('T')[0],
                duration: '',
                compensation: '',
                requirements: [],
                fields: [],
                contact_email: '',
                virtual: false,
                tags: []
            });
        } else if (activeTab === 'events') {
            setFormData({
                title: '',
                organization: '',
                description: '',
                venue: '',
                registration_link: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0],
                location: '',
                type: 'CONFERENCE',
                price: '',
                tech_stack: [],
                speakers: [],
                virtual: false,
                tags: []
            });
        }
    };

    const handleEdit = (item) => {
        setIsEditing(true);
        setCurrentItem(item);
        setFormData(item);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                if (activeTab === 'opportunities') {
                    await opportunityService.deleteOpportunity(id);
                } else {
                    await eventService.deleteEvent(id);
                }
                
                setMessage({
                    text: 'Item successfully deleted.',
                    type: 'success'
                });
                fetchData();
            } catch (error) {
                console.error('Error deleting item:', error);
                setMessage({
                    text: 'Failed to delete item. Please try again.',
                    type: 'error'
                });
            }
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleArrayChange = (e, field) => {
        const value = e.target.value;
        // Split by commas and trim whitespace
        const array = value.split(',').map(item => item.trim());
        setFormData({ ...formData, [field]: array });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const isNew = !currentItem;
            let response;
            
            if (activeTab === 'opportunities') {
                if (isNew) {
                    response = await opportunityService.createOpportunity(formData);
                } else {
                    response = await opportunityService.updateOpportunity(currentItem.id, formData);
                }
            } else {
                if (isNew) {
                    response = await eventService.createEvent(formData);
                } else {
                    response = await eventService.updateEvent(currentItem.id, formData);
                }
            }
            
            setMessage({
                text: `Item successfully ${isNew ? 'created' : 'updated'}.`,
                type: 'success'
            });
            
            setIsEditing(false);
            fetchData();
        } catch (error) {
            console.error('Error submitting form:', error);
            setMessage({
                text: 'Failed to save changes. Please try again.',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setCurrentItem(null);
        setFormData({});
    };

    if (!isAuthenticated || !isAdmin) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="admin-panel">
            <h1 className="admin-title">Admin Dashboard</h1>
            
            <AnimatePresence>
                {message.text && (
                    <motion.div 
                        className={`admin-message ${message.type}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                        {message.text}
                        <button 
                            className="message-close"
                            onClick={() => setMessage({ text: '', type: '' })}
                        >
                            <FiX />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="admin-tabs">
                <button 
                    className={`tab-button ${activeTab === 'opportunities' ? 'active' : ''}`}
                    onClick={() => setActiveTab('opportunities')}
                >
                    <FiBriefcase /> Opportunities
                </button>
                <button 
                    className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
                    onClick={() => setActiveTab('events')}
                >
                    <FiCalendar /> Events
                </button>
                <button 
                    className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <FiUsers /> Users
                </button>
            </div>
            
            <div className="admin-content">
                {isEditing ? (
                    <div className="admin-form-container">
                        <div className="form-header">
                            <button onClick={cancelEdit} className="back-button">
                                <FiArrowLeft /> Back to List
                            </button>
                            <h2>{currentItem ? 'Edit' : 'Create'} {activeTab === 'opportunities' ? 'Opportunity' : 'Event'}</h2>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="admin-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="title">Title</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={formData.title || ''}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="organization">Organization</label>
                                    <input
                                        type="text"
                                        id="organization"
                                        name="organization"
                                        value={formData.organization || ''}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                
                                {activeTab === 'opportunities' && (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="type">Type</label>
                                            <select
                                                id="type"
                                                name="type"
                                                value={formData.type || 'RESEARCH'}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="RESEARCH">Research</option>
                                                <option value="INTERNSHIP">Internship</option>
                                                <option value="FELLOWSHIP">Fellowship</option>
                                                <option value="GRANT">Grant</option>
                                                <option value="PROJECT">Project</option>
                                            </select>
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="deadline">Deadline</label>
                                            <input
                                                type="date"
                                                id="deadline"
                                                name="deadline"
                                                value={formData.deadline?.split('T')[0] || ''}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </>
                                )}
                                
                                {activeTab === 'events' && (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="type">Type</label>
                                            <select
                                                id="type"
                                                name="type"
                                                value={formData.type || 'CONFERENCE'}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="CONFERENCE">Conference</option>
                                                <option value="HACKATHON">Hackathon</option>
                                                <option value="WORKSHOP">Workshop</option>
                                                <option value="MEETUP">Meetup</option>
                                                <option value="WEBINAR">Webinar</option>
                                                <option value="TECH_TALK">Tech Talk</option>
                                            </select>
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="start_date">Start Date</label>
                                            <input
                                                type="date"
                                                id="start_date"
                                                name="start_date"
                                                value={formData.start_date?.split('T')[0] || ''}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="end_date">End Date</label>
                                            <input
                                                type="date"
                                                id="end_date"
                                                name="end_date"
                                                value={formData.end_date?.split('T')[0] || ''}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="venue">Venue</label>
                                            <input
                                                type="text"
                                                id="venue"
                                                name="venue"
                                                value={formData.venue || ''}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="registration_link">Registration Link</label>
                                            <input
                                                type="url"
                                                id="registration_link"
                                                name="registration_link"
                                                value={formData.registration_link || ''}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </>
                                )}
                                
                                <div className="form-group">
                                    <label htmlFor="location">Location</label>
                                    <input
                                        type="text"
                                        id="location"
                                        name="location"
                                        value={formData.location || ''}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                
                                <div className="form-group form-checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="virtual"
                                            checked={formData.virtual || false}
                                            onChange={handleChange}
                                        />
                                        Virtual
                                    </label>
                                </div>
                                
                                {activeTab === 'opportunities' && (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="duration">Duration</label>
                                            <input
                                                type="text"
                                                id="duration"
                                                name="duration"
                                                value={formData.duration || ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="compensation">Compensation</label>
                                            <input
                                                type="text"
                                                id="compensation"
                                                name="compensation"
                                                value={formData.compensation || ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="contact_email">Contact Email</label>
                                            <input
                                                type="email"
                                                id="contact_email"
                                                name="contact_email"
                                                value={formData.contact_email || ''}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </>
                                )}
                                
                                {activeTab === 'events' && (
                                    <div className="form-group">
                                        <label htmlFor="price">Price</label>
                                        <input
                                            type="text"
                                            id="price"
                                            name="price"
                                            value={formData.price || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <div className="form-group full-width">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description || ''}
                                    onChange={handleChange}
                                    rows={6}
                                    required
                                ></textarea>
                            </div>
                            
                            {activeTab === 'opportunities' && (
                                <>
                                    <div className="form-group full-width">
                                        <label htmlFor="requirements">Requirements (comma-separated)</label>
                                        <input
                                            type="text"
                                            id="requirements"
                                            value={(formData.requirements || []).join(', ')}
                                            onChange={(e) => handleArrayChange(e, 'requirements')}
                                        />
                                    </div>
                                    
                                    <div className="form-group full-width">
                                        <label htmlFor="fields">Fields (comma-separated)</label>
                                        <input
                                            type="text"
                                            id="fields"
                                            value={(formData.fields || []).join(', ')}
                                            onChange={(e) => handleArrayChange(e, 'fields')}
                                        />
                                    </div>
                                </>
                            )}
                            
                            {activeTab === 'events' && (
                                <>
                                    <div className="form-group full-width">
                                        <label htmlFor="tech_stack">Tech Stack (comma-separated)</label>
                                        <input
                                            type="text"
                                            id="tech_stack"
                                            value={(formData.tech_stack || []).join(', ')}
                                            onChange={(e) => handleArrayChange(e, 'tech_stack')}
                                        />
                                    </div>
                                    
                                    <div className="form-group full-width">
                                        <label htmlFor="speakers">Speakers (comma-separated)</label>
                                        <input
                                            type="text"
                                            id="speakers"
                                            value={(formData.speakers || []).join(', ')}
                                            onChange={(e) => handleArrayChange(e, 'speakers')}
                                        />
                                    </div>
                                </>
                            )}
                            
                            <div className="form-group full-width">
                                <label htmlFor="tags">Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    id="tags"
                                    value={(formData.tags || []).join(', ')}
                                    onChange={(e) => handleArrayChange(e, 'tags')}
                                />
                            </div>
                            
                            <div className="form-actions">
                                <button type="button" onClick={cancelEdit} className="cancel-button">
                                    Cancel
                                </button>
                                <button type="submit" className="save-button">
                                    <FiSave /> Save {activeTab === 'opportunities' ? 'Opportunity' : 'Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <>
                        <div className="admin-header">
                            <div className="search-box">
                                <FiSearch className="search-icon" />
                                <input 
                                    type="text" 
                                    placeholder={`Search ${activeTab}...`} 
                                />
                            </div>
                            
                            <button className="create-button" onClick={handleCreate}>
                                <FiPlus /> Create New
                            </button>
                        </div>
                        
                        {isLoading ? (
                            <div className="admin-loading">Loading...</div>
                        ) : activeTab === 'opportunities' ? (
                            <div className="admin-items">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Organization</th>
                                            <th>Type</th>
                                            <th>Deadline</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {opportunities.length > 0 ? (
                                            opportunities.map(opportunity => (
                                                <tr key={opportunity.id}>
                                                    <td>{opportunity.title}</td>
                                                    <td>{opportunity.organization}</td>
                                                    <td>{opportunity.type}</td>
                                                    <td>{new Date(opportunity.deadline).toLocaleDateString()}</td>
                                                    <td className="actions-cell">
                                                        <button 
                                                            className="edit-button"
                                                            onClick={() => handleEdit(opportunity)}
                                                        >
                                                            <FiEdit2 />
                                                        </button>
                                                        <button 
                                                            className="delete-button"
                                                            onClick={() => handleDelete(opportunity.id)}
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="no-data">No opportunities found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : activeTab === 'events' ? (
                            <div className="admin-items">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Organization</th>
                                            <th>Type</th>
                                            <th>Start Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.length > 0 ? (
                                            events.map(event => (
                                                <tr key={event.id}>
                                                    <td>{event.title}</td>
                                                    <td>{event.organization}</td>
                                                    <td>{event.type}</td>
                                                    <td>{new Date(event.start_date).toLocaleDateString()}</td>
                                                    <td className="actions-cell">
                                                        <button 
                                                            className="edit-button"
                                                            onClick={() => handleEdit(event)}
                                                        >
                                                            <FiEdit2 />
                                                        </button>
                                                        <button 
                                                            className="delete-button"
                                                            onClick={() => handleDelete(event.id)}
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="no-data">No events found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="admin-items">
                                <div className="admin-placeholder">
                                    <FiUsers size={48} />
                                    <p>User management coming soon.</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminPanel; 