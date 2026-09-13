/**
 * Sequence Builders
 * Composes protocol modules into complete activity sequences.
 * These are the public API — UI components call these, not the protocol modules directly.
 */

import { buildDnsSteps } from './dns.js';
import { buildHttpSteps } from './http.js';
import { buildSmtpSteps } from './smtp.js';
import { buildStreamingSteps } from './streaming.js';

/**
 * Build the full protocol sequence for a web browsing session.
 * Flow: DNS resolution → HTTP requests/responses (with sub-resources)
 *
 * @param {string} url - The URL to visit
 * @returns {Array<Step>} Complete sequence of steps
 */
export function buildBrowsingSequence(url) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    parsedUrl = new URL('https://example.com');
  }

  const hostname = parsedUrl.hostname;

  // Phase 1: DNS resolution
  const dnsSteps = buildDnsSteps(hostname);

  // Phase 2: HTTP requests (offset from DNS completion)
  const httpSteps = buildHttpSteps(url);
  const dnsEndMs = Math.max(...dnsSteps.map(s => s.offsetMs));

  // Offset HTTP steps to begin after DNS completes
  const offsetHttpSteps = httpSteps.map(step => ({
    ...step,
    offsetMs: step.offsetMs + dnsEndMs + 50,
  }));

  return [...dnsSteps, ...offsetHttpSteps];
}

/**
 * Build the full protocol sequence for sending an email.
 * Flow: DNS resolution (MX lookup implied) → SMTP conversation
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.body - Email body
 * @returns {Array<Step>} Complete sequence of steps
 */
export function buildMailSequence({ to, subject, body }) {
  const from = 'sender@example.com';
  const toDomain = to.split('@')[1] || 'example.com';
  const mailServer = `mail.${toDomain}`;

  // Phase 1: DNS resolution for the mail server
  const dnsSteps = buildDnsSteps(mailServer);

  // Phase 2: SMTP conversation
  const smtpSteps = buildSmtpSteps({ from, to, subject, body });
  const dnsEndMs = Math.max(...dnsSteps.map(s => s.offsetMs));

  // Offset SMTP steps to begin after DNS completes
  const offsetSmtpSteps = smtpSteps.map(step => ({
    ...step,
    offsetMs: step.offsetMs + dnsEndMs + 50,
  }));

  return [...dnsSteps, ...offsetSmtpSteps];
}

/**
 * Build the full protocol sequence for video streaming (HLS).
 * Flow: DNS resolution → HLS master playlist → variant playlist → segment fetches
 *
 * @param {string} quality - Starting quality: '360p' | '720p' | '1080p'
 * @param {number} segmentCount - Number of segments to simulate
 * @returns {Array<Step>} Complete sequence of steps
 */
export function buildStreamingSequence(quality = '720p', segmentCount = 6) {
  const cdnHost = 'cdn.example.com';

  // Phase 1: DNS resolution for CDN
  const dnsSteps = buildDnsSteps(cdnHost);

  // Phase 2: HLS streaming
  const streamSteps = buildStreamingSteps(quality, segmentCount);
  const dnsEndMs = Math.max(...dnsSteps.map(s => s.offsetMs));

  // Offset streaming steps
  const offsetStreamSteps = streamSteps.map(step => ({
    ...step,
    offsetMs: step.offsetMs + dnsEndMs + 50,
  }));

  return [...dnsSteps, ...offsetStreamSteps];
}
