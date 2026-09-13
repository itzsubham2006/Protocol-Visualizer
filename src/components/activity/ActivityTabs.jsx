export default function ActivityTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'browsing', label: 'Browsing' },
    { id: 'mail', label: 'Mail' },
    { id: 'streaming', label: 'Streaming' },
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
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
