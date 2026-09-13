export default function ActivityTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'browsing', icon: '🌐', label: 'Browsing' },
    { id: 'mail', icon: '✉️', label: 'Mail' },
    { id: 'streaming', icon: '📺', label: 'Streaming' },
  ];

  return (
    <div className="activity-tabs" role="tablist" id="activity-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          id={`tab-${tab.id}`}
          className={`activity-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="activity-tab-icon">{tab.icon}</span>
          <span className="activity-tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
