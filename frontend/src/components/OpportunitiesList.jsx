import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiDollarSign, FiBook, FiUsers, FiHeart, FiMail, FiGlobe } from 'react-icons/fi';
import { opportunityService } from '../services/api';
import './OpportunitiesList.css';

const OpportunitiesList = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilters, setSelectedFilters] = useState({
        type: [],
        fields: [],
        virtual: null
    });

    const opportunityTypes = [
        'Research',
        'Internship',
        'Fellowship',
        'Grant',
        'Project'
    ];

    const fieldOptions = [
        'Machine Learning',
        'Computer Vision',
        'Natural Language Processing',
        'Robotics',
        'Data Science',
        'Software Engineering',
        'Cybersecurity',
        'Artificial Intelligence'
    ];

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const fetchOpportunities = async () => {
        try {
            const response = await opportunityService.getOpportunities();
            setOpportunities(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching opportunities:', error);
            setLoading(false);
        }
    };

    const handleLike = async (id) => {
        try {
            await opportunityService.likeOpportunity(id);
            fetchOpportunities();
        } catch (error) {
            console.error('Error liking opportunity:', error);
        }
    };

    const handleApply = async (id) => {
        try {
            await opportunityService.applyForOpportunity(id);
            fetchOpportunities();
        } catch (error) {
            console.error('Error applying for opportunity:', error);
        }
    };

    const filteredOpportunities = opportunities.filter(opportunity => {
        const matchesSearch = opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            opportunity.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
            opportunity.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = selectedFilters.type.length === 0 ||
            selectedFilters.type.includes(opportunity.type);

        const matchesFields = selectedFilters.fields.length === 0 ||
            selectedFilters.fields.some(field => opportunity.fields.includes(field));

        const matchesVirtual = selectedFilters.virtual === null ||
            opportunity.virtual === selectedFilters.virtual;

        return matchesSearch && matchesType && matchesFields && matchesVirtual;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    const filterVariants = {
        hidden: { height: 0, opacity: 0 },
        visible: {
            height: 'auto',
            opacity: 1,
            transition: {
                duration: 0.3
            }
        }
    };

    const opportunityVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    return (
        <div className="opportunities-container">
            <div className="opportunities-header">
                <h1>Research & Internship Opportunities</h1>
                <p>Discover exciting research opportunities and internships in your field</p>
            </div>

            <div className="search-filters">
                <input
                    type="text"
                    placeholder="Search opportunities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />

                <motion.div
                    className="filters"
                    variants={filterVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="filter-section">
                        <h3>Type</h3>
                        <div className="filter-options">
                            {opportunityTypes.map(type => (
                                <button
                                    key={type}
                                    className={`filter-button ${selectedFilters.type.includes(type) ? 'active' : ''}`}
                                    onClick={() => setSelectedFilters(prev => ({
                                        ...prev,
                                        type: prev.type.includes(type)
                                            ? prev.type.filter(t => t !== type)
                                            : [...prev.type, type]
                                    }))}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-section">
                        <h3>Fields</h3>
                        <div className="filter-options">
                            {fieldOptions.map(field => (
                                <button
                                    key={field}
                                    className={`filter-button ${selectedFilters.fields.includes(field) ? 'active' : ''}`}
                                    onClick={() => setSelectedFilters(prev => ({
                                        ...prev,
                                        fields: prev.fields.includes(field)
                                            ? prev.fields.filter(f => f !== field)
                                            : [...prev.fields, field]
                                    }))}
                                >
                                    {field}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-section">
                        <h3>Format</h3>
                        <div className="filter-options">
                            <button
                                className={`filter-button ${selectedFilters.virtual === true ? 'active' : ''}`}
                                onClick={() => setSelectedFilters(prev => ({
                                    ...prev,
                                    virtual: prev.virtual === true ? null : true
                                }))}
                            >
                                Virtual
                            </button>
                            <button
                                className={`filter-button ${selectedFilters.virtual === false ? 'active' : ''}`}
                                onClick={() => setSelectedFilters(prev => ({
                                    ...prev,
                                    virtual: prev.virtual === false ? null : false
                                }))}
                            >
                                In-Person
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {loading ? (
                <div className="loading-spinner">Loading...</div>
            ) : (
                <motion.div
                    className="opportunities-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {filteredOpportunities.map(opportunity => (
                        <motion.div
                            key={opportunity.id}
                            className="opportunity-card"
                            variants={opportunityVariants}
                        >
                            <div className="opportunity-header">
                                <h2>{opportunity.title}</h2>
                                <span className={`type-badge ${opportunity.type.toLowerCase().replace(' ', '-')}`}>
                                    {opportunity.type}
                                </span>
                            </div>

                            <div className="organization">
                                <FiUsers className="icon" />
                                {opportunity.organization}
                            </div>

                            <div className="location">
                                <FiMapPin className="icon" />
                                {opportunity.location}
                                {opportunity.virtual && <span className="virtual-badge">Virtual</span>}
                            </div>

                            <div className="deadline">
                                <FiCalendar className="icon" />
                                Deadline: {new Date(opportunity.deadline).toLocaleDateString()}
                            </div>

                            {opportunity.compensation && (
                                <div className="compensation">
                                    <FiDollarSign className="icon" />
                                    {opportunity.compensation}
                                </div>
                            )}

                            {opportunity.fields && opportunity.fields.length > 0 && (
                                <div className="fields">
                                    <FiBook className="icon" />
                                    {opportunity.fields.join(', ')}
                                </div>
                            )}

                            <p className="description">{opportunity.description}</p>

                            <div className="contact">
                                <FiGlobe className="icon" />
                                {opportunity.website ? (
                                    <a href={opportunity.website} target="_blank" rel="noopener noreferrer">
                                        {opportunity.website}
                                    </a>
                                ) : (
                                    'No website provided'
                                )}
                            </div>

                            <div className="card-footer">
                                <button
                                    className="like-button"
                                    onClick={() => handleLike(opportunity.id)}
                                >
                                    <FiHeart className="icon" />
                                    {opportunity.likes}
                                </button>

                                <button
                                    className="apply-button"
                                    onClick={() => {
                                        handleApply(opportunity.id);
                                        // Only open website in new tab, not email
                                        if (opportunity.website && opportunity.website.trim() !== '') {
                                            window.open(opportunity.website, '_blank');
                                        } else {
                                            // Alert user if no website is available
                                            alert("No application website available. Please contact the organization directly.");
                                        }
                                    }}
                                >
                                    Apply Now
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default OpportunitiesList; 