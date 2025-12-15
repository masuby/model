import React, { useState } from "react";
import Home from "./pages/Home";
import Module01Landing from "./components/landing/Module01Landing";
import Module02InformRisk from "./components/inform-risk/Module02InformRisk";
import Module03WarningSystem from "./components/warning/Module03WarningSystem";
import Module04Severity from "./components/severity/Module04Severity";
import Module05Climate from "./components/climate/Module05Climate";
import Sidebar from "./components/navigation/Sidebar";
import Dashboard from "./components/dashboard/Dashboard";
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState("dashboard");

  const handleNavigation = (view) => {
    setCurrentView(view);
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigation} />;
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
      <Sidebar currentView={currentView} onNavigate={handleNavigation} />
      <div className="app-main">
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;