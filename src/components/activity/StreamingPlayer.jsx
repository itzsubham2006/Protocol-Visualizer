import { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { buildStreamingSequence } from '../../protocols/sequenceBuilders';

export default function StreamingPlayer() {
  const [quality, setQuality] = useState('720p');
  const [segmentCount, setSegmentCount] = useState(6);
  const { startActivity, isPlaying, steps, currentStepIndex } = useSession();

  const handleStartStream = () => {
    const seqSteps = buildStreamingSequence(quality, segmentCount);
    startActivity('streaming', seqSteps, `Streaming video at ${quality} (${segmentCount} segments)`);
  };

  const totalSegments = segmentCount;
  const segmentSteps = steps.filter(s => s.id && s.id.includes('-seg-res-'));
  const visibleSegments = segmentSteps.filter(
    (_, i) => steps.indexOf(segmentSteps[i]) <= currentStepIndex
  ).length;
  const progress = totalSegments > 0 && steps.length > 0
    ? Math.min((visibleSegments / totalSegments) * 100, 100)
    : 0;

  return (
    <div className="streaming-player" id="streaming-player">
      <div className="form-group">
        <label className="form-label" htmlFor="stream-quality">Stream Quality</label>
        <select
          id="stream-quality"
          className="form-select"
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
        >
          <option value="360p">360p (800 Kbps)</option>
          <option value="720p">720p (2.8 Mbps)</option>
          <option value="1080p">1080p (5.0 Mbps)</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="stream-segments">Segments</label>
        <select
          id="stream-segments"
          className="form-select"
          value={segmentCount}
          onChange={(e) => setSegmentCount(Number(e.target.value))}
        >
          <option value={3}>3 segments (~18s)</option>
          <option value={6}>6 segments (~36s)</option>
          <option value={10}>10 segments (~60s)</option>
        </select>
      </div>

      {steps.length > 0 && (
        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>
          Loaded {visibleSegments} of {totalSegments} segments ({Math.round(progress)}%)
        </div>
      )}

      <button
        type="button"
        className="btn-primary-action"
        id="stream-submit"
        onClick={handleStartStream}
      >
        <span>{isPlaying ? 'Restart Stream' : 'Start Stream →'}</span>
      </button>
    </div>
  );
}
