import { useState } from 'react';

export default function MessageCard({ step }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const protocolClass = step.protocol.toLowerCase();

  return (
    <div className="message-card" id={`message-card-${step.id}`}>
      <div
        className="message-card-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="message-card-title">
          <span className={`protocol-badge ${protocolClass}`}>
            {step.protocol}
          </span>
          <span>{step.summary}</span>
          <span className={`event-source-badge ${step.status === 'real' ? 'real' : 'simulated'}`}>
            {step.status === 'real' ? 'REAL NETWORK EVENT' : 'SIMULATED EVENT'}
          </span>
        </div>
        <span className={`message-card-toggle ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>

      {isExpanded && (
        <div className="message-card-body">
          {/* Key fields as colored chips */}
          {step.keyFields && step.keyFields.length > 0 && (
            <div className="message-card-fields">
              {step.keyFields.map((field, i) => (
                <span key={i} className={`field-chip ${protocolClass}`}>
                  <span className="field-chip-label">{field.label}:</span>
                  <span className="field-chip-value">{field.value}</span>
                </span>
              ))}
            </div>
          )}

          {/* Raw protocol message */}
          <div className="message-raw">
            {step.raw}
          </div>
        </div>
      )}
    </div>
  );
}
