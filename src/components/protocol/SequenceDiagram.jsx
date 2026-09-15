import { useRef, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';

const PROTOCOL_COLORS = {
  DNS: '#38bdf8',
  TCP: '#60a5fa',
  TLS: '#a78bfa',
  HTTP: '#34d399',
  SMTP: '#fbbf24',
  STREAMING: '#c084fc',
};

function formatOffset(ms) {
  if (ms == null) return '0';
  return (Math.round(ms * 10) / 10).toString();
}

export default function SequenceDiagram({ steps, currentStepIndex, selectedStepId }) {
  const { dispatch } = useSession();
  const containerRef = useRef(null);
  const activeRef = useRef(null);

  // Auto-scroll to active step
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStepIndex]);

  const visibleSteps = steps.filter((_, i) => i <= currentStepIndex);

  if (visibleSteps.length === 0 && currentStepIndex < 0) {
    return (
      <div className="seq-waiting">
        <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-subtle)', fontSize: '12px' }}>
          ⏳ Waiting for playback to start...
        </p>
      </div>
    );
  }

  return (
    <div className="seq-diagram" ref={containerRef}>
      {/* Sticky Header: Client and Server Entity Headers */}
      <div className="seq-header-wrapper">
        <div className="seq-gutter-header" />
        <div className="seq-lane-header">
          <div className="seq-entity seq-entity-client">
            <div className="seq-entity-box">CLIENT</div>
          </div>
          <div className="seq-entity-spacer" />
          <div className="seq-entity seq-entity-server">
            <div className="seq-entity-box">SERVER</div>
          </div>
        </div>
      </div>

      {/* Lifeline Canvas & Message Sequence */}
      <div className="seq-body-container">
        {/* Continuous Lifelines */}
        <div className="seq-lifelines-layer">
          <div className="seq-vertical-line seq-client-line" />
          <div className="seq-vertical-line seq-server-line" />
        </div>

        {/* Message Rows */}
        <div className="seq-rows-list">
          {visibleSteps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isSelected = step.id === selectedStepId;
            const isClient = step.direction ? step.direction.includes('client→') : true;
            const color = PROTOCOL_COLORS[step.protocol] || '#94a3b8';
            const protocolClass = (step.protocol || '').toLowerCase();

            return (
              <div
                key={step.id || index}
                ref={isActive ? activeRef : null}
                className={`seq-step-row ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => dispatch({ type: 'SELECT_STEP', stepId: step.id })}
                role="button"
                tabIndex={0}
                title="Click to inspect packet details"
              >
                {/* Left Gutter: Timestamp offset */}
                <div className="seq-time-gutter">
                  <span className="seq-timestamp">+{formatOffset(step.offsetMs)}ms</span>
                </div>

                {/* Message Interaction Area */}
                <div className="seq-interaction-zone">
                  {/* Label Bar: Protocol Badge, Summary Text, REAL/SIM Tag */}
                  <div className={`seq-label-bar ${isClient ? 'dir-to-server' : 'dir-to-client'}`}>
                    <span className={`seq-protocol-tag ${protocolClass}`}>
                      {step.protocol}
                    </span>
                    <span className="seq-summary-text" title={step.summary}>
                      {step.summary}
                    </span>
                    <span className={`seq-source-pill ${step.status === 'real' ? 'real' : 'simulated'}`}>
                      {step.status === 'real' ? 'REAL' : 'SIM'}
                    </span>
                  </div>

                  {/* Horizontal Arrow between Lifelines */}
                  <div className={`seq-arrow-wrapper ${isClient ? 'client-to-server' : 'server-to-client'}`}>
                    {/* Anchor dot on Client lifeline */}
                    <div
                      className="seq-lifeline-anchor client-anchor"
                      style={{ borderColor: color, backgroundColor: isActive ? color : '#18181c' }}
                    />

                    {/* Arrow Shaft & Tip */}
                    <div className="seq-arrow-shaft" style={{ backgroundColor: color }}>
                      <div
                        className={`seq-arrow-tip ${isClient ? 'tip-right' : 'tip-left'}`}
                        style={
                          isClient
                            ? { borderLeftColor: color }
                            : { borderRightColor: color }
                        }
                      />
                    </div>

                    {/* Anchor dot on Server lifeline */}
                    <div
                      className="seq-lifeline-anchor server-anchor"
                      style={{ borderColor: color, backgroundColor: isActive ? color : '#18181c' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
