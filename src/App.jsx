import React, { Component } from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import Module01Landing from "./components/landing/Module01Landing";
import Module02InformRisk from "./components/inform-risk/Module02InformRisk";
import Module04Severity from "./components/severity/Module04Severity";
import "./App.css";
import "./lean.css";

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
    console.error("App Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", fontFamily: "monospace", background: "#fee", minHeight: "100vh" }}>
          <h1 style={{ color: "#c00" }}>Something went wrong</h1>
          <h2>Error: {this.state.error?.message || "Unknown error"}</h2>
          <pre style={{ background: "#fff", padding: "20px", overflow: "auto", border: "1px solid #c00" }}>
            {this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", marginTop: "20px" }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lean top navigation — exactly three modules, public, no login.
function TopNav() {
  const link = ({ isActive }) => ({
    padding: "10px 18px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: 600,
    color: isActive ? "#fff" : "#1f3a5f",
    background: isActive ? "#1f6feb" : "transparent",
  });
  return (
    <header className="lean-topbar">
      <div className="lean-brand">INFORM Tanzania</div>
      <nav className="lean-nav">
        <NavLink to="/education" style={link}>Education</NavLink>
        <NavLink to="/risk" style={link}>Risk</NavLink>
        <NavLink to="/severity" style={link}>Severity</NavLink>
      </nav>
    </header>
  );
}

function EducationRoute() {
  const navigate = useNavigate();
  return <Module01Landing onComplete={() => navigate("/risk")} />;
}

function RiskRoute() {
  // onNavigate is a no-op in the lean app (cross-module links archived)
  return <Module02InformRisk onNavigate={() => {}} />;
}

function SeverityRoute() {
  return <Module04Severity />;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename="/">
        <LanguageProvider>
          <div className="lean-app">
            <TopNav />
            <main className="lean-content">
              <Routes>
                <Route path="/education" element={<EducationRoute />} />
                <Route path="/risk" element={<RiskRoute />} />
                <Route path="/severity" element={<SeverityRoute />} />
                <Route path="/" element={<Navigate to="/education" replace />} />
                <Route path="*" element={<Navigate to="/education" replace />} />
              </Routes>
            </main>
          </div>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
