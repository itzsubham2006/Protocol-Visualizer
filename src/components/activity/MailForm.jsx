import { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { buildMailSequence } from '../../protocols/sequenceBuilders';

export default function MailForm() {
  const [to, setTo] = useState('u24cse1034@cit.ac.in');
  const [subject, setSubject] = useState('Hello from Protocol Visualizer');
  const [body, setBody] = useState('This is a real email sent over TCP socket with STARTTLS and SMTP protocol flow.\n\nBest regards,\nProtocol Visualizer');
  const [smtpConfig, setSmtpConfig] = useState(null);
  const [targetMode, setTargetMode] = useState('local'); // 'local' or 'live'

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

    // Real network mode via backend SSE
    try {
      dispatch({ type: 'START_STREAMING_ACTIVITY', activityType: 'mail' });

      const isLive = targetMode === 'live' && smtpConfig && smtpConfig.is_live;
      const targetHost = isLive ? smtpConfig.host : '127.0.0.1';
      const targetPort = isLive ? smtpConfig.port : 2525;
      const targetServer = `${targetHost}:${targetPort}`;

      dispatch({
        type: 'ADD_LOG',
        message: isLive
          ? `[Real Network] Connecting to ${targetServer} via TLS socket to deliver real email...`
          : `[Real Network] Connecting to internal SMTP test server (${targetServer}) via raw TCP socket...`,
        logType: 'mail',
      });

      const params = new URLSearchParams({
        to: trimmedTo,
        subject: trimmedSubject,
        body: trimmedBody,
        smtp_host: targetHost,
        smtp_port: targetPort,
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

  const isLive = targetMode === 'live' && isLiveConfigured;

  return (
    <form onSubmit={handleSubmit} id="mail-form">
      {/* Real-time SMTP Target Selector */}
      {realTimeEnabled && (
        <div className="smtp-target-selector">
          <div className="smtp-target-tabs">
            <button
              type="button"
              className={`smtp-target-tab ${targetMode === 'local' ? 'active' : ''}`}
              onClick={() => setTargetMode('local')}
            >
              Local Test Server (127.0.0.1:2525)
            </button>
            <button
              type="button"
              className={`smtp-target-tab ${targetMode === 'live' ? 'active' : ''}`}
              onClick={() => setTargetMode('live')}
            >
              Live Mail Delivery (Inbox)
            </button>
          </div>

          {targetMode === 'local' ? (
            <div
              style={{
                background: '#064e3b22',
                border: '1px solid #10b98155',
                padding: '8px 12px',
                marginBottom: '14px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#34d399',
              }}
            >
              ✓ Internal RFC 5321 SMTP socket server active on 127.0.0.1:2525. Performs real raw TCP exchange without cloud firewall restrictions.
            </div>
          ) : (
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
                <div>
                  <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ width: '7px', height: '7px', background: '#10b981', display: 'inline-block' }}></span>
                    <span>
                      LIVE INBOX RELAY: <b>{smtpConfig.user}</b> ({smtpConfig.host}:{smtpConfig.port})
                    </span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '10px' }}>
                    Note: Cloud hosts (Railway free/trial tier) block outbound port 587. For live Gmail delivery, run Protocol Visualizer locally.
                  </div>
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
            : isLive
            ? 'Deliver Real Email to Inbox →'
            : 'Send via Real SMTP Socket (127.0.0.1:2525) →'}
        </span>
      </button>
    </form>
  );
}
