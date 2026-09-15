import { useState, useEffect } from 'react';
import { SessionProvider, useSession } from './context/SessionContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Footer from './components/layout/Footer';
import ToastContainer from './components/layout/ToastContainer';

function AppContent() {
  const { dispatch, isRealNetwork, realTimeEnabled, learnMode } = useSession();
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    // Check if FastAPI backend is available
    fetch('/api/status')
      .then(res => res.json())
      .then(() => {
        dispatch({ type: 'SET_REAL_NETWORK', value: true });
        setStatusText('');
      })
      .catch(() => {
        dispatch({ type: 'SET_REAL_NETWORK', value: false });
        if (realTimeEnabled) {
          setStatusText('Backend offline (Run: python -m backend.main) — using fallback');
        } else {
          setStatusText('');
        }
      });
  }, [dispatch, realTimeEnabled]);

  const handleToggleRealTime = (e) => {
    const isChecked = e.target.checked;
    dispatch({ type: 'SET_REAL_TIME_MODE', value: isChecked });
    if (!isChecked) {
      setStatusText('');
    } else {
      setStatusText(
        isRealNetwork
          ? ''
          : 'Backend offline (Run: python -m backend.main) — using fallback'
      );
    }
  };

  const isActuallyReal = realTimeEnabled && isRealNetwork;

  return (
    <div className="app">
      {/* TOP NAVBAR */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            <div className="app-logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="app-logo-text">Protocol Visualizer</span>
          </div>

          {/* Real-Time Network Toggle Switch & Badge (Centered on Large Screens) */}
          <div className="navbar-center-section">
            <div className="navbar-toggle-container" title="Toggle between Real-Time Network operations and Offline Simulation">
              <span className="navbar-toggle-label">Real-Time</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={realTimeEnabled}
                  onChange={handleToggleRealTime}
                  id="realtime-mode-toggle"
                />
                <span className="slider round"></span>
              </label>
            </div>

            {/* Network Mode Badge */}
            <div className="app-network-badge">
              <span className={`app-network-dot ${isActuallyReal ? 'real' : 'simulated'}`}></span>
              <span className={`app-network-text ${isActuallyReal ? 'real' : 'simulated'}`}>
                {!realTimeEnabled
                  ? 'SIMULATION'
                  : isRealNetwork
                  ? 'REAL-TIME'
                  : 'OFFLINE'}
              </span>
            </div>

            {/* Learn Mode Toggle */}
            <button
              className={`learn-mode-toggle ${learnMode ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_LEARN_MODE' })}
              title="Toggle Learn Mode — show educational tooltips on protocol steps"
              type="button"
            >
              <span className="learn-mode-icon">🎓</span>
              <span className="learn-mode-label">Learn</span>
            </button>
          </div>

          <div className="app-header-right">
            {statusText ? (
              <div className="app-status-text" title={statusText}>
                {statusText}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* MAIN DASHBOARD */}
      <DashboardLayout />

      {/* FOOTER */}
      <Footer />

      {/* TOAST NOTIFICATIONS */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}
