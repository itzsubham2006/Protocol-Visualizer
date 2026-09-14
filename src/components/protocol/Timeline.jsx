import { useRef, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';

function formatOffset(ms) {
  if (ms == null) return '0';
  const rounded = Math.round(ms * 10) / 10;
  return rounded.toString();
}

function getStepExtraDetail(step) {
  if (!step) return null;
  // If DNS response, extract IP (+more)
  if (step.protocol === 'DNS' && step.direction?.includes('server→')) {
    const match = step.summary.match(/→\s*([^\s(]+(?:\s*\(\+\d+\s+more\))?)/);
    if (match) return match[1];
  }
  // If TCP
  if (step.protocol === 'TCP') {
    const match = step.summary.match(/->\s*([^\s:]+(?::\d+)?)/) || step.summary.match(/<-\s*([^\s:]+(?::\d+)?)/);
    if (match) return match[1];
  }
  // If TLS
  if (step.protocol === 'TLS') {
    if (step.summary.includes('TLSv1.3')) return 'TLSv1.3';
    if (step.summary.includes('TLSv1.2')) return 'TLSv1.2';
    if (step.summary.includes('SNI:')) {
      const match = step.summary.match(/SNI:\s*([^)]+)/);
      if (match) return match[1];
    }
  }
  // If HTTP
  if (step.protocol === 'HTTP') {
    const statusMatch = step.summary.match(/HTTP\/[0-9.]+\s+(\d+\s+[A-Za-z ]+)/i);
    if (statusMatch) return statusMatch[1].trim();
  }
  // Fallback to keyFields (e.g. IP, Host, Port)
  if (step.keyFields && step.keyFields.length > 0) {
    const found = step.keyFields.find(f =>
      ['ip', 'host', 'server', 'address', 'status'].includes(f.label.toLowerCase())
    );
    if (found) return found.value;
  }
  return null;
}

export default function Timeline({ steps, currentStepIndex, selectedStepId, viewMode = 'flow' }) {
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

  // Classic Row-by-Row List View
  if (viewMode === 'list') {
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
                  +{formatOffset(step.offsetMs)}ms
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

  // Flowchart Node Diagram View (Natural Scrolling)
  return (
    <div className="flow-timeline" ref={timelineRef} id="protocol-timeline">
      {visibleSteps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isSelected = step.id === selectedStepId;
        const protocolClass = step.protocol.toLowerCase();
        const isClient = step.direction.includes('client→');
        const extraDetail = getStepExtraDetail(step);
        const hasNext = index < visibleSteps.length - 1;

        return (
          <div
            key={step.id}
            ref={isActive ? activeStepRef : null}
            className={`flow-step-container ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            {/* Step Row: Oval Node Column + Metadata Column */}
            <div className="flow-step-row">
              {/* Flow Node Column */}
              <div className="flow-node-col">
                {/* Direction text above the oval */}
                <div className={`flow-direction-header ${isClient ? 'client' : 'server'}`}>
                  <span className="flow-direction-text">
                    {isClient ? 'Client → Server' : 'Server → Client'}
                  </span>
                </div>

                {/* The Oval Bubble */}
                <div
                  className={[
                    'flow-node-oval',
                    `protocol-${protocolClass}`,
                    isActive ? 'active' : '',
                    isSelected ? 'selected' : '',
                  ].join(' ')}
                  onClick={() => dispatch({ type: 'SELECT_STEP', stepId: step.id })}
                  role="button"
                  tabIndex={0}
                  aria-label={`${step.protocol} ${step.direction}: ${step.summary}`}
                  title="Click to inspect message details"
                >
                  <span className="flow-node-text">{step.summary}</span>
                </div>
              </div>

              {/* Metadata Column on the right */}
              <div className="flow-meta-col">
                <span className={`flow-meta-protocol ${protocolClass}`}>
                  {step.protocol}
                </span>
                <span className="flow-meta-time">
                  +{formatOffset(step.offsetMs)}ms
                </span>
                {extraDetail && (
                  <span className="flow-meta-detail" title={extraDetail}>
                    {extraDetail}
                  </span>
                )}
                <span className={`flow-meta-badge ${step.status === 'real' ? 'real' : 'simulated'}`}>
                  {step.status === 'real' ? 'REAL' : 'SIM'}
                </span>
              </div>
            </div>

            {/* Downward Arrow pointing to the next node */}
            {hasNext && (
              <div className="flow-connector-row">
                <div className="flow-connector-col">
                  <div className={`flow-arrow-down ${index + 1 === currentStepIndex ? 'incoming' : ''}`}>
                    <svg width="24" height="34" viewBox="0 0 24 34" fill="none">
                      <line
                        x1="12"
                        y1="2"
                        x2="12"
                        y2="22"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <polygon points="5,20 12,32 19,20" fill="currentColor" />
                    </svg>
                  </div>
                </div>
                <div className="flow-connector-spacer" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
