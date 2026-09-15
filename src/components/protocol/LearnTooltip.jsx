import { useState, useRef, useEffect } from 'react';

export default function LearnTooltip({ content }) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  if (!content) return null;

  const { protocolInfo, stepInfo } = content;

  return (
    <span className="learn-tooltip-wrapper">
      <button
        ref={triggerRef}
        className="learn-icon"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        title="Learn about this step"
        type="button"
      >
        ℹ️
      </button>

      {isOpen && (
        <div ref={tooltipRef} className="learn-tooltip" onClick={(e) => e.stopPropagation()}>
          {stepInfo && (
            <div className="learn-tooltip-section">
              <div className="learn-tooltip-title">{stepInfo.title}</div>
              <p className="learn-tooltip-text">{stepInfo.description}</p>
            </div>
          )}
          {protocolInfo && (
            <div className="learn-tooltip-section learn-tooltip-proto">
              <p className="learn-tooltip-text">{protocolInfo}</p>
            </div>
          )}
        </div>
      )}
    </span>
  );
}
