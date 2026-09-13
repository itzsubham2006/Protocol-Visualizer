import { useState, useEffect } from 'react';
import { SessionProvider, useSession } from './context/SessionContext';
import DashboardLayout from './components/layout/DashboardLayout';

function AppContent() {
  const { dispatch, isRealNetwork, realTimeEnabled } = useSession();
  const [statusText, setStatusText] = useState('Checking backend...');

  useEffect(() => {
    // Check if FastAPI backend is available
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        dispatch({ type: 'SET_REAL_NETWORK', value: true });
        if (realTimeEnabled) {
          setStatusText('Live network requests, DNS resolution, TCP sockets & real email');
        }
      })
      .catch(() => {
        dispatch({ type: 'SET_REAL_NETWORK', value: false });
        if (realTimeEnabled) {
          setStatusText('Backend offline (Run: python -m backend.main) — using fallback');
        }
      });
  }, [dispatch, realTimeEnabled]);

  const handleToggleRealTime = (e) => {
    const isChecked = e.target.checked;
    dispatch({ type: 'SET_REAL_TIME_MODE', value: isChecked });
    if (!isChecked) {
      setStatusText('Offline simulation mode — generating synthetic protocol sequences');
    } else {
      setStatusText(
        isRealNetwork
          ? 'Live network requests, DNS resolution, TCP sockets & real email'
          : 'Backend offline (Run: python -m backend.main) — using fallback'
      );
    }
  };

  const isActuallyReal = realTimeEnabled && isRealNetwork;

  return (
    <div className="app">
      {/* TOP NAVBAR */}
      <header className="app-header">
        <div className="app-logo">
          {/* Logo Icon with SVG lightning path */}
          <div className="app-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="app-logo-text">Protocol Visualizer</span>

          {/* Real-Time Network Toggle Switch */}
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
                ? 'SIMULATION MODE (OFFLINE)'
                : isRealNetwork
                ? 'REAL-TIME NETWORK MODE'
                : 'REAL-TIME (BACKEND OFFLINE)'}
            </span>
          </div>
        </div>

        <div className="app-nav-right">
          <div className="app-status-text">
            {statusText}
          </div>
        </div>
      </header>

      {/* MAIN DASHBOARD */}
      <DashboardLayout />
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
