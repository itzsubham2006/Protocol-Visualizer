import { useState, useRef, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { buildStreamingSequence } from '../../protocols/sequenceBuilders';

export default function StreamingPlayer() {
  const [quality, setQuality] = useState('720p');
  const [segmentCount, setSegmentCount] = useState(6);
  const { startActivity, isPlaying, steps, currentStepIndex, dispatch, realTimeEnabled } = useSession();
  const eventSourceRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleStartStream = () => {
    // Close previous stream if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // If Real-Time is disabled, run pure offline simulation
    if (!realTimeEnabled) {
      const seqSteps = buildStreamingSequence(quality, segmentCount).map(s => ({ ...s, status: 'simulated' }));
      startActivity('streaming', seqSteps, `[Offline Simulation] Streaming video at ${quality} (${segmentCount} segments)`);
      return;
    }

    // Real network mode via backend SSE
    try {
      dispatch({ type: 'START_STREAMING_ACTIVITY', activityType: 'streaming' });
      dispatch({ type: 'ADD_LOG', message: `[Real Network] Streaming video at ${quality} (${segmentCount} segments)`, logType: 'streaming' });

      const params = new URLSearchParams({
        quality,
        segments: String(segmentCount),
      });
      const eventSource = new EventSource(`/api/stream/start?${params.toString()}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();
          eventSourceRef.current = null;
          dispatch({ type: 'FINISH_STREAMING' });
          dispatch({ type: 'ADD_LOG', message: 'Streaming session completed (real network)', logType: 'streaming' });
          dispatch({ type: 'ADD_TOAST', message: `Stream complete: ${quality} × ${segmentCount} segments`, icon: '📺', variant: 'success' });
          return;
        }
        try {
          const step = JSON.parse(event.data);
          dispatch({ type: 'APPEND_STEP', step });
        } catch (err) {
          console.error('Failed to parse SSE event:', err);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;
        dispatch({ type: 'FINISH_STREAMING' });
        // Fall back to simulation
        dispatch({ type: 'ADD_LOG', message: 'Backend unavailable — using simulation fallback', logType: 'streaming' });
        const seqSteps = buildStreamingSequence(quality, segmentCount).map(s => ({ ...s, status: 'simulated' }));
        startActivity('streaming', seqSteps, `Streaming video at ${quality} (${segmentCount} segments) (simulated fallback)`);
      };
    } catch {
      // Fall back to simulation
      const seqSteps = buildStreamingSequence(quality, segmentCount).map(s => ({ ...s, status: 'simulated' }));
      startActivity('streaming', seqSteps, `Streaming video at ${quality} (${segmentCount} segments) (simulated fallback)`);
    }
  };

  const totalSegments = segmentCount;
  const segmentSteps = steps.filter(s => s.id && (s.id.includes('-seg-res-') || s.id.includes('segment')));
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
        <span>
          {isPlaying
            ? 'Restart Stream'
            : realTimeEnabled
            ? 'Start Stream (Real HTTP) →'
            : 'Simulate Stream (Offline) →'}
        </span>
      </button>
    </div>
  );
}
