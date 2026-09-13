import { useSession } from '../../context/SessionContext';
import { usePlayback } from '../../hooks/usePlayback';
import PlaybackControls from './PlaybackControls';
import Timeline from './Timeline';
import MessageCard from './MessageCard';

export default function ProtocolPanel() {
  const { steps, currentStepIndex, selectedStepId } = useSession();
  const playback = usePlayback();

  const selectedStep = selectedStepId
    ? steps.find(s => s.id === selectedStepId)
    : null;

  return (
    <div className="panel" id="protocol-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <h2>
          {/* Search / Inspector Icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="#38bdf8" strokeWidth="1.8" />
            <line x1="10" y1="10" x2="14" y2="14" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span>Protocol Inspector</span>
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: playback.isPlaying ? '#38bdf8' : '#64748b',
            }}
          />
          <span className="panel-header-badge">
            {playback.isPlaying ? 'ACTIVE' : playback.hasSteps ? 'PAUSED' : 'IDLE'}
          </span>
        </div>
      </div>

      <div className="panel-body">
        {!playback.hasSteps ? (
          <div className="protocol-panel-empty">
            <div className="empty-radar-wrap">
              <div className="empty-radar-glow"></div>
              <div className="empty-radar-card">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M10 22 A 12 12 0 0 1 22 10"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 26 A 18 18 0 0 1 26 6"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeOpacity="0.5"
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="22" r="3" fill="#38bdf8" />
                </svg>
              </div>
            </div>

            <h3 className="protocol-empty-title">No Active Session</h3>
            <p className="protocol-empty-desc">
              Start a browsing, mail, or streaming activity on the left panel to visualize the protocol messages in real-time.
            </p>
          </div>
        ) : (
          <>
            <PlaybackControls {...playback} />

            {selectedStep && (
              <MessageCard step={selectedStep} />
            )}

            <Timeline
              steps={steps}
              currentStepIndex={currentStepIndex}
              selectedStepId={selectedStepId}
            />
          </>
        )}
      </div>
    </div>
  );
}
