import React, { useState, Component } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { DatabaseProvider } from "./contexts/DatabaseContext";
import Login from "./components/auth/Login";
import UserProfile from "./components/auth/UserProfile";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Home from "./pages/Home";
import Module01Landing from "./components/landing/Module01Landing";
import Module02InformRisk from "./components/inform-risk/Module02InformRisk";
import Module03WarningSystem from "./components/warning/Module03WarningSystem";
import Module04Severity from "./components/severity/Module04Severity";
import Module05Climate from "./components/climate/Module05Climate";
import WarningModule from "./pages/WarningModule";
import Sidebar from "./components/navigation/Sidebar";
import Dashboard from "./components/dashboard/Dashboard";
import InstitutionDashboard from "./components/dashboard/InstitutionDashboard";
import CommitteeDashboard from "./components/dashboard/CommitteeDashboard";
import AnalyticsDashboard from "./components/warning/components/AnalyticsDashboard";
import DatabasePanel from "./components/admin/DatabasePanel";
import DataManagementHub from "./components/admin/DataManagementHub";
import LiveDataEntry from "./components/data-entry/LiveDataEntry";
import DataManagementDashboard from "./components/warning/DataManagementDashboard";
import MapsExplorer from "./pages/MapsExplorer";
import IndicatorCatalog from "./pages/IndicatorCatalog";
// HazardRiskDashboard removed - functionality integrated into existing Module02InformRisk and Module03WarningSystem
import {
  USER_ROLES,
  canRoleAccessModule,
  canRoleAccessDataView,
  canRoleAccessTool
} from "./services/authService";
import "./App.css";

// Error Boundary to catch and display runtime errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'monospace', background: '#fee', minHeight: '100vh' }}>
          <h1 style={{ color: '#c00' }}>Something went wrong</h1>
          <h2>Error: {this.state.error?.message || 'Unknown error'}</h2>
          <pre style={{ background: '#fff', padding: '20px', overflow: 'auto', border: '1px solid #c00' }}>
            {this.state.error?.stack}
          </pre>
          <h3>Component Stack:</h3>
          <pre style={{ background: '#fff', padding: '20px', overflow: 'auto', border: '1px solid #c00' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', marginTop: '20px' }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Access Denied Component
function AccessDenied({ message }) {
  return (
    <div style={{
      padding: '60px 20px',
      textAlign: 'center',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔒</div>
      <h2 style={{ color: '#F44336', marginBottom: '15px' }}>Access Denied</h2>
      <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
        {message || 'You do not have permission to access this feature.'}
      </p>
      <p style={{ color: '#888', fontSize: '14px', marginTop: '10px' }}>
        Contact your administrator if you need access to this module.
      </p>
    </div>
  );
}

// Main application component (protected)
function MainApp() {
  const [currentView, setCurrentView] = useState("dashboard");
  const { user } = useAuth();

  // Check if user can access a view
  const canAccess = (view) => {
    if (!user?.role) return false;

    // Modules (including special 'warning' module)
    if (view.startsWith('module') || view === 'warning') {
      return canRoleAccessModule(user.role, view);
    }

    // Data views
    if (['risk', 'severity', 'climate'].includes(view)) {
      return canRoleAccessDataView(user.role, view);
    }

    // Tools (hazard-risk removed - integrated into Module02/Module03)
    if (['analytics', 'database', 'data-entry', 'data-sources'].includes(view)) {
      return canRoleAccessTool(user.role, view);
    }

    // Maps explorer + Indicator catalog are open to anyone who can access modules
    if (view === 'maps' || view === 'indicator-catalog') return true;

    // Always allow dashboard and profile
    return ['dashboard', 'profile'].includes(view);
  };

  const handleNavigation = (view) => {
    // Check access before navigating
    if (!canAccess(view)) {
      console.log(`🚫 Access denied to ${view} for role ${user?.role}`);
      // Still set the view so we can show the access denied message
    }
    setCurrentView(view);
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    // Check access for the current view
    if (!canAccess(currentView)) {
      return <AccessDenied message={`Your role (${user?.role}) does not have access to this module.`} />;
    }

    switch (currentView) {
      case 'dashboard':
        // Committee users see their committee dashboard
        if (user?.role === 'regional_committee' || user?.role === 'ward_committee') {
          return <CommitteeDashboard />;
        }
        return <Dashboard onNavigate={handleNavigation} />;
      case 'profile':
        return <UserProfile />;
      case 'module01':
        return <Module01Landing onComplete={() => handleNavigation("module02")} />;
      case 'module02':
        return <Module02InformRisk onNavigate={handleNavigation} />;
      case 'module03':
        return <Module03WarningSystem onNavigate={handleNavigation} />;
      case 'module04':
        return <Module04Severity activeWarnings={[]} riskData={null} />;
      case 'module05':
        return <Module05Climate riskData={null} />;
      case 'warning':
        return <WarningModule onNavigate={handleNavigation} />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'maps':
        return <MapsExplorer />;
      case 'indicator-catalog':
        return <IndicatorCatalog />;
      case 'database':
        return <DataManagementHub />;
      case 'data-entry':
        return <LiveDataEntry onSubmit={(data) => console.log('Submitted:', data)} />;
      case 'data-sources':
        return <DataManagementDashboard />;
      case 'hazard-risk':
        // Redirect to Module03WarningSystem - Flood/Drought risk integrated there
        return <Module03WarningSystem onNavigate={handleNavigation} />;
      case 'risk':
      case 'severity':
      case 'climate':
        return <Home currentCategory={currentView} onNavigateToModule={handleNavigation} />;
      default:
        return <Dashboard onNavigate={handleNavigation} />;
    }
  };

  return (
    <div className="app">
      <Sidebar currentView={currentView} onNavigate={handleNavigation} user={user} />
      <div className="app-main">
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// Root App component with Router, Auth, and Database
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename="/">
        <DatabaseProvider>
          <LanguageProvider>
            <AuthProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />

                {/* Institution Dashboard - for institution users */}
                <Route
                  path="/institution-dashboard"
                  element={
                    <ProtectedRoute>
                      <InstitutionDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Committee Dashboard - for regional/ward committee users */}
                <Route
                  path="/committee-dashboard"
                  element={
                    <ProtectedRoute>
                      <CommitteeDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected routes */}
                <Route
                  path="/*"
                  element={
                    <MainApp />
                  }
                />

                {/* Default redirect */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </AuthProvider>
          </LanguageProvider>
        </DatabaseProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
