import { useRef, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';

export default function Timeline({ steps, currentStepIndex, selectedStepId }) {
  const { dispatch } = useSession();
  const timelineRef = useRef(null);
  const activeStepRef = useRef(null);

  // Auto-scroll to active step
  useEffect(() => {
    if (activeStepRef.current && timelineRef.current) {
      activeStepRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentStepIndex]);

  // Only show steps that have been "revealed" by the playback
  const visibleSteps = steps.filter((_, index) => index <= currentStepIndex);

  if (visibleSteps.length === 0 && currentStepIndex < 0) {
    return (
      <div className="timeline-waiting">
        <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '24px 0' }}>
          ⏳ Waiting for playback to start...
        </p>
      </div>
    );
  }

  return (
    <div className="timeline" ref={timelineRef} id="protocol-timeline">
      {visibleSteps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isSelected = step.id === selectedStepId;
        const protocolClass = step.protocol.toLowerCase();
        const isClient = step.direction.includes('client→');

        return (
          <div
            key={step.id}
            ref={isActive ? activeStepRef : null}
            className={[
              'timeline-step',
              `protocol-${protocolClass}`,
              isActive ? 'active' : '',
              isSelected ? 'selected' : '',
            ].join(' ')}
            style={{ animationDelay: `${index * 30}ms` }}
            onClick={() => dispatch({ type: 'SELECT_STEP', stepId: step.id })}
            role="button"
            tabIndex={0}
            aria-label={`${step.protocol} ${step.direction}: ${step.summary}`}
          >
            <div className="timeline-step-header">
              <span className={`protocol-badge ${protocolClass}`}>
                {step.protocol}
              </span>
              <span className={`direction-arrow ${isClient ? 'client' : 'server'}`}>
                {isClient ? 'Client → Server' : 'Server → Client'}
              </span>
              <span className="step-timing">
                +{step.offsetMs}ms
              </span>
              <span className={`event-source-tag ${step.status === 'real' ? 'real' : 'simulated'}`}>
                {step.status === 'real' ? 'REAL' : 'SIM'}
              </span>
            </div>
            <div className="step-summary">
              {step.summary}
            </div>
          </div>
        );
      })}
    </div>
  );
}
