import { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { buildStreamingSequence } from '../../protocols/sequenceBuilders';

export default function StreamingPlayer() {
  const [quality, setQuality] = useState('720p');
  const [segmentCount, setSegmentCount] = useState(6);
  const { startActivity, isPlaying, steps, currentStepIndex } = useSession();

  const handleStartStream = () => {
    const seqSteps = buildStreamingSequence(quality, segmentCount);
    startActivity('streaming', seqSteps, `📺 Streaming video at ${quality} (${segmentCount} segments)`);
  };

  // Calculate progress for the mock player
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
      {/* Mock video area */}
      <div className="streaming-video-area">
        <div className="streaming-video-icon">📺</div>
        {isPlaying && steps.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
          }}>
            <div className="streaming-progress">
              <div
                className="streaming-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quality selector */}
      <div className="streaming-quality">
        <label className="form-label" htmlFor="stream-quality">Quality</label>
        <select
          id="stream-quality"
          className="form-select"
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="360p">360p (800 Kbps)</option>
          <option value="720p">720p (2.8 Mbps)</option>
          <option value="1080p">1080p (5.0 Mbps)</option>
        </select>
      </div>

      {/* Segment count */}
      <div className="streaming-quality">
        <label className="form-label" htmlFor="stream-segments">Segments</label>
        <select
          id="stream-segments"
          className="form-select"
          value={segmentCount}
          onChange={(e) => setSegmentCount(Number(e.target.value))}
          style={{ flex: 1 }}
        >
          <option value={3}>3 segments (~18s)</option>
          <option value={6}>6 segments (~36s)</option>
          <option value={10}>10 segments (~60s)</option>
        </select>
      </div>

      {/* Segment info */}
      {steps.length > 0 && (
        <div className="streaming-segment-info">
          Segment {visibleSegments} / {totalSegments} loaded
        </div>
      )}

      <button
        type="button"
        className="btn btn-stream btn-full"
        id="stream-submit"
        onClick={handleStartStream}
      >
        <span>▶</span>
        <span>{isPlaying ? 'Restart Stream' : 'Start Stream'}</span>
      </button>
    </div>
  );
}
