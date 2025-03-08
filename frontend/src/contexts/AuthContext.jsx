import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [userType, setUserType] = useState(localStorage.getItem('userType') || null);
  const [userData, setUserData] = useState(JSON.parse(localStorage.getItem('userData')) || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      localStorage.removeItem('userData');
      setIsAuthenticated(false);
      setUserType(null);
      setUserData(null);
    }
  }, [token]);

  useEffect(() => {
    if (userType) {
      localStorage.setItem('userType', userType);
    }
  }, [userType]);

  useEffect(() => {
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  }, [userData]);

  // Load user profile when authenticated
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated && userType === 'user' && token) {
        try {
          const response = await authService.getCurrentUser();
          if (response.status === 200) {
            setUserData(response.data);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, userType, token]);

  const login = async (usernameOrEmail, password) => {
    setIsLoading(true);
    try {
      const response = await authService.login(usernameOrEmail, password);
      
      const data = response.data;
      if (data.access_token) {
        setToken(data.access_token);
        setUserType(data.user_type);
        
        // If user, fetch profile data
        if (data.user_type === 'user') {
          const profileResponse = await authService.getCurrentUser();
          if (profileResponse.status === 200) {
            setUserData(profileResponse.data);
          }
        } else {
          // For admin, just store basic info
          setUserData({ username: data.username });
        }
        
        setIsAuthenticated(true);
        setIsLoading(false);
        return true;
      }
      
      throw new Error('No access token received');
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (email, username, password, fullName) => {
    setIsLoading(true);
    try {
      const userData = {
        email,
        username,
        password,
        full_name: fullName
      };
      
      const response = await authService.register(userData);
      setIsLoading(false);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const updateProfile = async (updateData) => {
    setIsLoading(true);
    try {
      const response = await authService.updateProfile(updateData);
      if (response.status === 200) {
        setUserData(response.data);
        setIsLoading(false);
        return response.data;
      }
      throw new Error('Profile update failed');
    } catch (error) {
      console.error('Profile update error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const saveEvent = async (eventId) => {
    if (!isAuthenticated || !token || userType !== 'user') {
      throw new Error('Not authenticated as user');
    }
    
    try {
      await authService.saveEvent(eventId);
      const profileResponse = await authService.getCurrentUser();
      if (profileResponse.status === 200) {
        setUserData(profileResponse.data);
      }
      return true;
    } catch (error) {
      console.error('Save event error:', error);
      throw error;
    }
  };

  const saveOpportunity = async (opportunityId) => {
    if (!isAuthenticated || !token || userType !== 'user') {
      throw new Error('Not authenticated as user');
    }
    
    try {
      await authService.saveOpportunity(opportunityId);
      const profileResponse = await authService.getCurrentUser();
      if (profileResponse.status === 200) {
        setUserData(profileResponse.data);
      }
      return true;
    } catch (error) {
      console.error('Save opportunity error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setIsAuthenticated(false);
    setUserType(null);
    setUserData(null);
  };

  // Calculate isAdmin and isUser properties
  const isAdmin = userType === 'admin';
  const isUser = userType === 'user';

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated,
        userType,
        userData,
        isLoading,
        isAdmin,
        isUser,
        login,
        logout,
        register,
        updateProfile,
        saveEvent,
        saveOpportunity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 