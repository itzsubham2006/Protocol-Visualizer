import { useEffect, useCallback } from 'react';

const SPEEDS = [0.5, 1, 2, 4];

export default function PlaybackControls({
  togglePlay,
  stepForward,
  stepBackward,
  replay,
  setSpeed,
  isPlaying,
  playbackSpeed,
  currentStepIndex,
  totalSteps,
  isAtEnd,
  isAtStart,
  hasSteps,
}) {
  const progressPercent = totalSteps > 0
    ? Math.max(0, ((currentStepIndex + 1) / totalSteps) * 100)
    : 0;

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Don't capture if user is typing in an input
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        stepBackward();
        break;
      case 'ArrowRight':
        e.preventDefault();
        stepForward();
        break;
      case 'KeyR':
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          replay();
        }
        break;
      default:
        break;
    }
  }, [togglePlay, stepForward, stepBackward, replay]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!hasSteps) return null;

  return (
    <div className="playback-controls" id="playback-controls">
      {/* Transport buttons */}
      <div className="playback-buttons">
        <button
          className="playback-btn"
          onClick={stepBackward}
          disabled={isAtStart}
          title="Step backward (←)"
          id="btn-step-back"
        >
          ⏮
        </button>

        <button
          className="playback-btn play-btn"
          onClick={togglePlay}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          id="btn-play-pause"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          className="playback-btn"
          onClick={stepForward}
          disabled={isAtEnd}
          title="Step forward (→)"
          id="btn-step-forward"
        >
          ⏭
        </button>

        <button
          className="playback-btn"
          onClick={replay}
          title="Replay (R)"
          id="btn-replay"
        >
          🔄
        </button>
      </div>

      {/* Progress bar */}
      <div className="playback-progress">
        <div className="playback-progress-bar-track">
          <div
            className="playback-progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="playback-step-counter">
          {currentStepIndex + 1} / {totalSteps}
        </span>
      </div>

      {/* Speed selector */}
      <div className="playback-speed">
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
            onClick={() => setSpeed(speed)}
            title={`${speed}x speed`}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
}
