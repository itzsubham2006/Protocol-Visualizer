import { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { buildBrowsingSequence } from '../../protocols/sequenceBuilders';

export default function BrowsingForm() {
  const [url, setUrl] = useState('https://example.com');
  const { startActivity, isPlaying, dispatch, realTimeEnabled } = useSession();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    const trimmedUrl = url.trim();

    // If Real-Time is disabled, run pure offline simulation
    if (!realTimeEnabled) {
      const steps = buildBrowsingSequence(trimmedUrl).map(s => ({ ...s, status: 'simulated' }));
      startActivity('browsing', steps, `[Offline Simulation] Visiting ${trimmedUrl}`);
      return;
    }

    // Real network mode via backend SSE
    try {
      dispatch({ type: 'START_STREAMING_ACTIVITY', activityType: 'browsing' });
      dispatch({ type: 'ADD_LOG', message: `[Real Network] Visiting ${trimmedUrl}`, logType: 'browsing' });

      const encodedUrl = encodeURIComponent(trimmedUrl);
      const eventSource = new EventSource(`/api/browse/stream?url=${encodedUrl}`);

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();
          dispatch({ type: 'FINISH_STREAMING' });
          dispatch({ type: 'ADD_LOG', message: 'Browsing session completed (real network)', logType: 'browsing' });
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
        dispatch({ type: 'FINISH_STREAMING' });
        // Fall back to simulation
        dispatch({ type: 'ADD_LOG', message: 'Backend unavailable — using simulation fallback', logType: 'browsing' });
        const steps = buildBrowsingSequence(trimmedUrl).map(s => ({ ...s, status: 'simulated' }));
        startActivity('browsing', steps, `Visiting ${trimmedUrl} (simulated fallback)`);
      };
    } catch {
      // Fall back to simulation
      const steps = buildBrowsingSequence(trimmedUrl).map(s => ({ ...s, status: 'simulated' }));
      startActivity('browsing', steps, `Visiting ${trimmedUrl} (simulated fallback)`);
    }
  };

  return (
    <form onSubmit={handleSubmit} id="browsing-form">
      <div className="form-group">
        <label className="form-label" htmlFor="browse-url">Target Endpoint URL</label>
        <input
          type="text"
          id="browse-url"
          className="form-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        className="btn-primary-action"
        id="browse-submit"
        disabled={!url.trim()}
      >
        <span>
          {isPlaying
            ? 'Restart Visit'
            : realTimeEnabled
            ? 'Visit Page (Real Network) →'
            : 'Simulate Visit (Offline) →'}
        </span>
      </button>
    </form>
  );
}
