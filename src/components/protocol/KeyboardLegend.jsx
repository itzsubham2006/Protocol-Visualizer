import { useEffect } from 'react';

const SHORTCUTS = [
  { key: 'Space', action: 'Play / Pause' },
  { key: '←', action: 'Step backward' },
  { key: '→', action: 'Step forward' },
  { key: 'R', action: 'Replay from start' },
  { key: '?', action: 'Toggle this legend' },
];

export default function KeyboardLegend({ isOpen, onClose }) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="keyboard-legend-overlay" onClick={onClose}>
      <div className="keyboard-legend" onClick={(e) => e.stopPropagation()}>
        <div className="keyboard-legend-header">
          <span className="keyboard-legend-title">Keyboard Shortcuts</span>
          <button className="keyboard-legend-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="keyboard-legend-body">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="keyboard-legend-row">
              <kbd className="keyboard-key">{s.key}</kbd>
              <span className="keyboard-action">{s.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
