import { useRef, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';

export default function ActivityLog() {
  const { activityLog, dispatch } = useSession();
  const listRef = useRef(null);

  // Auto-scroll to latest entry
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [activityLog.length]);

  return (
    <div className="activity-log" id="activity-log">
      <div className="activity-log-header">
        <span className="activity-log-title">Activity Log</span>
        {activityLog.length > 0 && (
          <button
            className="activity-log-clear"
            onClick={() => dispatch({ type: 'CLEAR_LOG' })}
          >
            Clear
          </button>
        )}
      </div>

      {activityLog.length === 0 ? (
        <p className="activity-log-empty">
          No activity yet. Choose an activity above to begin.
        </p>
      ) : (
        <ul className="activity-log-list" ref={listRef}>
          {activityLog.map((entry) => (
            <li
              key={entry.id}
              className={`log-entry type-${entry.type}`}
            >
              <span className="log-entry-time">{entry.timestamp}</span>
              <span className="log-entry-message">{entry.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
