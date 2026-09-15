import { useState, useRef, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { buildBrowsingSequence } from '../../protocols/sequenceBuilders';

export default function BrowsingForm() {
  const [url, setUrl] = useState('https://example.com');
  const { startActivity, isPlaying, dispatch, realTimeEnabled } = useSession();
  const eventSourceRef = useRef(null);

  // Cleanup EventSource on component unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    const trimmedUrl = url.trim();

    // Close any ongoing EventSource before initiating a new one
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // If Real-Time is disabled, run pure offline simulation
    if (!realTimeEnabled) {
      const steps = buildBrowsingSequence(trimmedUrl).map(s => ({ ...s, status: 'simulated' }));
      startActivity('browsing', steps, `[Offline Simulation] Visiting ${trimmedUrl}`);
      return;
    }

    // Real network mode via backend SSE
    dispatch({ type: 'START_STREAMING_ACTIVITY', activityType: 'browsing' });
    dispatch({ type: 'ADD_LOG', message: `[Real Network] Visiting ${trimmedUrl}`, logType: 'browsing' });

    let receivedCount = 0;
    const encodedUrl = encodeURIComponent(trimmedUrl);
    const eventSource = new EventSource(`/api/browse/stream?url=${encodedUrl}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        eventSourceRef.current = null;
        dispatch({ type: 'FINISH_STREAMING' });
        dispatch({ type: 'ADD_LOG', message: 'Browsing session completed (real network)', logType: 'browsing' });
        dispatch({ type: 'ADD_TOAST', message: `Browsing session complete for ${trimmedUrl}`, icon: '✅', variant: 'success' });
        return;
      }
      try {
        const step = JSON.parse(event.data);
        receivedCount++;
        dispatch({ type: 'APPEND_STEP', step });
        // Toast for key events
        if (step.protocol === 'DNS' && step.direction?.includes('server→')) {
          dispatch({ type: 'ADD_TOAST', message: `DNS resolved: ${step.summary.substring(0, 50)}`, icon: '🔍', variant: 'dns' });
        } else if (step.protocol === 'HTTP' && step.summary?.includes('200')) {
          dispatch({ type: 'ADD_TOAST', message: 'HTTP 200 OK received', icon: '🌐', variant: 'http' });
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = async () => {
      eventSource.close();
      eventSourceRef.current = null;
      dispatch({ type: 'FINISH_STREAMING' });

      // If packets were already received from the real backend, DO NOT wipe them out!
      if (receivedCount > 0) {
        return;
      }

      // Only if 0 packets arrived (backend offline / unreachable):
      // Perform live DNS lookup via Google Public DNS (8.8.8.8) directly from browser!
      let parsedHostname = 'example.com';
      try {
        const p = new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);
        parsedHostname = p.hostname || trimmedUrl;
      } catch {
        parsedHostname = trimmedUrl;
      }

      dispatch({
        type: 'ADD_LOG',
        message: `Backend socket unavailable — querying live DNS for ${parsedHostname} via Google DNS (8.8.8.8)...`,
        logType: 'browsing',
      });

      try {
        const dohRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(parsedHostname)}&type=A`);
        const dohData = await dohRes.json();
        const answers = (dohData.Answer || []).filter(a => a.type === 1);
        const realIps = answers.map(a => a.data);
        const resolvedIp = realIps[0];
        const ttl = answers[0]?.TTL || 300;

        if (resolvedIp) {
          dispatch({
            type: 'ADD_LOG',
            message: `✓ Live DNS resolved ${parsedHostname} → ${resolvedIp} (Google DNS 8.8.8.8)`,
            logType: 'browsing',
          });
          const liveSteps = buildBrowsingSequence(trimmedUrl, resolvedIp, realIps, ttl, '8.8.8.8').map(s => ({
            ...s,
            status: 'real',
          }));
          startActivity('browsing', liveSteps, `[Live DNS] Visiting ${trimmedUrl} (${resolvedIp})`);
          return;
        }
      } catch (dohErr) {
        console.warn('DoH fallback failed:', dohErr);
      }

      // Offline fallback only if completely disconnected from internet
      dispatch({ type: 'ADD_LOG', message: 'No network connection — offline synthetic mode', logType: 'browsing' });
      const steps = buildBrowsingSequence(trimmedUrl).map(s => ({ ...s, status: 'simulated' }));
      startActivity('browsing', steps, `Visiting ${trimmedUrl} (offline synthetic)`);
    };
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
