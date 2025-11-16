import React from "react";
import Home from "./pages/Home";
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="app-header" id="app-header">
        <div className="header-left">
          <span className="flag">🇹🇿</span>
          <h1>INFORM TANZANIA</h1>
        </div>
        <div className="header-right">
          <select className="category-select" id="category-select">
            <option value="risk">INFORM RISK</option>
            <option value="warning">INFORM WARNING</option>
            <option value="severity">INFORM SEVERITY</option>
            <option value="climate">INFORM CLIMATE CHANGE</option>
          </select>
        </div>
      </header>
      <Home />
    </div>
  );
}

export default App;