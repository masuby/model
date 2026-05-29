/**
 * LOGIN COMPONENT
 * User authentication interface for INFORM Tanzania Platform
 * Features: Institution-based login, password visibility, remember me, validation
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { INSTITUTIONS, USER_ROLES } from '../../services/authService';
import { getCommittees } from '../../services/committeeService';
import './Auth.css';

// Login types
const LOGIN_TYPES = {
  PMO: 'pmo',
  INSTITUTION: 'institution',
  REGIONAL_COMMITTEE: 'regional_committee',
  DISTRICT_COMMITTEE: 'district_committee'
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [selectedCommittee, setSelectedCommittee] = useState('');
  const [committees, setCommittees] = useState([]);
  const [committeesLoading, setCommitteesLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState(LOGIN_TYPES.PMO);

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
      // Validate the loaded email so the Sign In button is enabled
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(rememberedEmail)) {
        setEmailValid(true);
      }
    }
  }, []);

  // Load committees when committee login type is selected
  useEffect(() => {
    if (loginType === LOGIN_TYPES.REGIONAL_COMMITTEE || loginType === LOGIN_TYPES.DISTRICT_COMMITTEE) {
      loadCommittees();
    }
  }, [loginType]);

  // Fetch committees from backend
  const loadCommittees = async () => {
    setCommitteesLoading(true);
    try {
      const result = await getCommittees();
      if (result.success && result.data) {
        setCommittees(result.data);
      } else {
        // Fallback to mock committees if API fails
        console.warn('Failed to load committees from API, using fallback');
        setCommittees(getMockCommittees());
      }
    } catch (err) {
      console.error('Error loading committees:', err);
      // Use fallback mock data
      setCommittees(getMockCommittees());
    } finally {
      setCommitteesLoading(false);
    }
  };

  // Mock committees as fallback - includes both regional and district/ward committees
  const getMockCommittees = () => [
    // Regional Committees (26 regions)
    { id: 1, name: 'Dodoma Regional Disaster Committee', type: 'regional', adm1_code: 'TZ01', adm1_name: 'Dodoma' },
    { id: 2, name: 'Arusha Regional Disaster Committee', type: 'regional', adm1_code: 'TZ02', adm1_name: 'Arusha' },
    { id: 3, name: 'Kilimanjaro Regional Disaster Committee', type: 'regional', adm1_code: 'TZ03', adm1_name: 'Kilimanjaro' },
    { id: 4, name: 'Tanga Regional Disaster Committee', type: 'regional', adm1_code: 'TZ04', adm1_name: 'Tanga' },
    { id: 5, name: 'Morogoro Regional Disaster Committee', type: 'regional', adm1_code: 'TZ05', adm1_name: 'Morogoro' },
    { id: 6, name: 'Pwani Regional Disaster Committee', type: 'regional', adm1_code: 'TZ06', adm1_name: 'Pwani' },
    { id: 7, name: 'Dar es Salaam Regional Disaster Committee', type: 'regional', adm1_code: 'TZ07', adm1_name: 'Dar es Salaam' },
    { id: 8, name: 'Lindi Regional Disaster Committee', type: 'regional', adm1_code: 'TZ08', adm1_name: 'Lindi' },
    { id: 9, name: 'Mtwara Regional Disaster Committee', type: 'regional', adm1_code: 'TZ09', adm1_name: 'Mtwara' },
    { id: 10, name: 'Ruvuma Regional Disaster Committee', type: 'regional', adm1_code: 'TZ10', adm1_name: 'Ruvuma' },
    { id: 11, name: 'Iringa Regional Disaster Committee', type: 'regional', adm1_code: 'TZ11', adm1_name: 'Iringa' },
    { id: 12, name: 'Mbeya Regional Disaster Committee', type: 'regional', adm1_code: 'TZ12', adm1_name: 'Mbeya' },
    { id: 13, name: 'Singida Regional Disaster Committee', type: 'regional', adm1_code: 'TZ13', adm1_name: 'Singida' },
    { id: 14, name: 'Tabora Regional Disaster Committee', type: 'regional', adm1_code: 'TZ14', adm1_name: 'Tabora' },
    { id: 15, name: 'Rukwa Regional Disaster Committee', type: 'regional', adm1_code: 'TZ15', adm1_name: 'Rukwa' },
    { id: 16, name: 'Kigoma Regional Disaster Committee', type: 'regional', adm1_code: 'TZ16', adm1_name: 'Kigoma' },
    { id: 17, name: 'Shinyanga Regional Disaster Committee', type: 'regional', adm1_code: 'TZ17', adm1_name: 'Shinyanga' },
    { id: 18, name: 'Kagera Regional Disaster Committee', type: 'regional', adm1_code: 'TZ18', adm1_name: 'Kagera' },
    { id: 19, name: 'Mwanza Regional Disaster Committee', type: 'regional', adm1_code: 'TZ19', adm1_name: 'Mwanza' },
    { id: 20, name: 'Mara Regional Disaster Committee', type: 'regional', adm1_code: 'TZ20', adm1_name: 'Mara' },
    { id: 21, name: 'Manyara Regional Disaster Committee', type: 'regional', adm1_code: 'TZ21', adm1_name: 'Manyara' },
    { id: 22, name: 'Njombe Regional Disaster Committee', type: 'regional', adm1_code: 'TZ22', adm1_name: 'Njombe' },
    { id: 23, name: 'Katavi Regional Disaster Committee', type: 'regional', adm1_code: 'TZ23', adm1_name: 'Katavi' },
    { id: 24, name: 'Simiyu Regional Disaster Committee', type: 'regional', adm1_code: 'TZ24', adm1_name: 'Simiyu' },
    { id: 25, name: 'Geita Regional Disaster Committee', type: 'regional', adm1_code: 'TZ25', adm1_name: 'Geita' },
    { id: 26, name: 'Songwe Regional Disaster Committee', type: 'regional', adm1_code: 'TZ26', adm1_name: 'Songwe' },
    // District/Ward Committees (sample - multiple per region)
    { id: 101, name: 'Dodoma Urban District Committee', type: 'ward', adm1_code: 'TZ01', adm1_name: 'Dodoma', adm2_code: 'TZ0101', adm2_name: 'Dodoma Urban' },
    { id: 102, name: 'Kondoa District Committee', type: 'ward', adm1_code: 'TZ01', adm1_name: 'Dodoma', adm2_code: 'TZ0102', adm2_name: 'Kondoa' },
    { id: 103, name: 'Chamwino District Committee', type: 'ward', adm1_code: 'TZ01', adm1_name: 'Dodoma', adm2_code: 'TZ0103', adm2_name: 'Chamwino' },
    { id: 104, name: 'Bahi District Committee', type: 'ward', adm1_code: 'TZ01', adm1_name: 'Dodoma', adm2_code: 'TZ0104', adm2_name: 'Bahi' },
    { id: 201, name: 'Arusha City District Committee', type: 'ward', adm1_code: 'TZ02', adm1_name: 'Arusha', adm2_code: 'TZ0201', adm2_name: 'Arusha City' },
    { id: 202, name: 'Arumeru District Committee', type: 'ward', adm1_code: 'TZ02', adm1_name: 'Arusha', adm2_code: 'TZ0202', adm2_name: 'Arumeru' },
    { id: 203, name: 'Karatu District Committee', type: 'ward', adm1_code: 'TZ02', adm1_name: 'Arusha', adm2_code: 'TZ0203', adm2_name: 'Karatu' },
    { id: 204, name: 'Monduli District Committee', type: 'ward', adm1_code: 'TZ02', adm1_name: 'Arusha', adm2_code: 'TZ0204', adm2_name: 'Monduli' },
    { id: 301, name: 'Moshi Urban District Committee', type: 'ward', adm1_code: 'TZ03', adm1_name: 'Kilimanjaro', adm2_code: 'TZ0301', adm2_name: 'Moshi Urban' },
    { id: 302, name: 'Moshi Rural District Committee', type: 'ward', adm1_code: 'TZ03', adm1_name: 'Kilimanjaro', adm2_code: 'TZ0302', adm2_name: 'Moshi Rural' },
    { id: 303, name: 'Hai District Committee', type: 'ward', adm1_code: 'TZ03', adm1_name: 'Kilimanjaro', adm2_code: 'TZ0303', adm2_name: 'Hai' },
    { id: 304, name: 'Rombo District Committee', type: 'ward', adm1_code: 'TZ03', adm1_name: 'Kilimanjaro', adm2_code: 'TZ0304', adm2_name: 'Rombo' },
    { id: 701, name: 'Ilala District Committee', type: 'ward', adm1_code: 'TZ07', adm1_name: 'Dar es Salaam', adm2_code: 'TZ0701', adm2_name: 'Ilala' },
    { id: 702, name: 'Kinondoni District Committee', type: 'ward', adm1_code: 'TZ07', adm1_name: 'Dar es Salaam', adm2_code: 'TZ0702', adm2_name: 'Kinondoni' },
    { id: 703, name: 'Temeke District Committee', type: 'ward', adm1_code: 'TZ07', adm1_name: 'Dar es Salaam', adm2_code: 'TZ0703', adm2_name: 'Temeke' },
    { id: 704, name: 'Ubungo District Committee', type: 'ward', adm1_code: 'TZ07', adm1_name: 'Dar es Salaam', adm2_code: 'TZ0704', adm2_name: 'Ubungo' },
    { id: 705, name: 'Kigamboni District Committee', type: 'ward', adm1_code: 'TZ07', adm1_name: 'Dar es Salaam', adm2_code: 'TZ0705', adm2_name: 'Kigamboni' },
    { id: 1201, name: 'Mbeya City District Committee', type: 'ward', adm1_code: 'TZ12', adm1_name: 'Mbeya', adm2_code: 'TZ1201', adm2_name: 'Mbeya City' },
    { id: 1202, name: 'Mbeya Rural District Committee', type: 'ward', adm1_code: 'TZ12', adm1_name: 'Mbeya', adm2_code: 'TZ1202', adm2_name: 'Mbeya Rural' },
    { id: 1203, name: 'Rungwe District Committee', type: 'ward', adm1_code: 'TZ12', adm1_name: 'Mbeya', adm2_code: 'TZ1203', adm2_name: 'Rungwe' },
    { id: 1901, name: 'Mwanza City District Committee', type: 'ward', adm1_code: 'TZ19', adm1_name: 'Mwanza', adm2_code: 'TZ1901', adm2_name: 'Mwanza City' },
    { id: 1902, name: 'Ilemela District Committee', type: 'ward', adm1_code: 'TZ19', adm1_name: 'Mwanza', adm2_code: 'TZ1902', adm2_name: 'Ilemela' },
    { id: 1903, name: 'Nyamagana District Committee', type: 'ward', adm1_code: 'TZ19', adm1_name: 'Mwanza', adm2_code: 'TZ1903', adm2_name: 'Nyamagana' },
  ];

  // Filter committees based on login type
  const getFilteredCommittees = () => {
    if (loginType === LOGIN_TYPES.REGIONAL_COMMITTEE) {
      return committees.filter(c => c.type === 'regional');
    } else if (loginType === LOGIN_TYPES.DISTRICT_COMMITTEE) {
      return committees.filter(c => c.type === 'ward' || c.type === 'district');
    }
    return committees;
  };

  // Real-time email validation
  const validateEmail = (emailValue) => {
    if (!emailValue) {
      setEmailError('');
      setEmailValid(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailValue)) {
      setEmailError('Please enter a valid email address');
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

    // Validate selection based on login type
    if (loginType === LOGIN_TYPES.INSTITUTION && !institution) {
      setError('Please select your institution');
      return;
    }

    if ((loginType === LOGIN_TYPES.REGIONAL_COMMITTEE || loginType === LOGIN_TYPES.DISTRICT_COMMITTEE) && !selectedCommittee) {
      setError('Please select your committee');
      return;
    }

    setLoading(true);

    try {
      const loginOptions = {
        loginType,
        institution: loginType === LOGIN_TYPES.INSTITUTION ? institution : null,
        committee: (loginType === LOGIN_TYPES.REGIONAL_COMMITTEE || loginType === LOGIN_TYPES.DISTRICT_COMMITTEE) ? selectedCommittee : null
      };

      const result = await login(
        email,
        password,
        rememberMe,
        loginOptions.institution,
        loginOptions
      );

      if (result.success) {
        // Save email if remember me is checked
        if (rememberMe) {
          localStorage.setItem('inform_remembered_email', email);
        } else {
          localStorage.removeItem('inform_remembered_email');
        }

        console.log('✅ Login successful, redirecting based on role...');

        // Role-based navigation
        const userRole = result.user?.role;
        let redirectPath = '/dashboard'; // Default for ADMIN and PMO

        if (userRole === USER_ROLES.REGIONAL_COMMITTEE || userRole === USER_ROLES.WARD_COMMITTEE) {
          // Committee users go to main app with sidebar navigation
          redirectPath = '/dashboard';
        } else if (userRole === USER_ROLES.INSTITUTION_USER) {
          // Institution users go to institution dashboard
          redirectPath = '/institution-dashboard';
        } else if (userRole === USER_ROLES.REGIONAL_OFFICER) {
          // Regional officers go to main dashboard with limited access
          redirectPath = '/dashboard';
        }
        // ADMIN and PMO_OFFICER go to main dashboard (default)

        console.log(`🔀 Redirecting ${userRole} to ${redirectPath}`);
        navigate(redirectPath);
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
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => { setLoginType(LOGIN_TYPES.PMO); setInstitution(''); setSelectedCommittee(''); }}
                style={{
                  padding: '12px 8px',
                  border: loginType === LOGIN_TYPES.PMO ? '2px solid #1976D2' : '2px solid #E0E0E0',
                  borderRadius: '10px',
                  background: loginType === LOGIN_TYPES.PMO ? '#E3F2FD' : 'white',
                  color: loginType === LOGIN_TYPES.PMO ? '#1976D2' : '#666',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '18px' }}>🏛️</span>
                PMO Admin
              </button>
              <button
                type="button"
                onClick={() => { setLoginType(LOGIN_TYPES.INSTITUTION); setSelectedCommittee(''); }}
                style={{
                  padding: '12px 8px',
                  border: loginType === LOGIN_TYPES.INSTITUTION ? '2px solid #1976D2' : '2px solid #E0E0E0',
                  borderRadius: '10px',
                  background: loginType === LOGIN_TYPES.INSTITUTION ? '#E3F2FD' : 'white',
                  color: loginType === LOGIN_TYPES.INSTITUTION ? '#1976D2' : '#666',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '18px' }}>🏢</span>
                Institution
              </button>
              <button
                type="button"
                onClick={() => { setLoginType(LOGIN_TYPES.REGIONAL_COMMITTEE); setInstitution(''); setSelectedCommittee(''); }}
                style={{
                  padding: '12px 8px',
                  border: loginType === LOGIN_TYPES.REGIONAL_COMMITTEE ? '2px solid #1976D2' : '2px solid #E0E0E0',
                  borderRadius: '10px',
                  background: loginType === LOGIN_TYPES.REGIONAL_COMMITTEE ? '#E3F2FD' : 'white',
                  color: loginType === LOGIN_TYPES.REGIONAL_COMMITTEE ? '#1976D2' : '#666',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '18px' }}>🏛️</span>
                Regional Committee
              </button>
              <button
                type="button"
                onClick={() => { setLoginType(LOGIN_TYPES.DISTRICT_COMMITTEE); setInstitution(''); setSelectedCommittee(''); }}
                style={{
                  padding: '12px 8px',
                  border: loginType === LOGIN_TYPES.DISTRICT_COMMITTEE ? '2px solid #1976D2' : '2px solid #E0E0E0',
                  borderRadius: '10px',
                  background: loginType === LOGIN_TYPES.DISTRICT_COMMITTEE ? '#E3F2FD' : 'white',
                  color: loginType === LOGIN_TYPES.DISTRICT_COMMITTEE ? '#1976D2' : '#666',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '18px' }}>🏘️</span>
                District Committee
              </button>
            </div>

            {/* Login Type Description */}
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '16px',
              padding: '8px 12px',
              background: '#F5F7FA',
              borderRadius: '8px',
              borderLeft: '3px solid #1976D2'
            }}>
              {loginType === LOGIN_TYPES.PMO && 'PMO Disaster Management Department administrators with full system access.'}
              {loginType === LOGIN_TYPES.INSTITUTION && 'Government institutions (TMA, MoW, MoH, etc.) for data submission.'}
              {loginType === LOGIN_TYPES.REGIONAL_COMMITTEE && 'Regional Disaster Management Committees (26 regions of Tanzania).'}
              {loginType === LOGIN_TYPES.DISTRICT_COMMITTEE && 'District/Ward Disaster Management Committees at local level.'}
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Institution Selection Dropdown */}
              {loginType === LOGIN_TYPES.INSTITUTION && (
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

              {/* Committee Selection Dropdown - for Regional or District Committees */}
              {(loginType === LOGIN_TYPES.REGIONAL_COMMITTEE || loginType === LOGIN_TYPES.DISTRICT_COMMITTEE) && (
                <div className="form-group">
                  <label htmlFor="committee">
                    {loginType === LOGIN_TYPES.REGIONAL_COMMITTEE ? 'Select Your Regional Committee' : 'Select Your District Committee'}
                  </label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <span className="input-icon">{loginType === LOGIN_TYPES.REGIONAL_COMMITTEE ? '🏛️' : '🏘️'}</span>
                    <select
                      id="committee"
                      value={selectedCommittee}
                      onChange={(e) => setSelectedCommittee(e.target.value)}
                      disabled={loading || committeesLoading}
                      style={{
                        width: '100%',
                        padding: '14px 14px 14px 45px',
                        border: '2px solid #E0E0E0',
                        borderRadius: '10px',
                        fontSize: '14px',
                        background: 'white',
                        cursor: committeesLoading ? 'wait' : 'pointer',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path fill=\'%23666\' d=\'M7 10l5 5 5-5z\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '20px'
                      }}
                    >
                      <option value="">
                        {committeesLoading
                          ? 'Loading committees...'
                          : loginType === LOGIN_TYPES.REGIONAL_COMMITTEE
                            ? '-- Select Regional Committee --'
                            : '-- Select District Committee --'
                        }
                      </option>
                      {getFilteredCommittees().map(committee => (
                        <option key={committee.id} value={committee.id}>
                          {committee.adm2_name
                            ? `${committee.adm1_name} → ${committee.adm2_name}`
                            : committee.adm1_name
                          } - {committee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {loginType === LOGIN_TYPES.REGIONAL_COMMITTEE
                      ? `${getFilteredCommittees().length} Regional Committees available`
                      : `${getFilteredCommittees().length} District/Ward Committees available`
                    }
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
                    placeholder={loginType === LOGIN_TYPES.INSTITUTION ? "your.email@institution.go.tz" : (loginType === LOGIN_TYPES.REGIONAL_COMMITTEE || loginType === LOGIN_TYPES.DISTRICT_COMMITTEE) ? "your.email@committee.go.tz" : "your.email@pmo.go.tz"}
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
