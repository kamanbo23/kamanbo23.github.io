import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiArrowRight, FiUserPlus, FiCheck } from 'react-icons/fi';
import './Login.css'; // Using the same styles as login for consistency

const Register = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const { register, isLoading } = useAuth();
    const navigate = useNavigate();

    // Password strength indicators
    const getPasswordStrength = (password) => {
        if (!password) return 0;
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength += 1;
        
        // Character variety checks
        if (/[A-Z]/.test(password)) strength += 1; // Has uppercase
        if (/[a-z]/.test(password)) strength += 1; // Has lowercase
        if (/[0-9]/.test(password)) strength += 1; // Has number
        if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Has special char
        
        return strength;
    };
    
    const passwordStrength = getPasswordStrength(password);
    const passwordStrengthText = [
        'Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'
    ][passwordStrength];
    
    // Get the appropriate CSS class for the password strength
    const getStrengthClass = (strength) => {
        if (strength <= 1) return 'weak';
        if (strength <= 3) return 'medium';
        return 'strong';
    };

    const passwordStrengthColor = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#14b8a6'
    ][passwordStrength];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (!email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }

        try {
            await register(email, username, password, fullName);
            navigate('/'); // Redirect to home page after successful registration
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <motion.div 
            className="login-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="login-card register-card">
                <motion.div 
                    className="login-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2>Join the Community</h2>
                    <p>Create your account to access research opportunities</p>
                </motion.div>

                <form onSubmit={handleSubmit} className="login-form">
                    <motion.div 
                        className="form-group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="input-group">
                            <FiUser className="input-icon" />
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </motion.div>

                    <motion.div 
                        className="form-group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="input-group">
                            <FiMail className="input-icon" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </motion.div>

                    <motion.div 
                        className="form-group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="input-group">
                            <FiUser className="input-icon" />
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </motion.div>

                    <motion.div 
                        className="form-group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="input-group">
                            <FiLock className="input-icon" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        {password && (
                            <div className="password-strength">
                                <div className="strength-bars">
                                    {[0, 1, 2, 3, 4].map((index) => (
                                        <div 
                                            key={index} 
                                            className={`strength-bar ${index < passwordStrength ? 'active' : ''}`}
                                            style={{ backgroundColor: index < passwordStrength ? passwordStrengthColor : undefined }}
                                        ></div>
                                    ))}
                                </div>
                                <span className={getStrengthClass(passwordStrength)}>
                                    {passwordStrengthText}
                                </span>
                            </div>
                        )}
                    </motion.div>

                    <motion.div 
                        className="form-group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <div className="input-group">
                            <FiLock className="input-icon" />
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            {confirmPassword && password === confirmPassword && (
                                <FiCheck className="confirm-icon" style={{ color: "#10b981" }} />
                            )}
                        </div>
                    </motion.div>

                    {error && (
                        <motion.div 
                            className="error-message"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <FiAlertCircle className="error-icon" />
                            {error}
                        </motion.div>
                    )}

                    <motion.button 
                        type="submit"
                        className="login-button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                        <FiUserPlus className="button-icon" />
                    </motion.button>

                    <motion.div 
                        className="form-footer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                    >
                        Already have an account?{' '}
                        <motion.a 
                            href="/login"
                            whileHover={{ scale: 1.05 }}
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/login');
                            }}
                        >
                            Log In
                        </motion.a>
                    </motion.div>
                </form>
            </div>
        </motion.div>
    );
};

export default Register; 