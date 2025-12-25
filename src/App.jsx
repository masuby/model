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
import Sidebar from "./components/navigation/Sidebar";
import Dashboard from "./components/dashboard/Dashboard";
import InstitutionDashboard from "./components/dashboard/InstitutionDashboard";
import AnalyticsDashboard from "./components/warning/components/AnalyticsDashboard";
import DatabasePanel from "./components/admin/DatabasePanel";
import DataManagementHub from "./components/admin/DataManagementHub";
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

// Main application component (protected)
function MainApp() {
  const [currentView, setCurrentView] = useState("dashboard");
  const { user } = useAuth();

  const handleNavigation = (view) => {
    setCurrentView(view);
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigation} />;
      case 'profile':
        return <UserProfile />;
      case 'module01':
        return <Module01Landing onComplete={() => handleNavigation("module02")} />;
      case 'module02':
        return <Module02InformRisk onNavigate={handleNavigation} />;
      case 'module03':
        return (
          <ProtectedRoute requiredPermission="canIssueWarnings">
            <Module03WarningSystem onNavigate={handleNavigation} />
          </ProtectedRoute>
        );
      case 'module04':
        return <Module04Severity activeWarnings={[]} riskData={null} />;
      case 'module05':
        return <Module05Climate riskData={null} />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'database':
        return <DataManagementHub />;
      case 'risk':
      case 'warning':
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
      <BrowserRouter>
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

                {/* Protected routes */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <MainApp />
                    </ProtectedRoute>
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
