import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.name}!`);
      navigate(u.role === 'admin' ? '/admin' : `/${redirect}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-card card">
        <div className="auth-header">
          <h1>JK<span>mall</span></h1>
          <p>Welcome back! Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <Mail size={18} />
            <input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="input-group">
            <Lock size={18} />
            <input type="password" placeholder="Password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="auth-footer">Don't have an account? <Link to="/register">Create one</Link></p>
      </div>
      <style jsx>{`
        .auth-page { display: flex; justify-content: center; align-items: center; min-height: 80vh; padding: 20px; }
        .auth-card { max-width: 420px; width: 100%; padding: 40px; }
        .auth-header { text-align: center; margin-bottom: 30px; }
        .auth-header h1 { font-size: 2.5rem; font-weight: 800; }
        .auth-header h1 span { color: var(--primary); }
        .auth-header p { color: var(--text-muted); margin-top: 5px; }
        .input-group { display: flex; align-items: center; gap: 12px; border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 15px; margin-bottom: 15px; }
        .input-group:focus-within { border-color: var(--primary); }
        .input-group input { flex: 1; border: none; outline: none; font-size: 1rem; }
        .auth-footer { text-align: center; margin-top: 20px; color: var(--text-muted); }
        .auth-footer a { color: var(--primary); font-weight: 600; }
      `}</style>
    </div>
  );
};

export default Login;
