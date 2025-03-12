import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { FiLock, FiUser, FiArrowRight, FiAlertCircle, FiMail, FiWifi, FiWifiOff } from 'react-icons/fi';
import './Login.css';

const Login = () => {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    // Monitor network status
    useEffect(() => {
        const handleOnline = () => setNetworkStatus(true);
        const handleOffline = () => setNetworkStatus(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Form validation
        if (!usernameOrEmail.trim()) {
            setError('Please enter your username or email');
            return;
        }

        if (!password) {
            setError('Please enter your password');
            return;
        }

        // Check network status
        if (!networkStatus) {
            setError('You are offline. Please check your internet connection.');
            return;
        }

        try {
            const success = await login(usernameOrEmail, password);
            if (success) {
                // Add a small delay before navigation to show success state
                setTimeout(() => {
                    navigate('/');
                }, 300);
            }
        } catch (err) {
            console.error('Login error:', err);
            
            // More specific error messages based on the error type
            if (err.message === 'Invalid username or password') {
                setError('Invalid username/email or password. Please try again.');
            } else if (err.message.includes('Network error')) {
                setError('Unable to connect to the server. Please check your internet connection.');
            } else if (err.message.includes('Too many login attempts')) {
                setError('Too many login attempts. Please try again later.');
            } else {
                setError(`Login failed: ${err.message || 'Unknown error'}`);
            }
        }
    };

    return (
        <motion.div 
            className="login-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="login-card">
                <motion.div 
                    className="login-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2>Welcome Back</h2>
                    <p>Sign in to access your account</p>
                    
                    {/* Network status indicator */}
                    <div className={`network-status ${networkStatus ? 'online' : 'offline'}`}>
                        {networkStatus ? (
                            <><FiWifi /> <span>Online</span></>
                        ) : (
                            <><FiWifiOff /> <span>Offline</span></>
                        )}
                    </div>
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
                                placeholder="Username or Email"
                                value={usernameOrEmail}
                                onChange={(e) => setUsernameOrEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className={error && error.includes('username') ? 'input-error' : ''}
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
                            <FiLock className="input-icon" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className={error && error.includes('password') ? 'input-error' : ''}
                            />
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
                        disabled={isLoading || !networkStatus}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isLoading ? (
                            <div className="spinner"></div>
                        ) : (
                            <>
                                Sign In <FiArrowRight className="btn-icon" />
                            </>
                        )}
                    </motion.button>

                    <motion.div 
                        className="register-link"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <p>Don't have an account? <Link to="/register">Register</Link></p>
                    </motion.div>
                </form>
            </div>
        </motion.div>
    );
};

export default Login; 