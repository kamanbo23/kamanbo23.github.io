import React, { useState, useEffect } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiMapPin, FiTag, FiFilter, FiSearch, FiExternalLink, FiClock, FiUsers, FiCheckCircle, FiBook, FiCode, FiMonitor, FiCoffee, FiCpu, FiGlobe, FiSmartphone, FiPieChart, FiCloud } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { eventService } from '../services/api';
import './EventsList.css';

const EventsList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedTechStack, setSelectedTechStack] = useState('');
    const { isAuthenticated } = useAuth();
    const { scrollYProgress } = useScroll();
    const [showFilters, setShowFilters] = useState(false);

    // Event types for filtering
    const eventTypes = [
        { value: '', label: 'All Types' },
        { value: 'conference', label: 'Conference' },
        { value: 'workshop', label: 'Workshop' },
        { value: 'hackathon', label: 'Hackathon' },
        { value: 'webinar', label: 'Webinar' },
        { value: 'meetup', label: 'Meetup' }
    ];

    // Tech stacks for filtering
    const techStacks = [
        { value: '', label: 'All Technologies' },
        { value: 'AI/ML', label: 'AI/ML' },
        { value: 'Web Development', label: 'Web Development' },
        { value: 'Mobile Development', label: 'Mobile Development' },
        { value: 'Data Science', label: 'Data Science' },
        { value: 'Cybersecurity', label: 'Cybersecurity' },
        { value: 'Blockchain', label: 'Blockchain' },
        { value: 'Cloud Computing', label: 'Cloud Computing' },
        { value: 'DevOps', label: 'DevOps' },
        { value: 'IoT', label: 'IoT' }
    ];

    // Fetch events data from API
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const response = await eventService.getEvents();
                setEvents(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching events:', error);
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // Filter events based on search term and selections
    const filteredEvents = events.filter(event => {
        const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              event.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = selectedType === '' || event.event_type === selectedType;
        
        const matchesTechStack = selectedTechStack === '' || 
                                event.tech_stack.includes(selectedTechStack);
        
        return matchesSearch && matchesType && matchesTechStack;
    });

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { 
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };
    
    const cardVariants = {
        hidden: { y: 50, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
            }
        }
    };

    // Format date to readable string
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <motion.div 
            className="events-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="noise-overlay"></div>
            <div className="glow-effect top-left"></div>
            <div className="glow-effect bottom-right"></div>
            
            <motion.div 
                className="events-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <h1>Tech Events</h1>
                <p>Discover conferences, workshops, and meetups from around the world</p>
            </motion.div>
            
            <div className="search-filters">
                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                    <FiFilter className="filter-icon" />
                    Filter Options
                </div>
                
                {showFilters && (
                    <motion.div 
                        className="advanced-filters"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="filter-section">
                            <h3>Event Type</h3>
                            <div className="filter-options">
                                <div 
                                    className={`filter-option ${selectedType === '' ? 'active' : ''}`}
                                    onClick={() => setSelectedType('')}
                                >
                                    <span className="icon"><FiCheckCircle /></span>
                                    All Types
                                </div>
                                <div 
                                    className={`filter-option ${selectedType === 'conference' ? 'active' : ''}`}
                                    onClick={() => setSelectedType('conference')}
                                >
                                    <span className="icon"><FiUsers /></span>
                                    Conference
                                </div>
                                <div 
                                    className={`filter-option ${selectedType === 'workshop' ? 'active' : ''}`}
                                    onClick={() => setSelectedType('workshop')}
                                >
                                    <span className="icon"><FiBook /></span>
                                    Workshop
                                </div>
                                <div 
                                    className={`filter-option ${selectedType === 'hackathon' ? 'active' : ''}`}
                                    onClick={() => setSelectedType('hackathon')}
                                >
                                    <span className="icon"><FiCode /></span>
                                    Hackathon
                                </div>
                                <div 
                                    className={`filter-option ${selectedType === 'webinar' ? 'active' : ''}`}
                                    onClick={() => setSelectedType('webinar')}
                                >
                                    <span className="icon"><FiMonitor /></span>
                                    Webinar
                                </div>
                                <div 
                                    className={`filter-option ${selectedType === 'meetup' ? 'active' : ''}`}
                                    onClick={() => setSelectedType('meetup')}
                                >
                                    <span className="icon"><FiCoffee /></span>
                                    Meetup
                                </div>
                            </div>
                        </div>
                        
                        <div className="filter-section">
                            <h3>Technology</h3>
                            <div className="filter-options">
                                <div 
                                    className={`filter-option ${selectedTechStack === '' ? 'active' : ''}`}
                                    onClick={() => setSelectedTechStack('')}
                                >
                                    <span className="icon"><FiCheckCircle /></span>
                                    All Technologies
                                </div>
                                <div 
                                    className={`filter-option ${selectedTechStack === 'AI/ML' ? 'active' : ''}`}
                                    onClick={() => setSelectedTechStack('AI/ML')}
                                >
                                    <span className="icon"><FiCpu /></span>
                                    AI/ML
                                </div>
                                <div 
                                    className={`filter-option ${selectedTechStack === 'Web Development' ? 'active' : ''}`}
                                    onClick={() => setSelectedTechStack('Web Development')}
                                >
                                    <span className="icon"><FiGlobe /></span>
                                    Web Development
                                </div>
                                <div 
                                    className={`filter-option ${selectedTechStack === 'Mobile Development' ? 'active' : ''}`}
                                    onClick={() => setSelectedTechStack('Mobile Development')}
                                >
                                    <span className="icon"><FiSmartphone /></span>
                                    Mobile Development
                                </div>
                                <div 
                                    className={`filter-option ${selectedTechStack === 'Data Science' ? 'active' : ''}`}
                                    onClick={() => setSelectedTechStack('Data Science')}
                                >
                                    <span className="icon"><FiPieChart /></span>
                                    Data Science
                                </div>
                                <div 
                                    className={`filter-option ${selectedTechStack === 'Cloud Computing' ? 'active' : ''}`}
                                    onClick={() => setSelectedTechStack('Cloud Computing')}
                                >
                                    <span className="icon"><FiCloud /></span>
                                    Cloud Computing
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
            
            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading amazing events...</p>
                </div>
            ) : (
                <>
                    <motion.div 
                        className="results-stats"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                    </motion.div>
                    
                    {filteredEvents.length > 0 ? (
                        <motion.div 
                            className="events-grid"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <AnimatePresence>
                                {filteredEvents.map((event, index) => (
                                    <motion.div 
                                        key={event.id} 
                                        className="event-card"
                                        variants={cardVariants}
                                        layoutId={`event-${event.id}`}
                                        whileHover={{ 
                                            y: -10, 
                                            transition: { duration: 0.3, ease: [0.33, 1, 0.68, 1] }
                                        }}
                                    >
                                        <div className="event-card-content">
                                            <div className="event-tag-container">
                                                <span className={`event-tag ${event.event_type.toLowerCase()}`}>
                                                    {event.event_type}
                                                </span>
                                                {event.is_virtual && (
                                                    <span className="event-tag virtual">Virtual</span>
                                                )}
                                            </div>
                                            
                                            <h3 className="event-title">{event.name}</h3>
                                            
                                            <div className="event-meta">
                                                <div className="meta-item">
                                                    <FiCalendar className="meta-icon" />
                                                    <span>{formatDate(event.date)}</span>
                                                </div>
                                                
                                                <div className="meta-item">
                                                    <FiClock className="meta-icon" />
                                                    <span>{event.duration}</span>
                                                </div>
                                                
                                                <div className="meta-item">
                                                    <FiMapPin className="meta-icon" />
                                                    <span>{event.location || 'Online'}</span>
                                                </div>
                                                
                                                <div className="meta-item">
                                                    <FiUsers className="meta-icon" />
                                                    <span>{event.attendees_count || 0} attendees</span>
                                                </div>
                                            </div>
                                            
                                            <div className="event-tech-stack">
                                                {event.tech_stack.map((tech, i) => (
                                                    <span key={i} className="tech-badge">{tech}</span>
                                                ))}
                                            </div>
                                            
                                            <p className="event-description">{event.description}</p>
                                            
                                            <div className="event-footer">
                                                <motion.a 
                                                    href={event.registration_link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="btn btn-primary"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    Register Now
                                                    <FiExternalLink />
                                                </motion.a>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div 
                            className="no-results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="no-results-icon">🔍</span>
                            <h3>No events found</h3>
                            <p>Try adjusting your search filters to find more events</p>
                        </motion.div>
                    )}
                </>
            )}
            
            <motion.div 
                className="scroll-progress"
                style={{ scaleX: scrollYProgress }}
            />
        </motion.div>
    );
};

export default EventsList; 