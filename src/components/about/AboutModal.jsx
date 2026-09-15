import { useState, useEffect } from 'react';

const TABS = [
  { id: 'overview', label: ' Overview', title: 'System Overview & Architecture' },
  { id: 'running', label: ' How to Run', title: 'Setup & Execution Guide' },
  { id: 'browsing', label: ' HTTP & Browsing', title: 'DNS, TCP, TLS & HTTP Protocols' },
  { id: 'mail', label: ' SMTP & Mail', title: 'SMTP Socket & Cloud Mail Delivery' },
  { id: 'streaming', label: ' HLS Streaming', title: 'Adaptive Video Streaming & TS Chunks' },
  { id: 'features', label: ' Controls & Views', title: 'Inspector Views & Interactive Controls' },
];

export default function AboutModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedCmd, setCopiedCmd] = useState(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="about-modal-overlay" onClick={onClose}>
      <div className="about-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="about-modal-header">
          <div className="about-header-title-area">
            <div className="about-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <h2 className="about-header-title">Protocol Visualizer</h2>
              <p className="about-header-subtitle">Architecture, Execution Guide & Networking Reference</p>
            </div>
          </div>
          <button className="about-close-btn" onClick={onClose} title="Close Guide (Esc)">
            ✕
          </button>
        </div>

        {/* Modal Layout: Sidebar Navigation + Content Body */}
        <div className="about-modal-layout">
          {/* Navigation Sidebar */}
          <nav className="about-sidebar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`about-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Content Area */}
          <div className="about-content-area">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="about-tab-panel">
                <h3 className="about-section-heading">What is Protocol Visualizer?</h3>
                <p className="about-text">
                  <strong>Protocol Visualizer</strong> is an interactive dual-panel network protocol inspection dashboard.
                  It bridges the gap between theoretical network diagrams and actual packet exchanges by letting you trigger real network actions
                  and inspecting their underlying communication step-by-step.
                </p>

                <div className="about-callout info">
                  <div className="callout-icon">💡</div>
                  <div className="callout-content">
                    <strong>Dual-Engine Architecture:</strong> The application supports both <strong>Real Network Mode</strong> (live OS sockets, DNS queries, TLS handshakes, HTTP exchanges via Python FastAPI) and <strong>Simulation Mode</strong> (zero-dependency offline synthetic models).
                  </div>
                </div>

                <h4 className="about-subheading">System Architecture</h4>
                <div className="about-diagram-box">
                  <pre className="about-diagram">
{`Browser (React 19 + Vite, Port 5173)
  ├── LEFT PANEL:  Activity Center (Browsing, Mail, Streaming controls + Activity Log)
  └── RIGHT PANEL: Protocol Inspector (Flowchart, Sequence Diagram, Timeline, Message Inspector)
         ↕ (Server-Sent Events / SSE at /api/...)
FastAPI Backend (Python 3.10+, Port 8000)
  ├── /api/browse/stream  ── Real DNS (dnspython) + Real TCP/TLS/HTTP (httpx)
  ├── /api/mail/send     ── Real raw TCP socket (RFC 5321) or HTTPS cloud relay
  ├── /api/stream/start  ── Real HLS Master playlist, Variant playlists & MPEG-TS chunks
  └── /api/stream/media/ ── Binary video segment distributor
         ↕
Local SMTP Test Server (Python AsyncIO, Port 2525)
  └── Safe internal RFC 5321 socket server — logs all commands, sends real replies`}
                  </pre>
                </div>

                <h4 className="about-subheading">Core Highlights</h4>
                <ul className="about-list">
                  <li><strong>Authentic Transparency:</strong> Every event is explicitly labeled with <code>REAL NETWORK EVENT</code> or <code>SIMULATED EVENT</code>.</li>
                  <li><strong>Multi-Protocol Coverage:</strong> Visualizes DNS (UDP 53), TCP (Layer 4 3-way handshake), TLS 1.3 (Encryption & certificates), HTTP/1.1 (GET/POST methods), SMTP (RFC 5321 commands), and HLS (Adaptive video streaming).</li>
                  <li><strong>Three Inspector Views:</strong> Seamlessly switch between the animated <strong>Flowchart</strong>, classic <strong>Sequence Diagram</strong> (Client ↔ Server swim-lanes), and high-density <strong>Rows Table</strong>.</li>
                </ul>
              </div>
            )}

            {/* HOW TO RUN TAB */}
            {activeTab === 'running' && (
              <div className="about-tab-panel">
                <h3 className="about-section-heading">How to Run Locally</h3>
                <p className="about-text">
                  Follow these instructions to run the entire dual-mode stack on your local machine:
                </p>

                <div className="about-step-card">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4 className="step-title">Install Backend Dependencies</h4>
                    <p className="step-desc">Requires Python 3.10 or higher:</p>
                    <div className="code-snippet-box">
                      <code>pip install -r requirements.txt</code>
                      <button
                        className="copy-btn"
                        onClick={() => handleCopy('pip install -r requirements.txt', 'pip')}
                      >
                        {copiedCmd === 'pip' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="about-step-card">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4 className="step-title">Install Frontend Dependencies</h4>
                    <p className="step-desc">Requires Node.js 18+ and npm 9+:</p>
                    <div className="code-snippet-box">
                      <code>npm install</code>
                      <button
                        className="copy-btn"
                        onClick={() => handleCopy('npm install', 'npm')}
                      >
                        {copiedCmd === 'npm' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="about-step-card">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4 className="step-title">Start the Services</h4>
                    <p className="step-desc">Open three terminal windows:</p>

                    <div className="terminal-subgroup">
                      <span className="terminal-label">Terminal 1 — Local SMTP Server (Port 2525)</span>
                      <div className="code-snippet-box">
                        <code>python backend/smtp_server.py</code>
                        <button
                          className="copy-btn"
                          onClick={() => handleCopy('python backend/smtp_server.py', 'term1')}
                        >
                          {copiedCmd === 'term1' ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="terminal-subgroup">
                      <span className="terminal-label">Terminal 2 — FastAPI Backend Server (Port 8000)</span>
                      <div className="code-snippet-box">
                        <code>python -m backend.main</code>
                        <button
                          className="copy-btn"
                          onClick={() => handleCopy('python -m backend.main', 'term2')}
                        >
                          {copiedCmd === 'term2' ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="terminal-subgroup">
                      <span className="terminal-label">Terminal 3 — Vite Frontend Server (Port 5173)</span>
                      <div className="code-snippet-box">
                        <code>npm run dev</code>
                        <button
                          className="copy-btn"
                          onClick={() => handleCopy('npm run dev', 'term3')}
                        >
                          {copiedCmd === 'term3' ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="about-callout tip">
                  <div className="callout-icon">💡</div>
                  <div className="callout-content">
                    Open <code>http://localhost:5173</code> in your browser. The top navbar badge will illuminate green as <strong>REAL-TIME</strong>. If the backend is stopped, it gracefully drops back to <strong>SIMULATION</strong>.
                  </div>
                </div>
              </div>
            )}

            {/* BROWSING & HTTP TAB */}
            {activeTab === 'browsing' && (
              <div className="about-tab-panel">
                <h3 className="about-section-heading">🌐 Browsing: DNS, TCP, TLS & HTTP</h3>
                <p className="about-text">
                  The Browsing module demonstrates the exact sequence that takes place every time your web browser opens a web address.
                </p>

                <h4 className="about-subheading">How to Test Browsing</h4>
                <ol className="about-ordered-list">
                  <li>Click the <strong>Browsing</strong> tab on the Left Activity Panel.</li>
                  <li>Enter any target URL (e.g. <code>https://example.com</code> or <code>https://httpbin.org/get</code>).</li>
                  <li>Click <strong>Visit Page →</strong>.</li>
                  <li>Watch the Right Panel stream each phase in real time!</li>
                </ol>

                <h4 className="about-subheading">The 5-Step Web Connection Pipeline</h4>
                <div className="protocol-breakdown-table">
                  <div className="breakdown-row">
                    <span className="breakdown-badge dns">1. DNS</span>
                    <div className="breakdown-desc">
                      <strong>Domain Resolution (UDP 53):</strong> Resolves the human-readable domain name (e.g. <code>example.com</code>) to an IPv4/IPv6 address via <code>dnspython</code> or Google Public DNS (8.8.8.8). Displays query transaction ID, record type (A/AAAA), and TTL.
                    </div>
                  </div>

                  <div className="breakdown-row">
                    <span className="breakdown-badge tcp">2. TCP</span>
                    <div className="breakdown-desc">
                      <strong>TCP 3-Way Handshake (Layer 4):</strong> Connects client and server using reliable stream protocol:
                      <br />• <code>SYN</code> (Synchronize request from client)
                      <br />• <code>SYN, ACK</code> (Server acknowledgment & sync reply)
                      <br />• <code>ACK</code> (Client final connection established)
                    </div>
                  </div>

                  <div className="breakdown-row">
                    <span className="breakdown-badge tls">3. TLS</span>
                    <div className="breakdown-desc">
                      <strong>TLS 1.3 Handshake (Security Layer):</strong> Encrypts the channel using Server Name Indication (SNI), cipher suite negotiation (e.g., <code>TLS_AES_256_GCM_SHA384</code>), and server certificate verification.
                    </div>
                  </div>

                  <div className="breakdown-row">
                    <span className="breakdown-badge http">4. HTTP Req</span>
                    <div className="breakdown-desc">
                      <strong>HTTP Request (Layer 7):</strong> Dispatches HTTP methods (<code>GET</code>, <code>POST</code>) with Host, User-Agent, and Accept headers over the encrypted connection.
                    </div>
                  </div>

                  <div className="breakdown-row">
                    <span className="breakdown-badge http">5. HTTP Res</span>
                    <div className="breakdown-desc">
                      <strong>HTTP Response:</strong> Receives status code (<code>200 OK</code>, <code>301 Redirect</code>, <code>404 Not Found</code>), response headers (Content-Type, Cache-Control), and payload preview.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SMTP & MAIL TAB */}
            {activeTab === 'mail' && (
              <div className="about-tab-panel">
                <h3 className="about-section-heading"> SMTP: Simple Mail Transfer Protocol</h3>
                <p className="about-text">
                  SMTP is a stateful text-based conversation protocol established over raw TCP sockets under RFC 5321.
                </p>

                <h4 className="about-subheading">How to Test Mail</h4>
                <ol className="about-ordered-list">
                  <li>Select the <strong>Mail</strong> tab on the Left Activity Panel.</li>
                  <li>Choose your target:
                    <br />• <strong>Local Test Server (127.0.0.1:2525)</strong>: Runs a safe internal RFC 5321 test server that logs commands without delivering externally.
                    <br />• <strong>Live Mail Delivery (Inbox)</strong>: Delivers real emails to actual recipient inboxes via authenticated TLS or HTTPS cloud API (Resend/Brevo).
                  </li>
                  <li>Enter recipient email, subject line, and body message.</li>
                  <li>Click <strong>Send Email →</strong> and follow the socket dialogue in the inspector.</li>
                </ol>

                <h4 className="about-subheading">SMTP State Machine (RFC 5321)</h4>
                <div className="about-code-block">
                  <pre>
{`S: 220 mail.protocol-visualizer.local ESMTP Service Ready
C: EHLO client.local
S: 250-mail.protocol-visualizer.local offers:
S: 250-SIZE 35882577
S: 250-STARTTLS
S: 250 OK
C: MAIL FROM:<sender@protocol-visualizer.local>
S: 250 2.1.0 Sender OK
C: RCPT TO:<user@example.com>
S: 250 2.1.5 Recipient OK
C: DATA
S: 354 Start mail input; end with <CRLF>.<CRLF>
C: Subject: Hello from Protocol Visualizer
C: Date: Tue, 15 Sep 2026 ...
C: 
C: This is the email body payload.
C: .
S: 250 2.0.0 OK: queued as pv_938104
C: QUIT
S: 221 2.0.0 Service closing transmission channel`}
                  </pre>
                </div>
              </div>
            )}

            {/* STREAMING & HLS TAB */}
            {activeTab === 'streaming' && (
              <div className="about-tab-panel">
                <h3 className="about-section-heading"> HLS: HTTP Live Streaming</h3>
                <p className="about-text">
                  HTTP Live Streaming (HLS) is the industry standard adaptive bitrate video streaming protocol developed by Apple.
                  Instead of downloading one giant video file, videos are sliced into short 2–6 second segments indexed by M3U8 playlists.
                </p>

                <h4 className="about-subheading">How to Start Stream</h4>
                <ol className="about-ordered-list">
                  <li>Click on the <strong>Streaming</strong> tab on the Left Panel.</li>
                  <li>Select desired <strong>Stream Quality</strong>:
                    <br />• <code>360p</code> (800 Kbps - mobile/low bandwidth)
                    <br />• <code>720p</code> (2.8 Mbps - HD)
                    <br />• <code>1080p</code> (5.0 Mbps - Full HD)
                  </li>
                  <li>Select <strong>Segment Count</strong>: choose 3 segments (~18s), 6 segments (~36s), or 10 segments (~60s).</li>
                  <li>Click <strong>Start Stream →</strong>!</li>
                  <li>Observe real HTTP requests fetching <code>master.m3u8</code>, variant playlists, and binary <code>.ts</code> video segments sequentially.</li>
                </ol>

                <h4 className="about-subheading">HLS Lifecycle Flow</h4>
                <div className="protocol-breakdown-table">
                  <div className="breakdown-row">
                    <span className="breakdown-badge streaming">Master M3U8</span>
                    <div className="breakdown-desc">
                      <code>GET /api/stream/media/master.m3u8</code>
                      <br />Returns available bitrates and references to sub-playlists for 360p, 720p, and 1080p.
                    </div>
                  </div>
                  <div className="breakdown-row">
                    <span className="breakdown-badge streaming">Variant M3U8</span>
                    <div className="breakdown-desc">
                      <code>{'GET /api/stream/media/{quality}/playlist.m3u8'}</code>
                      <br />Contains index of numbered chunk files (e.g. <code>#EXTINF:6.0, segment0.ts</code>).
                    </div>
                  </div>
                  <div className="breakdown-row">
                    <span className="breakdown-badge streaming">MPEG-TS Chunks</span>
                    <div className="breakdown-desc">
                      <code>{'GET /api/stream/media/{quality}/segment{N}.ts'}</code>
                      <br />Downloads authentic binary MPEG Transport Stream chunks with <code>video/mp2t</code> MIME type.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTROLS & VIEWS TAB */}
            {activeTab === 'features' && (
              <div className="about-tab-panel">
                <h3 className="about-section-heading"> Controls, Views & Shortcuts</h3>
                <p className="about-text">
                  Protocol Visualizer gives you full control over how packets are visualized and inspected:
                </p>

                <h4 className="about-subheading">Inspector View Modes</h4>
                <div className="feature-grid">
                  <div className="feature-card">
                    <div className="feature-card-title">☊ Flowchart View</div>
                    <p className="feature-card-desc">
                      Interactive oval nodes connected by animated flow arrows with protocol badges, timing offsets, and directional headers.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-card-title">☰ Rows Table View</div>
                    <p className="feature-card-desc">
                      High-density tabular list showing direction, timestamps, protocol badges, and summary tags.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-card-title">⇄ Sequence Diagram View</div>
                    <p className="feature-card-desc">
                      Classic Client ↔ Server swim-lane diagram showing direction-aware horizontal arrows traversing between lifelines.
                    </p>
                  </div>
                </div>

                <h4 className="about-subheading">Playback Engine</h4>
                <ul className="about-list">
                  <li><strong>Play / Pause:</strong> Step automatically through packet arrivals.</li>
                  <li><strong>Step Forward / Backward:</strong> Advance or rewind one packet at a time.</li>
                  <li><strong>Scrubbable Progress Bar:</strong> Click anywhere on the progress bar track to jump directly to any step!</li>
                  <li><strong>Speed Selector:</strong> Switch between <code>0.5x</code>, <code>1x</code>, <code>2x</code>, and <code>4x</code> playback speeds.</li>
                  <li><strong>Learn Mode (🎓):</strong> Toggle the graduation cap button in the top navbar to display educational tooltips on every protocol packet.</li>
                </ul>

                <h4 className="about-subheading">Keyboard Shortcuts</h4>
                <div className="keyboard-shortcuts-table">
                  <div className="shortcut-row"><kbd>Space</kbd> <span>Play or Pause playback</span></div>
                  <div className="shortcut-row"><kbd>→</kbd> <span>Step forward one packet</span></div>
                  <div className="shortcut-row"><kbd>←</kbd> <span>Step backward one packet</span></div>
                  <div className="shortcut-row"><kbd>R</kbd> <span>Replay session from start</span></div>
                  <div className="shortcut-row"><kbd>?</kbd> <span>Toggle keyboard legend overlay</span></div>
                  <div className="shortcut-row"><kbd>Esc</kbd> <span>Close modals and overlays</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="about-modal-footer">
          <span className="about-footer-tag">Protocol Visualizer • MIT License</span>
          <button className="btn-about-close" onClick={onClose}>
            Got it, Let's Inspect! →
          </button>
        </div>
      </div>
    </div>
  );
}
