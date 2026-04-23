import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('jkmall_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authAPI.getMe()
        .then(res => setUser(res.data.data))
        .catch(() => { logout(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('jkmall_token', t);
    localStorage.setItem('jkmall_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('jkmall_token', t);
    localStorage.setItem('jkmall_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('jkmall_token');
    localStorage.removeItem('jkmall_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
