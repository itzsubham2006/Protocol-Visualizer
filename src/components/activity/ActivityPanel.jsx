import { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import ActivityTabs from './ActivityTabs';
import BrowsingForm from './BrowsingForm';
import MailForm from './MailForm';
import StreamingPlayer from './StreamingPlayer';
import ActivityLog from './ActivityLog';

export default function ActivityPanel() {
  const [activeTab, setActiveTab] = useState('browsing');
  const { activityType } = useSession();

  return (
    <div className="panel" id="activity-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <h2>
          {/* Target Activity Icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="4" stroke="#38bdf8" strokeWidth="2" />
            <line x1="8" y1="2" x2="8" y2="14" stroke="#38bdf8" strokeWidth="1.5" />
          </svg>
          <span>Network Activity</span>
          {activityType && (
            <span className={`protocol-badge ${activityType === 'browsing' ? 'http' : activityType === 'mail' ? 'smtp' : 'streaming'}`}>
              {activityType === 'browsing' ? 'HTTP' : activityType === 'mail' ? 'SMTP' : 'HLS'}
            </span>
          )}
        </h2>
        <span className="panel-header-badge">CONTROL CENTER</span>
      </div>

      <div className="panel-body">
        <ActivityTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'browsing' && <BrowsingForm />}
        {activeTab === 'mail' && <MailForm />}
        {activeTab === 'streaming' && <StreamingPlayer />}

        <ActivityLog />
      </div>
    </div>
  );
}
