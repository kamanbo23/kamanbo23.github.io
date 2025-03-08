import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { FiLock, FiUser, FiArrowRight, FiAlertCircle, FiMail } from 'react-icons/fi';
import './Login.css';

const Login = () => {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const success = await login(usernameOrEmail, password);
            if (success) {
                // Redirect based on user type
                navigate('/');
            }
        } catch (err) {
            setError('Invalid username/email or password. Please try again.');
            console.error('Login error:', err);
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
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                        <FiArrowRight className="button-icon" />
                    </motion.button>

                    <motion.div 
                        className="form-footer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        Don't have an account?{' '}
                        <motion.a 
                            href="/register"
                            whileHover={{ scale: 1.05 }}
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/register');
                            }}
                        >
                            Sign Up
                        </motion.a>
                    </motion.div>
                </form>
            </div>
        </motion.div>
    );
};

export default Login; 