import { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { buildMailSequence } from '../../protocols/sequenceBuilders';

export default function MailForm() {
  const [to, setTo] = useState('u24cse1034@cit.ac.in');
  const [subject, setSubject] = useState('Hello from Protocol Visualizer');
  const [body, setBody] = useState('This is a real email sent over TCP socket with STARTTLS and SMTP protocol flow.\n\nBest regards,\nProtocol Visualizer');
  const [smtpConfig, setSmtpConfig] = useState(null);
  const [targetMode, setTargetMode] = useState('local'); // 'local' or 'live'
  const [resendApiKey, setResendApiKey] = useState('');

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

      const hasDirectApiKey = Boolean(resendApiKey.trim());
      const hasConfiguredApi = smtpConfig && smtpConfig.has_api;
      const isApiDelivery = targetMode === 'live' && (hasDirectApiKey || hasConfiguredApi);
      const isLive = targetMode === 'live' && (isApiDelivery || (smtpConfig && smtpConfig.is_live));
      const targetHost = targetMode === 'local' ? '127.0.0.1' : (smtpConfig?.host || '127.0.0.1');
      const targetPort = targetMode === 'local' ? 2525 : (smtpConfig?.port || 587);
      const targetServer = isApiDelivery ? 'api.resend.com (HTTPS Port 443)' : `${targetHost}:${targetPort}`;

      dispatch({
        type: 'ADD_LOG',
        message: isApiDelivery
          ? `[Real Network] Dispatched live email to ${trimmedTo} via HTTPS Port 443 (Cloud Unblocked)...`
          : isLive
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

      if (isApiDelivery) {
        params.set('delivery_method', 'api');
        if (hasDirectApiKey) {
          params.set('api_key', resendApiKey.trim());
        }
      }

      const eventSource = new EventSource(`/api/mail/send?${params.toString()}`);

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();
          dispatch({ type: 'FINISH_STREAMING' });
          if (isLive) {
            dispatch({
              type: 'ADD_LOG',
              message: `✓ Real email successfully dispatched to ${trimmedTo}! Check recipient inbox.`,
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
          }
        } catch (err) {
          console.error('Failed to parse SSE event:', err);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        dispatch({ type: 'FINISH_STREAMING' });
        dispatch({ type: 'ADD_LOG', message: 'Backend unavailable — using simulation fallback', logType: 'mail' });
        const steps = buildMailSequence({
          to: trimmedTo,
          subject: trimmedSubject,
          body: trimmedBody,
        }).map(s => ({ ...s, status: 'simulated' }));
        startActivity('mail', steps, `Sending email to ${trimmedTo} (simulated fallback)`);
      };
    } catch {
      const steps = buildMailSequence({
        to: trimmedTo,
        subject: trimmedSubject,
        body: trimmedBody,
      }).map(s => ({ ...s, status: 'simulated' }));
      startActivity('mail', steps, `Sending email to ${trimmedTo} (simulated fallback)`);
    }
  };

  const hasDirectApiKey = Boolean(resendApiKey.trim());
  const hasConfiguredApi = smtpConfig && smtpConfig.has_api;
  const isApiDelivery = targetMode === 'live' && (hasDirectApiKey || hasConfiguredApi);
  const isLiveConfigured = (smtpConfig && smtpConfig.is_live) || hasConfiguredApi || hasDirectApiKey;
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
                background: isLive ? '#064e3b33' : '#1e293b55',
                border: `1px solid ${isLive ? '#10b98188' : '#47556988'}`,
                padding: '10px 12px',
                marginBottom: '14px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {isApiDelivery ? (
                <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '7px', height: '7px', background: '#10b981', display: 'inline-block' }}></span>
                  <span>
                    HTTPS CLOUD DELIVERY ACTIVE ({hasDirectApiKey ? 'Custom Resend Key' : smtpConfig.api_provider}). Outbound emails sent over Port 443 — guaranteed to deliver from Railway!
                  </span>
                </div>
              ) : smtpConfig && smtpConfig.is_live ? (
                <div>
                  <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ width: '7px', height: '7px', background: '#10b981', display: 'inline-block' }}></span>
                    <span>
                      LIVE GMAIL RELAY: <b>{smtpConfig.user}</b> ({smtpConfig.host}:{smtpConfig.port})
                    </span>
                  </div>
                  <div style={{ color: '#fbbf24', fontSize: '10px', marginTop: '6px', lineHeight: '1.4' }}>
                    ⚠ Notice: Cloud hosts (Railway free/trial tier) block outbound port 587. To deliver emails from Railway, enter a free Resend API key below or set <code>RESEND_API_KEY</code> in Railway Variables!
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <input
                      type="password"
                      className="form-input"
                      style={{ height: '32px', fontSize: '11px', background: '#0a0a0c' }}
                      placeholder="Enter free Resend API Key (re_...) for guaranteed cloud delivery"
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Deliver real emails to actual inboxes over HTTPS (Port 443) or SMTP:
                  </div>
                  <input
                    type="password"
                    className="form-input"
                    style={{ height: '32px', fontSize: '11px', background: '#0a0a0c' }}
                    placeholder="Enter Resend (re_...) or Brevo (xkeysib-...) API key"
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                  />
                  <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '4px' }}>
                    Free API key available at <a href="https://resend.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>resend.com</a> (recommended) or <a href="https://brevo.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>brevo.com</a>.
                  </div>
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
