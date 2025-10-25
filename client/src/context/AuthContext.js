import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [spotifyToken, setSpotifyToken] = useState(localStorage.getItem('spotifyToken'));

  // Fetch user profile when token exists
  const { data: userData, isLoading, error } = useQuery(
    ['user', token],
    () => api.get('/auth/me').then(res => res.data),
    {
      enabled: !!token,
      retry: false,
      onSuccess: (data) => {
        setUser(data.user);
      },
      onError: () => {
        logout();
      }
    }
  );

  const login = async (authData) => {
    try {
      const { token: newToken, user: userData, spotifyAccessToken } = authData;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('spotifyToken', spotifyAccessToken);
      
      setToken(newToken);
      setSpotifyToken(spotifyAccessToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('spotifyToken');
    setToken(null);
    setSpotifyToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    token,
    spotifyToken,
    login,
    logout,
    updateUser,
    isLoading,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
