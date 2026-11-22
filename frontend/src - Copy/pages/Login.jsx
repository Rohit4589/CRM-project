import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config/api';
import modernLogo from '../assets/logo.png';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Invalid username or password');
        setLoading(false);
        return;
      }

      // Success: pass backend user object with role to App.jsx
      onLogin(data.user);
    } catch (err) {
      console.error('Login error:', err);
      setError('Cannot connect to backend server. Make sure backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          :root {
            --brand-primary: #1F1A17;
            --brand-accent: #4A2C17;
            --brand-accent-light: #61391E;
            --brand-bg: #FAF8F5;
            --brand-gray: #7D6C5E;
            --brand-border: #D1C2AF;
            --btn-blue: #4A2C17;
          }
          
          .login-container {
            display: flex;
            min-height: 100vh;
            font-family: 'Inter', sans-serif;
            background-color: var(--brand-bg);
          }

          .login-left {
            flex: 1.3;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 50px 70px;
            color: var(--brand-primary);
            overflow: hidden;
            background-color: #F3EDE6;
          }

          /* Fixed Background */
          .login-bg {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: url("https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=2000");
            background-size: cover;
            background-position: center;
            z-index: 0;
          }
          
          /* Gradient overlay to make text pop */
          .login-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(105deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,0.15) 100%);
            z-index: 1;
            pointer-events: none;
          }

          .login-left-content {
            position: relative;
            z-index: 2;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
          }

          .login-right {
            flex: 1;
            background-color: #FAF8F5;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 40px;
            position: relative;
            z-index: 5;
            box-shadow: -20px 0 50px rgba(74, 44, 23, 0.05);
            border-left: 1px solid #D1C2AF;
          }

          .help-link {
            position: absolute;
            top: 40px;
            right: 40px;
            font-size: 14px;
            color: var(--brand-gray);
            text-decoration: none;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: color 0.2s;
          }
          .help-link:hover { color: var(--brand-accent); }

          .premium-input {
            width: 100%; 
            padding: 12px 14px 12px 45px; 
            border-radius: 8px; 
            border: 1.5px solid #D1C2AF; 
            outline: none; 
            box-sizing: border-box;
            font-size: 14px; 
            color: #1F1A17; 
            transition: all 0.2s ease;
            background-color: #FFFFFF;
          }

          .premium-input:focus {
            border-color: #4A2C17;
            background-color: #fff;
            box-shadow: 0 0 0 3px rgba(74, 44, 23, 0.14);
          }
          
          .input-icon {
            position: absolute; 
            left: 16px; 
            top: 50%; 
            transform: translateY(-50%); 
            color: #8C7B6D;
            font-size: 14px;
            transition: color 0.2s;
          }
          .input-group:focus-within .input-icon { color: #4A2C17; }

          .custom-checkbox {
            appearance: none;
            width: 18px;
            height: 18px;
            border: 1.5px solid #D1C2AF;
            border-radius: 4px;
            background-color: white;
            cursor: pointer;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }
          
          .custom-checkbox:checked {
            background-color: #4A2C17;
            border-color: #4A2C17;
          }
          
          .custom-checkbox:checked::after {
            content: '✓';
            color: white;
            font-size: 12px;
            font-weight: bold;
          }
          
          /* Animations */
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fade {
            animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
          }

          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          
          .floating-element {
            animation: float 6s ease-in-out infinite;
          }

          @media (max-width: 1024px) {
            .login-left { padding: 40px; }
          }

          @media (max-width: 768px) {
            .login-left { display: none; }
            .login-right { flex: 1; padding: 20px; }
          }
        `}
      </style>
      <div className="login-container">
        
        {/* Left Side */}
        <div className="login-left">
          {/* Static Background */}
          <div className="login-bg"></div>
          
          {/* Gradient overlay for readability */}
          <div className="login-overlay"></div>

          <div className="login-left-content">
            {/* Centered Transparent Brand Logo */}
            <div 
              className={isLoaded ? 'animate-fade' : ''} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '100%',
                padding: '20px'
              }}
            >
              <img 
                src={modernLogo} 
                alt="Modern Interior" 
                style={{ 
                  maxWidth: '580px', 
                  width: '90%', 
                  height: 'auto', 
                  display: 'block',
                  filter: 'drop-shadow(0 14px 35px rgba(74, 44, 23, 0.16))'
                }}
                onError={(e) => { e.currentTarget.src = '/logo.png'; }}
              />
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="login-right">
          
          <div className="help-link">
            <i className="fa-solid fa-headset"></i> Need help? <span style={{color: 'var(--brand-accent)', marginLeft: '4px'}}>Contact Support</span>
          </div>

          <div className={isLoaded ? 'animate-fade' : ''} style={{ 
            width: '100%', 
            maxWidth: '400px', 
            background: 'white', 
            borderRadius: '24px', 
            padding: '40px', 
            boxShadow: '0 10px 40px rgba(74, 44, 23, 0.06)',
            border: '1px solid #D1C2AF',
            animationDelay: '0.1s'
          }}>
            
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ marginBottom: '14px' }}>
                <img 
                  src={modernLogo} 
                  alt="Modern Interior" 
                  style={{ height: '40px', width: 'auto', display: 'block', margin: '0 auto' }}
                  onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                />
              </div>
              <h2 style={{ fontSize: '24px', color: '#1F1A17', fontWeight: '800', margin: 0 }}>Welcome Back</h2>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B', 
                padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', 
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#3D2B1F', fontSize: '13px', fontWeight: '600' }}>
                  User ID / Mobile
                </label>
                <div className="input-group" style={{ position: 'relative' }}>
                  <i className="fa-regular fa-id-card input-icon"></i>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter ID or username"
                    className="premium-input"
                    required 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#3D2B1F', fontSize: '13px', fontWeight: '600' }}>
                  Password
                </label>
                <div className="input-group" style={{ position: 'relative' }}>
                  <i className="fa-solid fa-lock input-icon"></i>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="premium-input"
                    required 
                  />
                  <i 
                    className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} 
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#8C7B6D', cursor: 'pointer', transition: 'color 0.2s', fontSize: '14px' }}
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseOver={(e) => e.target.style.color = '#4A2C17'}
                    onMouseOut={(e) => e.target.style.color = '#8C7B6D'}
                  ></i>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#3D2B1F', fontSize: '13px', fontWeight: '500' }}>
                  <input type="checkbox" className="custom-checkbox" defaultChecked />
                  Remember me
                </label>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{
                  width: '100%', 
                  height: '46px', 
                  background: loading ? '#D1C2AF' : '#4A2C17', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px', 
                  fontWeight: '700', 
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(74, 44, 23, 0.25)'
                }}
                onMouseOver={(e) => { 
                  if (!loading) {
                    e.currentTarget.style.background = '#61391E'; 
                    e.currentTarget.style.transform = 'translateY(-1px)'; 
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(74, 44, 23, 0.35)'; 
                  }
                }}
                onMouseOut={(e) => { 
                  if (!loading) {
                    e.currentTarget.style.background = '#4A2C17'; 
                    e.currentTarget.style.transform = 'translateY(0)'; 
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(74, 44, 23, 0.25)'; 
                  }
                }}
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Signing In...
                  </>
                ) : (
                  <>
                    Sign In <i className="fa-solid fa-arrow-right" style={{fontSize: '12px'}}></i>
                  </>
                )}
              </button>

              {/* Quick Demo Login Switcher */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E4D9CC' }}>
                <div style={{ fontSize: '11px', color: '#7D6C5E', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center', letterSpacing: '0.6px' }}>
                  Demo Login
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('admin');
                      setPassword('1234');
                    }}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1C2AF',
                      background: 'rgba(74, 44, 23, 0.05)', color: '#4A2C17', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(74, 44, 23, 0.12)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(74, 44, 23, 0.05)'; }}
                  >
                    <i className="fa-solid fa-user-shield" style={{color: '#4A2C17'}}></i> Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('102');
                      setPassword('9164');
                    }}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1C2AF',
                      background: 'rgba(74, 44, 23, 0.05)', color: '#4A2C17', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(74, 44, 23, 0.12)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(74, 44, 23, 0.05)'; }}
                  >
                    <i className="fa-solid fa-helmet-safety" style={{color: '#4A2C17'}}></i> Worker
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          <div className={isLoaded ? 'animate-fade' : ''} style={{ position: 'absolute', bottom: '30px', color: 'var(--brand-gray)', fontSize: '11.5px', textAlign: 'center', animationDelay: '0.2s' }}>
            © 2026 Modern Interior · All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
