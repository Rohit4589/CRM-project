import React, { useState, useEffect, useRef } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Parallax effect state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const leftPanelRef = useRef(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleMouseMove = (e) => {
    if (!leftPanelRef.current) return;
    const { left, top, width, height } = leftPanelRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 }); // reset smoothly
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      onLogin();
    } else {
      setError('Invalid credentials. Use admin / admin123');
    }
  };

  return (
    <>
      <style>
        {`
          :root {
            --brand-primary: #0F172A;
            --brand-accent: #B47B3B;
            --brand-bg: #F8F9FA;
            --brand-gray: #64748B;
            --brand-border: #E2E8F0;
            --btn-blue: #1D4ED8;
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
            justify-content: space-between;
            padding: 60px 80px;
            color: var(--brand-primary);
            overflow: hidden;
            background-color: #F3F4F6;
          }

          /* The Parallax Background */
          .login-bg {
            position: absolute;
            top: -5%; left: -5%; right: -5%; bottom: -5%; /* slightly larger for parallax bounds */
            background-image: url("https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=2000");
            background-size: cover;
            background-position: center;
            z-index: 0;
            transition: transform 0.2s ease-out;
            will-change: transform;
          }
          
          /* Gradient overlay to make text pop */
          .login-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(105deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,0.1) 100%);
            z-index: 1;
            pointer-events: none;
          }

          .login-left-content {
            position: relative;
            z-index: 2;
            height: 100%;
            display: flex;
            flex-direction: column;
            pointer-events: none; /* Let mouse events pass to container */
          }
          
          /* Interactive elements need pointer-events back */
          .interactive-card {
            pointer-events: auto;
          }

          .login-right {
            flex: 1;
            background-color: #ffffff;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 40px;
            position: relative;
            z-index: 5;
            box-shadow: -20px 0 50px rgba(0,0,0,0.05);
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
          .help-link:hover { color: var(--btn-blue); }

          .feature-cards-container {
            display: flex;
            gap: 15px;
            margin-top: auto;
          }

          .feature-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.9);
            border-radius: 16px;
            padding: 20px 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            flex: 1;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            position: relative;
            overflow: hidden;
          }

          .feature-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%);
            z-index: 0;
            opacity: 0;
            transition: opacity 0.3s;
          }

          .feature-card:hover {
            transform: translateY(-10px) scale(1.05);
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 15px 30px rgba(0,0,0,0.1);
            border-color: var(--brand-accent);
          }
          
          .feature-card:hover::before { opacity: 1; }

          .feature-icon {
            font-size: 26px;
            margin-bottom: 12px;
            transition: transform 0.3s ease;
            position: relative;
            z-index: 1;
          }
          
          .feature-card:hover .feature-icon {
            transform: scale(1.15) rotate(5deg);
          }
          
          .feature-text {
            position: relative;
            z-index: 1;
            font-weight: 700;
            font-size: 13px;
            color: var(--brand-primary);
            transition: color 0.3s;
          }

          .premium-input {
            width: 100%; 
            padding: 12px 14px 12px 45px; 
            border-radius: 8px; 
            border: 1px solid var(--brand-border); 
            outline: none; 
            box-sizing: border-box;
            font-size: 14px; 
            color: var(--brand-primary); 
            transition: all 0.2s ease;
            background-color: #F9FAFB;
          }

          .premium-input:focus {
            border-color: var(--btn-blue);
            background-color: #fff;
            box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
          }
          
          .input-icon {
            position: absolute; 
            left: 16px; 
            top: 50%; 
            transform: translateY(-50%); 
            color: var(--brand-gray);
            font-size: 14px;
            transition: color 0.2s;
          }
          .input-group:focus-within .input-icon { color: var(--btn-blue); }

          .custom-checkbox {
            appearance: none;
            width: 18px;
            height: 18px;
            border: 1px solid var(--brand-border);
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
            background-color: var(--btn-blue);
            border-color: var(--btn-blue);
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
            .feature-cards-container { flex-wrap: wrap; }
            .feature-card { min-width: 45%; }
            .login-left { padding: 40px; }
          }

          @media (max-width: 768px) {
            .login-left { display: none; }
            .login-right { flex: 1; padding: 20px; }
          }
        `}
      </style>
      <div className="login-container">
        
        {/* Left Side (Interactive) */}
        <div 
          className="login-left" 
          ref={leftPanelRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Parallax Background */}
          <div 
            className="login-bg" 
            style={{ 
              transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px) scale(1.05)` 
            }}
          ></div>
          
          {/* Gradient overlay for readability */}
          <div className="login-overlay"></div>

          <div className="login-left-content">
            {/* Top Branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className={isLoaded ? 'animate-fade' : ''}>
              <i className="fa-solid fa-house floating-element" style={{ color: 'var(--brand-accent)', fontSize: '28px' }}></i>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'var(--brand-primary)' }}>Modern Interior</h2>
                <p style={{ fontSize: '9px', letterSpacing: '3px', opacity: 0.7, margin: 0, textTransform: 'uppercase', color: 'var(--brand-primary)', fontWeight: '700' }}>Management System</p>
              </div>
            </div>

            {/* Center Content */}
            <div style={{ marginTop: '100px', maxWidth: '600px', animationDelay: '0.1s' }} className={isLoaded ? 'animate-fade' : ''}>
              <div style={{ fontSize: '12px', letterSpacing: '4px', textTransform: 'uppercase', color: 'var(--brand-accent)', fontWeight: '700', marginBottom: '20px' }}>
                DESIGN · MANAGE · GROW
              </div>
              <h1 style={{ fontSize: '4rem', fontWeight: '800', marginBottom: '24px', lineHeight: '1.1', color: 'var(--brand-primary)', letterSpacing: '-1.5px', textShadow: '0 4px 20px rgba(255,255,255,0.8)' }}>
                Transforming Spaces,<br/>
                <span style={{ color: 'var(--brand-accent)', position: 'relative', display: 'inline-block' }}>
                  Elevating
                  <svg style={{ position: 'absolute', bottom: '-5px', left: 0, width: '100%', height: '8px' }} viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="var(--brand-accent)" strokeWidth="2" fill="transparent" opacity="0.3"/>
                  </svg>
                </span> Lifestyles.
              </h1>
              <p style={{ fontSize: '1.15rem', color: '#334155', lineHeight: '1.7', marginBottom: '40px', maxWidth: '450px', fontWeight: '500' }}>
                Welcome to the Modern Interior Management System.<br/>Access your personalized dashboard to manage<br/>projects, clients, and operations seamlessly.
              </p>
            </div>
            
            {/* Bottom Feature Cards (Interactive) */}
            <div className={`feature-cards-container ${isLoaded ? 'animate-fade' : ''}`} style={{animationDelay: '0.2s'}}>
              <div className="feature-card interactive-card">
                <div className="feature-icon" style={{color: '#B47B3B'}}><i className="fa-solid fa-folder-open"></i></div>
                <div className="feature-text">Project<br/>Management</div>
              </div>
              <div className="feature-card interactive-card">
                <div className="feature-icon" style={{color: '#3B82F6'}}><i className="fa-solid fa-users"></i></div>
                <div className="feature-text">Client<br/>Management</div>
              </div>
              <div className="feature-card interactive-card">
                <div className="feature-icon" style={{color: '#10B981'}}><i className="fa-solid fa-clipboard-check"></i></div>
                <div className="feature-text">Operations<br/>Tracking</div>
              </div>
              <div className="feature-card interactive-card">
                <div className="feature-icon" style={{color: '#8B5CF6'}}><i className="fa-solid fa-chart-column"></i></div>
                <div className="feature-text">Insights &<br/>Reports</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="login-right">
          
          <div className="help-link">
            <i className="fa-solid fa-headset"></i> Need help? <span style={{color: 'var(--brand-primary)', marginLeft: '4px'}}>Contact Support</span>
          </div>

          <div className={isLoaded ? 'animate-fade' : ''} style={{ 
            width: '100%', 
            maxWidth: '400px', 
            background: 'white', 
            borderRadius: '24px', 
            padding: '40px', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.03)',
            animationDelay: '0.1s'
          }}>
            
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '28px', color: 'var(--brand-primary)', fontWeight: '800', marginBottom: '8px' }}>Welcome Back</h2>
              <p style={{ color: 'var(--brand-gray)', fontSize: '14px', lineHeight: '1.5' }}>Please enter your credentials to sign in to your account.</p>
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
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brand-primary)', fontSize: '13px', fontWeight: '600' }}>Email Address</label>
                <div className="input-group" style={{ position: 'relative' }}>
                  <i className="fa-regular fa-user input-icon"></i>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your email"
                    className="premium-input"
                    required 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brand-primary)', fontSize: '13px', fontWeight: '600' }}>Password</label>
                <div className="input-group" style={{ position: 'relative' }}>
                  <i className="fa-solid fa-lock input-icon"></i>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="premium-input"
                    required 
                  />
                  <i 
                    className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} 
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-gray)', cursor: 'pointer', transition: 'color 0.2s', fontSize: '14px' }}
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseOver={(e) => e.target.style.color = 'var(--btn-blue)'}
                    onMouseOut={(e) => e.target.style.color = 'var(--brand-gray)'}
                  ></i>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--brand-primary)', fontSize: '13px', fontWeight: '500' }}>
                  <input type="checkbox" className="custom-checkbox" />
                  Remember me
                </label>
                <a href="#" style={{ color: 'var(--btn-blue)', fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>Forgot password?</a>
              </div>

              <button type="submit" style={{
                width: '100%', 
                height: '48px', 
                background: 'var(--btn-blue)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontSize: '15px', 
                fontWeight: '600', 
                transition: 'all 0.2s ease',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#1e40af'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(29, 78, 216, 0.3)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'var(--btn-blue)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 78, 216, 0.2)'; }}
              >
                Sign In <i className="fa-solid fa-arrow-right" style={{fontSize: '12px'}}></i>
              </button>
            </form>
          </div>
          
          <div className={isLoaded ? 'animate-fade' : ''} style={{ position: 'absolute', bottom: '40px', color: 'var(--brand-gray)', fontSize: '12px', textAlign: 'center', animationDelay: '0.2s' }}>
            © 2026 Modern Interior Management System.<br/>All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
