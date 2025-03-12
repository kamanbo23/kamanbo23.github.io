import axios from 'axios';

// Use environment variable for API URL or fallback to the Railway backend
const API_URL = process.env.REACT_APP_API_URL || 'https://kamanbo23githubio-production.up.railway.app';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  // Ensure credentials are included for CORS requests
  withCredentials: false, // Change to true if you need to send cookies
  // Increase timeout for slower connections
  timeout: 15000,
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Ensure Content-Type is properly set
    if (!config.headers['Content-Type'] && config.method !== 'get') {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log errors for debugging
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with an error status code
      if (error.response.status === 401) {
        // Unauthorized - clear token and redirect to login
        console.warn('Authentication expired or invalid');
        localStorage.removeItem('token');
        
        // Only redirect if we're not already on the login page
        if (!window.location.href.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      if (error.response.status === 403) {
        console.warn('Permission denied');
      }
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error('Network error - no response received');
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (username, password) => {
    try {
      // OAuth2 expects x-www-form-urlencoded format, not FormData
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      
      // Special handling for the token endpoint to ensure CORS works
      return await api.post('/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide more specific error messages
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Invalid username or password');
        } else if (error.response.status === 429) {
          throw new Error('Too many login attempts. Please try again later.');
        } else {
          throw new Error(`Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },
  
  register: async (userData) => {
    try {
      return await api.post('/users/', JSON.stringify(userData), {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response && error.response.data) {
        // Format error message from backend
        const detail = error.response.data.detail;
        throw new Error(detail || 'Registration failed. Please try again.');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },
  
  getCurrentUser: async () => {
    try {
      return await api.get('/users/me');
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
  
  updateProfile: async (profileData) => {
    try {
      return await api.put('/users/me', profileData);
    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.response && error.response.data) {
        throw new Error(error.response.data.detail || 'Profile update failed');
      } else {
        throw error;
      }
    }
  },
  
  saveEvent: async (eventId) => {
    try {
      return await api.post(`/users/me/save-event/${eventId}`);
    } catch (error) {
      console.error('Save event error:', error);
      throw error;
    }
  },
  
  saveOpportunity: async (opportunityId) => {
    try {
      return await api.post(`/users/me/save-opportunity/${opportunityId}`);
    } catch (error) {
      console.error('Save opportunity error:', error);
      throw error;
    }
  }
};

// Events services
export const eventService = {
  getEvents: async () => {
    return api.get('/events/');
  },
  
  createEvent: async (eventData) => {
    return api.post('/events/', eventData);
  },
  
  updateEvent: async (eventId, eventData) => {
    return api.put(`/events/${eventId}`, eventData);
  },
  
  deleteEvent: async (eventId) => {
    return api.delete(`/events/${eventId}`);
  }
};

// Opportunities services
export const opportunityService = {
  getOpportunities: async () => {
    return api.get('/opportunities/');
  },
  
  createOpportunity: async (opportunityData) => {
    return api.post('/opportunities/', opportunityData);
  },
  
  updateOpportunity: async (opportunityId, opportunityData) => {
    return api.put(`/opportunities/${opportunityId}`, opportunityData);
  },
  
  deleteOpportunity: async (opportunityId) => {
    return api.delete(`/opportunities/${opportunityId}`);
  },
  
  likeOpportunity: async (opportunityId) => {
    return api.post(`/opportunities/${opportunityId}/like`);
  },
  
  applyForOpportunity: async (opportunityId) => {
    return api.post(`/opportunities/${opportunityId}/apply`);
  }
};

export default {
  auth: authService,
  events: eventService,
  opportunities: opportunityService
}; 