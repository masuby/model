import React from 'react'
import ReactDOM from 'react-dom/client'

// Global error handler to catch any unhandled errors
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global Error:', { message, source, lineno, colno, error });
  document.getElementById('root').innerHTML = `
    <div style="padding: 40px; font-family: monospace; background: #fee; min-height: 100vh;">
      <h1 style="color: #c00;">JavaScript Error</h1>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>Source:</strong> ${source}</p>
      <p><strong>Line:</strong> ${lineno}:${colno}</p>
      <pre style="background: #fff; padding: 20px; overflow: auto; border: 1px solid #c00;">${error?.stack || 'No stack trace'}</pre>
      <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">Reload</button>
    </div>
  `;
  return true;
};

// Handle unhandled promise rejections
window.onunhandledrejection = function(event) {
  console.error('Unhandled Promise Rejection:', event.reason);
};

// Try to import and render the app
try {
  const { default: App } = await import('./App.jsx');
  await import('./index.css');

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  console.error('App Load Error:', error);
  document.getElementById('root').innerHTML = `
    <div style="padding: 40px; font-family: monospace; background: #fee; min-height: 100vh;">
      <h1 style="color: #c00;">Failed to Load Application</h1>
      <h2>Error: ${error.message}</h2>
      <pre style="background: #fff; padding: 20px; overflow: auto; border: 1px solid #c00;">${error.stack}</pre>
      <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">Reload</button>
    </div>
  `;
}
