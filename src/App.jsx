import { SessionProvider } from './context/SessionContext';
import DashboardLayout from './components/layout/DashboardLayout';

export default function App() {
  return (
    <SessionProvider>
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
            
            {/* Live Badge */}
            <div className="app-live-badge">
              <span className="app-live-dot"></span>
              <span className="app-live-text">LIVE</span>
            </div>
          </div>

          <div className="app-nav-right">
            <div className="app-tls-badge">
              TLS 1.3 Active
            </div>
          </div>
        </header>

        {/* MAIN DASHBOARD */}
        <DashboardLayout />
      </div>
    </SessionProvider>
  );
}
