import ActivityPanel from '../activity/ActivityPanel';
import ProtocolPanel from '../protocol/ProtocolPanel';

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout" id="dashboard-layout">
      <ActivityPanel />
      <ProtocolPanel />
    </div>
  );
}
