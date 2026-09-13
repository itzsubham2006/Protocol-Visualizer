import { SessionProvider } from './context/SessionContext';
import DashboardLayout from './components/layout/DashboardLayout';

export default function App() {
  return (
    <SessionProvider>
      <div className="app">
        <header className="app-header">
          <div className="app-logo">
            <div className="app-logo-icon">⚡</div>
            <span className="app-logo-text">Protocol Visualizer</span>
            <span className="app-logo-badge">Live</span>
          </div>
        </header>
        <DashboardLayout />
      </div>
    </SessionProvider>
  );
}
