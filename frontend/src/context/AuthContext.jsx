import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // try to get user from localstorage on first load
  const [user, setUser] = useState(() => {
    let stored = localStorage.getItem('ttm_user');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let token = localStorage.getItem('ttm_token');

    if (token) {
      // verify token is still valid
      api.get('/auth/me')
        .then((response) => {
          let userData = response.data.user;
          setUser(userData);
          localStorage.setItem('ttm_user', JSON.stringify(userData));
          console.log('user session restored:', userData.email);
        })
        .catch((err) => {
          console.log('token invalid, logging out:', err.message);
          localStorage.removeItem('ttm_token');
          localStorage.removeItem('ttm_user');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    // listen for 401 errors from api interceptor
    const handleAuthLogout = () => {
      setUser(null);
      setLoading(false);
    };

    window.addEventListener('auth:logout', handleAuthLogout);

    // cleanup
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('ttm_token', token);
    localStorage.setItem('ttm_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ttm_token');
    localStorage.removeItem('ttm_user');
    setUser(null);
  };

  // check if user is admin
  let isAdmin = false;
  if (user && user.role === 'admin') {
    isAdmin = true;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  let ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be inside AuthProvider');
  }
  return ctx;
};
