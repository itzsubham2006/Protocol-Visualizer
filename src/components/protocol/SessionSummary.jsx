import { useState, useMemo } from 'react';
import { useSession } from '../../context/SessionContext';

const PROTOCOL_COLORS = {
  DNS: '#38bdf8',
  TCP: '#60a5fa',
  TLS: '#a78bfa',
  HTTP: '#34d399',
  SMTP: '#fbbf24',
  STREAMING: '#c084fc',
};

export default function SessionSummary() {
  const { steps, isStreaming } = useSession();
  const [dismissed, setDismissed] = useState(false);

  const stats = useMemo(() => {
    if (steps.length === 0) return null;

    // Group by protocol
    const byProtocol = {};
    let totalDuration = 0;
    let realCount = 0;
    let simCount = 0;
    let largestPayload = { protocol: '', size: 0, label: '' };

    steps.forEach((step) => {
      const proto = step.protocol || 'UNKNOWN';
      if (!byProtocol[proto]) {
        byProtocol[proto] = { count: 0, totalMs: 0 };
      }
      byProtocol[proto].count += 1;

      if (step.offsetMs != null && step.offsetMs > totalDuration) {
        totalDuration = step.offsetMs;
      }

      if (step.status === 'real') realCount++;
      else simCount++;

      // Estimate payload size from raw data length
      const rawLen = step.raw ? step.raw.length : 0;
      if (rawLen > largestPayload.size) {
        largestPayload = {
          protocol: proto,
          size: rawLen,
          label: step.summary ? step.summary.substring(0, 40) : proto,
        };
      }
    });

    // Calculate per-protocol duration spread (approximate using offsets)
    const protocolEntries = Object.entries(byProtocol).map(([proto, data]) => {
      const protoSteps = steps.filter((s) => s.protocol === proto);
      const minOffset = Math.min(...protoSteps.map((s) => s.offsetMs || 0));
      const maxOffset = Math.max(...protoSteps.map((s) => s.offsetMs || 0));
      const duration = maxOffset - minOffset || 1;
      return {
        protocol: proto,
        count: data.count,
        duration,
        color: PROTOCOL_COLORS[proto] || '#94a3b8',
      };
    });

    const totalProtoTime = protocolEntries.reduce((sum, e) => sum + e.duration, 0) || 1;
    protocolEntries.forEach((e) => {
      e.percent = Math.max(((e.duration / totalProtoTime) * 100), 5);
    });

    return {
      totalSteps: steps.length,
      totalDuration: Math.round(totalDuration),
      protocols: protocolEntries,
      realCount,
      simCount,
      largestPayload,
    };
  }, [steps]);

  if (!stats || isStreaming || dismissed || steps.length === 0) return null;

  const formatSize = (bytes) => {
    if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="session-summary">
      <div className="session-summary-header">
        <span className="session-summary-title">SESSION SUMMARY</span>
        <button
          className="session-summary-dismiss"
          onClick={() => setDismissed(true)}
          title="Dismiss"
        >
          ✕
        </button>
      </div>

      <div className="session-summary-body">
        {/* Top stats row */}
        <div className="summary-stats-row">
          <div className="summary-stat">
            <span className="summary-stat-value">{stats.totalSteps}</span>
            <span className="summary-stat-label">Steps</span>
          </div>
          <div className="summary-stat">
            <span className="summary-stat-value">{stats.totalDuration}ms</span>
            <span className="summary-stat-label">Duration</span>
          </div>
          <div className="summary-stat">
            <span className="summary-stat-value">{stats.protocols.length}</span>
            <span className="summary-stat-label">Protocols</span>
          </div>
          <div className="summary-stat">
            <span className="summary-stat-value">
              {stats.realCount}/{stats.totalSteps}
            </span>
            <span className="summary-stat-label">Real Events</span>
          </div>
        </div>

        {/* Protocol distribution bar */}
        <div className="summary-distribution">
          <div className="summary-bar-track">
            {stats.protocols.map((p) => (
              <div
                key={p.protocol}
                className="summary-bar-segment"
                style={{
                  width: `${p.percent}%`,
                  backgroundColor: p.color,
                }}
                title={`${p.protocol}: ${p.count} steps (${Math.round(p.percent)}%)`}
              />
            ))}
          </div>
          <div className="summary-bar-legend">
            {stats.protocols.map((p) => (
              <span key={p.protocol} className="summary-legend-item">
                <span
                  className="summary-legend-dot"
                  style={{ backgroundColor: p.color }}
                />
                <span className="summary-legend-label">
                  {p.protocol} ({p.count})
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Largest payload */}
        {stats.largestPayload.size > 0 && (
          <div className="summary-detail">
            Largest payload: {stats.largestPayload.protocol} — {formatSize(stats.largestPayload.size)}
          </div>
        )}
      </div>
    </div>
  );
}
