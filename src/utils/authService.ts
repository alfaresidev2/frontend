// Base API URL
const API_URL = 'http://localhost:3001';

// Login function
export const loginUser = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Function to get user profile using JWT
export const getUserProfile = async (token: string) => {
  try {
    const response = await fetch(`${API_URL}/api/admin/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user profile');
    }

    return data;
  } catch (error) {
    console.error('Profile fetch error:', error);
    throw error;
  }
};

// Function to check if token is valid
export const validateToken = async (token: string) => {
  try {
    const response = await fetch(`${API_URL}/api/admin/auth/validate-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

// Add auth token to requests
export const authHeader = (token: string) => {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Store JWT token
export const setToken = (token: string) => {
  localStorage.setItem('token', token);
};

// Get JWT token
export const getToken = () => {
  return localStorage.getItem('token');
};

// Remove JWT token
export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}; 