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
    <div className="panel glass-card" id="protocol-panel">
      <div className="panel-header">
        <h2>
          <span>🔍</span>
          <span>Protocol Inspector</span>
        </h2>
      </div>
      <div className="panel-body">
        {!playback.hasSteps ? (
          <div className="protocol-panel-empty">
            <div className="protocol-panel-empty-icon">📡</div>
            <div className="protocol-panel-empty-title">No Active Session</div>
            <div className="protocol-panel-empty-desc">
              Start a browsing, mail, or streaming activity on the left panel to visualize the protocol messages in real-time.
            </div>
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
