import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Illustration SVG - simple abstract shapes
const AuthIllustration = () => (
  <svg viewBox="0 0 380 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 340 }}>
    <ellipse cx="190" cy="265" rx="155" ry="18" fill="rgba(255,255,255,0.1)" />
    <rect x="60" y="210" width="260" height="12" rx="4" fill="rgba(255,255,255,0.25)" />
    <rect x="85" y="222" width="10" height="30" rx="3" fill="rgba(255,255,255,0.2)" />
    <rect x="285" y="222" width="10" height="30" rx="3" fill="rgba(255,255,255,0.2)" />
    <rect x="120" y="140" width="140" height="72" rx="6" fill="rgba(255,255,255,0.2)" />
    <rect x="128" y="148" width="124" height="56" rx="4" fill="rgba(255,255,255,0.15)" />
    <rect x="175" y="212" width="30" height="8" rx="2" fill="rgba(255,255,255,0.2)" />
    <rect x="136" y="156" width="60" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
    <rect x="136" y="167" width="40" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
    <rect x="136" y="176" width="50" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
    <rect x="200" y="156" width="44" height="44" rx="4" fill="rgba(255,255,255,0.2)" />
    <rect x="206" y="162" width="32" height="4" rx="2" fill="rgba(255,255,255,0.4)" />
    <rect x="206" y="170" width="24" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
    <circle cx="260" cy="120" r="20" fill="rgba(255,255,255,0.3)" />
    <rect x="240" y="142" width="40" height="50" rx="8" fill="rgba(255,255,255,0.25)" />
    <rect x="224" y="152" width="16" height="30" rx="6" fill="rgba(255,255,255,0.2)" />
    <rect x="280" y="152" width="16" height="30" rx="6" fill="rgba(255,255,255,0.2)" />
    <rect x="40" y="100" width="80" height="48" rx="6" fill="rgba(255,255,255,0.2)" />
    <rect x="48" y="110" width="50" height="5" rx="2" fill="rgba(255,255,255,0.5)" />
    <rect x="48" y="120" width="36" height="4" rx="2" fill="rgba(255,255,255,0.35)" />
    <rect x="48" y="130" width="44" height="4" rx="2" fill="rgba(255,255,255,0.35)" />
    <circle cx="92" cy="138" r="6" fill="rgba(255,255,255,0.3)" />
    <rect x="300" y="80" width="64" height="40" rx="6" fill="rgba(255,255,255,0.2)" />
    <rect x="308" y="90" width="36" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
    <rect x="308" y="99" width="28" height="4" rx="2" fill="rgba(255,255,255,0.35)" />
    <circle cx="155" cy="80" r="14" fill="rgba(255,255,255,0.25)" />
    <path d="M148 80l5 5 8-9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Role selector - only shown on register
const RoleToggle = ({ selected, onChange }) => (
  <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 10, padding: 4, gap: 4, marginBottom: 20 }}>
    {[
      { value: 'admin', label: 'Admin' },
      { value: 'member', label: 'Member' },
    ].map(({ value, label }) => {
      const isActive = selected === value;
      return (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          style={{
            flex: 1,
            padding: '9px 0',
            borderRadius: 7,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13.5,
            fontWeight: 600,
            transition: 'all 0.18s ease',
            background: isActive ? 'white' : 'transparent',
            color: isActive ? '#4F6DF5' : '#9CA3AF',
            boxShadow: isActive ? '0 1px 6px rgba(0,0,0,0.10)' : 'none',
          }}>
          {label}
        </button>
      );
    })}
  </div>
);

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState('member');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (role) => {
    setSelectedRole(role);
  };

  const handleTabSwitch = (toLogin) => {
    setIsLogin(toLogin);
    setForm({ name: '', email: '', password: '', confirmPassword: '' });
    setSelectedRole('member');
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // check passwords match on signup
    if (!isLogin && form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);

    try {
      let endpoint = '/auth/login';
      if (!isLogin) {
        endpoint = '/auth/register';
      }

      let payload = {};
      if (isLogin) {
        payload = {
          email: form.email,
          password: form.password,
        };
      } else {
        payload = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: selectedRole,
        };
      }

      console.log('submitting to:', endpoint);

      const { data } = await api.post(endpoint, payload);
      login(data.token, data.user);

      let roleName = 'Member';
      if (data.user.role === 'admin') {
        roleName = 'Admin';
      }

      toast.success(isLogin ? `Welcome back, ${roleName}!` : `Account created! Registered as ${roleName}.`);
      navigate('/dashboard');
    } catch (err) {
      console.log('auth error:', err.response?.data?.message);
      toast.error(err.response?.data?.message || 'Something went wrong. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // button color - always blue on login, role-based on register
  const btnColor = '#4F6DF5';
  const roleLabel = selectedRole === 'admin' ? 'Admin' : 'Member';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>

      {/* Left illustration panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(145deg, #4F6DF5 0%, #3B5BDB 55%, #2541B2 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 40px',
        color: 'white',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 36 }}>
            <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: 'white', letterSpacing: '-0.3px' }}>Team Task Manager</span>
          </div>

          <AuthIllustration />

          <div style={{ marginTop: 28 }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
              {isLogin
                ? 'Enter your credentials to access your workspace.'
                : selectedRole === 'admin'
                  ? 'Admin accounts have full control over projects and team members.'
                  : 'Members can view and update tasks assigned to them.'}
            </p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div className="auth-card fade-in" style={{ maxWidth: 440, width: '100%' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, background: '#4F6DF5', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Team Task Manager</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {isLogin ? 'Login to your account' : 'Fill in the details to sign up'}
            </p>
          </div>

          {/* Role selector - only on register */}
          {!isLogin && (
            <div style={{ marginBottom: 4 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Register as
              </p>
              <RoleToggle selected={selectedRole} onChange={handleRoleChange} />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Name - only on register */}
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" placeholder="Enter your full name"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" type="email" placeholder="Enter your email"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password" style={{ paddingRight: 52 }}
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Confirm password - only on register */}
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
              </div>
            )}

            {/* Submit button */}
            <button type="submit"
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 8,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 700,
                color: 'white',
                background: btnColor,
                marginTop: 4,
                boxShadow: '0 4px 14px rgba(79,109,245,0.35)',
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Login' : `Sign Up as ${roleLabel}`}
            </button>
          </form>

          {/* Switch between login and register */}
          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => handleTabSwitch(!isLogin)}
              style={{ background: 'none', border: 'none', color: '#4F6DF5', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
