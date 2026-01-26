import { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    // Check for session-based auth first (Google OAuth)
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      // Try to get user from session (cookie-based auth)
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true // Send cookies
      });
      setUser(response.data);
    } catch (error) {
      // If session auth fails, try JWT token
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get(`${API}/auth/me`);
          setUser(response.data);
        } catch (err) {
          console.error('Failed to fetch user with token', err);
          logout();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return user;
  };

  const register = async (email, password, full_name, role) => {
    const response = await axios.post(`${API}/auth/register`, {
      email,
      password,
      full_name,
      role,
    });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return user;
  };

  const logout = async () => {
    try {
      // Call backend logout to clear session
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;