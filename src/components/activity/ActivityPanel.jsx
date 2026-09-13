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
    <div className="panel glass-card" id="activity-panel">
      <div className="panel-header">
        <h2>
          <span>📡</span>
          <span>Network Activity</span>
          {activityType && (
            <span className={`protocol-badge ${activityType === 'browsing' ? 'http' : activityType === 'mail' ? 'smtp' : 'streaming'}`}>
              {activityType === 'browsing' ? 'HTTP' : activityType === 'mail' ? 'SMTP' : 'HLS'}
            </span>
          )}
        </h2>
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
