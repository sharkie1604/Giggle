import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  // On mount and whenever token changes, refresh user profile via /auth/me
  useEffect(() => {
    let isMounted = true;

    const refreshUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (isMounted && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          // If unauthorized or token invalid, clear session so storage never goes stale
          if (err.response?.status === 401 && isMounted) {
            logout();
          }
        }
      } else if (isMounted) {
        setUser(null);
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    refreshUser();

    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  // Login handler: accepts either (userData, userToken) or credentials object { email, password }
  const login = async (userOrCredentials, possibleToken) => {
    if (possibleToken) {
      setUser(userOrCredentials);
      setToken(possibleToken);
      localStorage.setItem('user', JSON.stringify(userOrCredentials));
      localStorage.setItem('token', possibleToken);
      return { user: userOrCredentials, token: possibleToken };
    }

    const res = await api.post('/auth/login', userOrCredentials);
    const { user: loggedInUser, token: receivedToken } = res.data;
    setUser(loggedInUser);
    setToken(receivedToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    localStorage.setItem('token', receivedToken);
    return res.data;
  };

  // Register handler: accepts registration data, posts to /auth/register, sets state & storage
  const register = async (registerData) => {
    const res = await api.post('/auth/register', registerData);
    const { user: newUser, token: receivedToken } = res.data;
    setUser(newUser);
    setToken(receivedToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('token', receivedToken);
    return res.data;
  };

  // Update user handler: merges updated user object into state and localStorage
  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated,
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

export default AuthContext;
