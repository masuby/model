import "./App.css";

// Full Maintenance Page Component
const MaintenancePage = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    color: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
    padding: '20px',
    textAlign: 'center'
  }}>
    {/* Logo Section */}
    <div style={{ marginBottom: '40px' }}>
      <div style={{
        fontSize: '80px',
        marginBottom: '20px',
        animation: 'float 3s ease-in-out infinite'
      }}>
        🇹🇿
      </div>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: '700',
        marginBottom: '10px',
        background: 'linear-gradient(135deg, #00d4ff, #7b2cbf)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        INFORM Tanzania
      </h1>
      <p style={{
        fontSize: '1.1rem',
        opacity: 0.8,
        letterSpacing: '2px'
      }}>
        Index for Risk Management
      </p>
    </div>

    {/* Maintenance Icon */}
    <div style={{
      fontSize: '100px',
      marginBottom: '30px',
      animation: 'pulse 2s ease-in-out infinite'
    }}>
      🚧
    </div>

    {/* Maintenance Message */}
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '40px 60px',
      maxWidth: '600px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
    }}>
      <h2 style={{
        fontSize: '1.8rem',
        marginBottom: '20px',
        color: '#ff6b35'
      }}>
        System Under Maintenance
      </h2>

      <p style={{
        fontSize: '1.2rem',
        lineHeight: '1.8',
        marginBottom: '30px',
        opacity: 0.9
      }}>
        Sorry, the system is under maintenance till <strong style={{ color: '#00d4ff' }}>02 January 2026</strong>.
        <br />
        Please be patient.
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px',
        padding: '15px 25px',
        background: 'rgba(255, 107, 53, 0.2)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 107, 53, 0.3)'
      }}>
        <span style={{ fontSize: '24px' }}>⏰</span>
        <span style={{ fontSize: '1rem' }}>
          We are working hard to improve your experience
        </span>
      </div>
    </div>

    {/* Footer */}
    <div style={{
      marginTop: '50px',
      opacity: 0.6,
      fontSize: '0.9rem'
    }}>
      <p>Prime Minister's Office - Disaster Management Department</p>
      <p style={{ marginTop: '10px' }}>
        United Republic of Tanzania
      </p>
    </div>

    {/* CSS Animations */}
    <style>{`
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }
    `}</style>
  </div>
);

function App() {
  return <MaintenancePage />;
}

export default App;
