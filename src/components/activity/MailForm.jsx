import { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { buildMailSequence } from '../../protocols/sequenceBuilders';

export default function MailForm() {
  const [to, setTo] = useState('u24cse1034@cit.ac.in');
  const [subject, setSubject] = useState('Hello from Protocol Visualizer');
  const [body, setBody] = useState('This is a real email sent over TCP socket with STARTTLS and SMTP protocol flow.\n\nBest regards,\nProtocol Visualizer');
  const [smtpConfig, setSmtpConfig] = useState(null);

  const { startActivity, isPlaying, dispatch, realTimeEnabled, isRealNetwork } = useSession();

  // Check backend .env configuration
  useEffect(() => {
    if (realTimeEnabled && isRealNetwork) {
      fetch('/api/mail/config')
        .then(res => res.json())
        .then(data => setSmtpConfig(data))
        .catch(() => setSmtpConfig(null));
    }
  }, [realTimeEnabled, isRealNetwork]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim()) return;
    const trimmedTo = to.trim();
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();

    // If Real-Time is disabled, run pure offline simulation
    if (!realTimeEnabled) {
      const steps = buildMailSequence({
        to: trimmedTo,
        subject: trimmedSubject,
        body: trimmedBody,
      }).map(s => ({ ...s, status: 'simulated' }));
      startActivity('mail', steps, `[Offline Simulation] Sending email to ${trimmedTo}`);
      return;
    }

    // Real network mode via backend SSE (credentials read from .env)
    try {
      dispatch({ type: 'START_STREAMING_ACTIVITY', activityType: 'mail' });

      const isLive = smtpConfig && smtpConfig.is_live;
      const targetServer = isLive ? `${smtpConfig.host}:${smtpConfig.port}` : '127.0.0.1:2525';

      dispatch({
        type: 'ADD_LOG',
        message: isLive
          ? `[Real Network] Connecting to ${targetServer} via TLS socket to deliver real email...`
          : `[Real Network] Connecting to local SMTP test server (${targetServer}) via raw TCP socket...`,
        logType: 'mail',
      });

      const params = new URLSearchParams({
        to: trimmedTo,
        subject: trimmedSubject,
        body: trimmedBody,
      });

      const eventSource = new EventSource(`/api/mail/send?${params.toString()}`);

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();
          dispatch({ type: 'FINISH_STREAMING' });
          if (isLive) {
            dispatch({
              type: 'ADD_LOG',
              message: `✓ Real email successfully dispatched to ${trimmedTo} via ${smtpConfig.host}! Check recipient inbox.`,
              logType: 'mail',
            });
          } else {
            dispatch({
              type: 'ADD_LOG',
              message: 'SMTP conversation completed with local test server (127.0.0.1:2525)',
              logType: 'mail',
            });
          }
          return;
        }

        try {
          const step = JSON.parse(event.data);
          dispatch({ type: 'APPEND_STEP', step });

          // Check if this is a connection error event
          if (step.summary && step.summary.includes('Cannot connect')) {
            dispatch({ type: 'ADD_LOG', message: `Cannot connect to SMTP server at ${targetServer}`, logType: 'mail' });
            if (!isLive) {
              dispatch({ type: 'ADD_LOG', message: 'To start local server: python backend/smtp_server.py', logType: 'mail' });
            }
          }
        } catch (err) {
          console.error('Failed to parse SSE event:', err);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        dispatch({ type: 'FINISH_STREAMING' });
        // Fall back to simulation
        dispatch({ type: 'ADD_LOG', message: 'Backend unavailable — using simulation fallback', logType: 'mail' });
        const steps = buildMailSequence({
          to: trimmedTo,
          subject: trimmedSubject,
          body: trimmedBody,
        }).map(s => ({ ...s, status: 'simulated' }));
        startActivity('mail', steps, `Sending email to ${trimmedTo} (simulated fallback)`);
      };
    } catch {
      // Fall back to simulation
      const steps = buildMailSequence({
        to: trimmedTo,
        subject: trimmedSubject,
        body: trimmedBody,
      }).map(s => ({ ...s, status: 'simulated' }));
      startActivity('mail', steps, `Sending email to ${trimmedTo} (simulated fallback)`);
    }
  };

  const isLiveConfigured = smtpConfig && smtpConfig.is_live;

  return (
    <form onSubmit={handleSubmit} id="mail-form">
      {/* Real-time SMTP Status Indicator */}
      {realTimeEnabled && (
        <div
          style={{
            background: isLiveConfigured ? '#064e3b33' : '#1e293b55',
            border: `1px solid ${isLiveConfigured ? '#10b98188' : '#47556988'}`,
            padding: '8px 12px',
            marginBottom: '14px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {isLiveConfigured ? (
            <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', background: '#10b981', display: 'inline-block' }}></span>
              <span>
                LIVE INBOX DELIVERY ACTIVE: <b>{smtpConfig.user}</b> ({smtpConfig.host}:{smtpConfig.port})
              </span>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>
              <span>Using Local Server (127.0.0.1:2525).</span>{' '}
              <span style={{ color: 'var(--accent-cyan)' }}>
                Set SMTP_USER & SMTP_PASS in <code>.env</code> to deliver to real inboxes.
              </span>
            </div>
          )}
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="mail-to">Recipient Address</label>
        <input
          type="email"
          id="mail-to"
          className="form-input"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="recipient@example.com"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="mail-subject">Subject</label>
        <input
          type="text"
          id="mail-subject"
          className="form-input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="mail-body">Message Body</label>
        <textarea
          id="mail-body"
          className="form-textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          rows={3}
        />
      </div>

      <button
        type="submit"
        className="btn-primary-action"
        id="mail-submit"
        disabled={!to.trim() || !subject.trim()}
      >
        <span>
          {isPlaying
            ? 'Restart Send'
            : !realTimeEnabled
            ? 'Simulate Email (Offline) →'
            : isLiveConfigured
            ? 'Deliver Real Email to Inbox →'
            : 'Send via Local SMTP Socket →'}
        </span>
      </button>
    </form>
  );
}
