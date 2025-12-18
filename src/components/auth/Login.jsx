/**
 * LOGIN COMPONENT
 * User authentication interface for INFORM Tanzania Platform
 * Features: Institution-based login, password visibility, remember me, validation
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { INSTITUTIONS, REGIONS } from '../../services/authService';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInstitutionLogin, setShowInstitutionLogin] = useState(false);
  const [showRegionalLogin, setShowRegionalLogin] = useState(false);

  // Validation states
  const [emailError, setEmailError] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '#ccc' });

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('inform_remembered_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Real-time email validation
  const validateEmail = (emailValue) => {
    if (!emailValue) {
      setEmailError('');
      setEmailValid(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const govEmailRegex = /^[^\s@]+@(pmo\.go\.tz|tma\.go\.tz|mow\.go\.tz|moh\.go\.tz|moa\.go\.tz|gst\.go\.tz|[\w]+\.go\.tz)$/i;

    if (!emailRegex.test(emailValue)) {
      setEmailError('Please enter a valid email address');
      setEmailValid(false);
    } else if (showInstitutionLogin && !govEmailRegex.test(emailValue)) {
      setEmailError('Institution login requires a government email (.go.tz)');
      setEmailValid(false);
    } else {
      setEmailError('');
      setEmailValid(true);
    }
  };

  // Password strength checker
  const checkPasswordStrength = (pwd) => {
    if (!pwd) {
      setPasswordStrength({ score: 0, label: '', color: '#ccc' });
      return;
    }

    let score = 0;

    // Length check
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;

    // Character variety
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

    const strengthMap = {
      0: { label: 'Very Weak', color: '#dc3545' },
      1: { label: 'Weak', color: '#dc3545' },
      2: { label: 'Fair', color: '#fd7e14' },
      3: { label: 'Good', color: '#ffc107' },
      4: { label: 'Strong', color: '#28a745' },
      5: { label: 'Very Strong', color: '#20c997' },
      6: { label: 'Excellent', color: '#198754' }
    };

    setPasswordStrength({ score, ...strengthMap[score] });
  };

  // Handle email change with validation
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  // Handle password change with strength check
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    checkPasswordStrength(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email before submitting
    if (!emailValid && email) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate institution selection for institution login
    if (showInstitutionLogin && !institution) {
      setError('Please select your institution');
      return;
    }

    setLoading(true);

    try {
      const result = await login(
        email,
        password,
        rememberMe,
        showInstitutionLogin ? institution : null
      );

      if (result.success) {
        // Save email if remember me is checked
        if (rememberMe) {
          localStorage.setItem('inform_remembered_email', email);
        } else {
          localStorage.removeItem('inform_remembered_email');
        }

        console.log('✅ Login successful, redirecting...');

        // Redirect based on user role/institution
        if (result.user.institution) {
          navigate('/institution-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        {/* Left side - Branding */}
        <div className="auth-branding">
          <div className="auth-branding-content">
            <div className="auth-logo">
              <div className="logo-icon">🇹🇿</div>
              <h1>INFORM Tanzania</h1>
              <p>Index for Risk Management</p>
            </div>

            <div className="auth-features">
              <div className="feature-item">
                <span className="feature-icon">🎓</span>
                <div>
                  <h3>Educational Resources</h3>
                  <p>Learn about disaster risk management</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <div>
                  <h3>Risk Assessment</h3>
                  <p>Analyze and monitor district-level risks</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚠️</span>
                <div>
                  <h3>Early Warning System</h3>
                  <p>Receive and issue timely warnings</p>
                </div>
              </div>
            </div>

            <div className="auth-footer-info">
              <p>Prime Minister's Office</p>
              <p>Disaster Management Department</p>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="auth-form-section">
          <div className="auth-form-container">
            <div className="auth-header">
              <h2>Welcome Back</h2>
              <p>Sign in to access the INFORM Tanzania Platform</p>
            </div>

            {error && (
              <div className="auth-error">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {/* Login Type Toggle */}
            <div style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '20px',
              background: '#F5F5F5',
              borderRadius: '10px',
              padding: '4px'
            }}>
              <button
                type="button"
                onClick={() => { setShowInstitutionLogin(false); setShowRegionalLogin(false); setInstitution(''); setSelectedRegion(''); }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: !showInstitutionLogin && !showRegionalLogin ? 'white' : 'transparent',
                  color: !showInstitutionLogin && !showRegionalLogin ? '#1976D2' : '#666',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: !showInstitutionLogin && !showRegionalLogin ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                PMO Login
              </button>
              <button
                type="button"
                onClick={() => { setShowInstitutionLogin(true); setShowRegionalLogin(false); setSelectedRegion(''); }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: showInstitutionLogin ? 'white' : 'transparent',
                  color: showInstitutionLogin ? '#1976D2' : '#666',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: showInstitutionLogin ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                Institution
              </button>
              <button
                type="button"
                onClick={() => { setShowRegionalLogin(true); setShowInstitutionLogin(false); setInstitution(''); }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: showRegionalLogin ? 'white' : 'transparent',
                  color: showRegionalLogin ? '#1976D2' : '#666',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: showRegionalLogin ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                Regional
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Institution Selection Dropdown */}
              {showInstitutionLogin && (
                <div className="form-group">
                  <label htmlFor="institution">Select Your Institution</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <span className="input-icon">🏢</span>
                    <select
                      id="institution"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '14px 14px 14px 45px',
                        border: '2px solid #E0E0E0',
                        borderRadius: '10px',
                        fontSize: '15px',
                        background: 'white',
                        cursor: 'pointer',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path fill=\'%23666\' d=\'M7 10l5 5 5-5z\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '20px'
                      }}
                    >
                      <option value="">-- Select Institution --</option>
                      {Object.entries(INSTITUTIONS).filter(([key]) => key !== 'PMO_DMD').map(([key, inst]) => (
                        <option key={key} value={key}>
                          {inst.icon} {inst.name} ({inst.shortName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Region Selection Dropdown for Regional Officers */}
              {showRegionalLogin && (
                <div className="form-group">
                  <label htmlFor="region">Select Your Region</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <span className="input-icon">📍</span>
                    <select
                      id="region"
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '14px 14px 14px 45px',
                        border: '2px solid #E0E0E0',
                        borderRadius: '10px',
                        fontSize: '15px',
                        background: 'white',
                        cursor: 'pointer',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path fill=\'%23666\' d=\'M7 10l5 5 5-5z\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '20px'
                      }}
                    >
                      <option value="">-- Select Region --</option>
                      {REGIONS.map(region => (
                        <option key={region} value={region}>
                          {region} Region
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Email Field with Validation */}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <span className="input-icon">✉️</span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder={showInstitutionLogin ? "your.email@institution.go.tz" : "your.email@pmo.go.tz"}
                    required
                    disabled={loading}
                    style={{
                      borderColor: email ? (emailValid ? '#28a745' : emailError ? '#dc3545' : '#E0E0E0') : '#E0E0E0',
                      paddingRight: email ? '45px' : '14px'
                    }}
                  />
                  {/* Validation Indicator */}
                  {email && (
                    <span style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '18px'
                    }}>
                      {emailValid ? '✅' : '❌'}
                    </span>
                  )}
                </div>
                {emailError && (
                  <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', paddingLeft: '4px' }}>
                    {emailError}
                  </div>
                )}
              </div>

              {/* Password Field with Visibility Toggle */}
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <span className="input-icon">🔒</span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    style={{ paddingRight: '45px' }}
                  />
                  {/* Password Visibility Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '4px',
                      opacity: 0.7
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      marginBottom: '4px'
                    }}>
                      {[1, 2, 3, 4, 5, 6].map((level) => (
                        <div
                          key={level}
                          style={{
                            flex: 1,
                            height: '4px',
                            borderRadius: '2px',
                            background: level <= passwordStrength.score ? passwordStrength.color : '#E0E0E0',
                            transition: 'background 0.3s ease'
                          }}
                        />
                      ))}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: passwordStrength.color,
                      fontWeight: '500'
                    }}>
                      Password strength: {passwordStrength.label}
                    </div>
                  </div>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px'
              }}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#1976D2'
                  }}
                />
                <label
                  htmlFor="rememberMe"
                  style={{
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#666',
                    userSelect: 'none'
                  }}
                >
                  Remember me (keeps you signed in)
                </label>
              </div>

              <button
                type="submit"
                className="btn-auth-primary"
                disabled={loading || (email && !emailValid)}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>Sign In</>
                )}
              </button>
            </form>

            <div className="auth-links">
              <a href="/register">Don't have an account? Register</a>
              <a href="/forgot-password">Forgot password?</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
