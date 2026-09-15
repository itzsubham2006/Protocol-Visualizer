/**
 * Learn Mode — Educational content for protocol steps.
 *
 * Each key is a protocol name. Each value is an array of
 * { match, title, description } objects. The `match` function
 * receives the step summary string and returns true if the
 * explanation applies.
 */

const LEARN_CONTENT = {
  DNS: {
    description: 'DNS (Domain Name System) translates human-readable domain names like "example.com" into IP addresses like 93.184.216.34 that computers use to identify each other on the network.',
    steps: [
      {
        match: (s) => /query|request/i.test(s) && /A\b/.test(s),
        title: 'DNS A Record Query',
        description: 'An A record query asks the DNS server: "What IPv4 address does this domain name point to?" This is the most common type of DNS lookup.',
      },
      {
        match: (s) => /response|answer|resolved/i.test(s),
        title: 'DNS Response',
        description: 'The DNS server responds with one or more IP addresses. The TTL (Time-To-Live) tells your computer how long to cache this answer before asking again.',
      },
      {
        match: (s) => /AAAA/i.test(s),
        title: 'DNS AAAA Record Query',
        description: 'An AAAA query is like an A query but for IPv6 addresses (128-bit) instead of IPv4 (32-bit). IPv6 addresses look like 2001:db8::1.',
      },
    ],
  },
  TCP: {
    description: 'TCP (Transmission Control Protocol) provides reliable, ordered delivery of data between applications. It ensures every byte arrives correctly using a connection-oriented approach.',
    steps: [
      {
        match: (s) => /SYN(?!-ACK)/i.test(s),
        title: 'TCP SYN — Starting the Handshake',
        description: 'The client sends a SYN (synchronize) packet to the server. This is step 1 of the 3-way handshake — the client is saying "I want to establish a connection."',
      },
      {
        match: (s) => /SYN-ACK|SYN\/ACK/i.test(s),
        title: 'TCP SYN-ACK — Server Agrees',
        description: 'The server responds with SYN-ACK, acknowledging the client\'s SYN and sending its own synchronize. This is step 2 — the server says "OK, I accept your connection request."',
      },
      {
        match: (s) => /\bACK\b/i.test(s) && !/SYN/i.test(s),
        title: 'TCP ACK — Connection Established',
        description: 'The client sends a final ACK (acknowledgment). This completes the 3-way handshake. Both sides can now send data reliably over this connection.',
      },
    ],
  },
  TLS: {
    description: 'TLS (Transport Layer Security) encrypts data in transit, preventing eavesdropping and tampering. It\'s what makes HTTPS secure — the "S" stands for Secure.',
    steps: [
      {
        match: (s) => /ClientHello/i.test(s),
        title: 'TLS ClientHello',
        description: 'The client tells the server which TLS versions and cipher suites it supports, plus a random number for key generation. This starts the TLS handshake.',
      },
      {
        match: (s) => /ServerHello/i.test(s),
        title: 'TLS ServerHello',
        description: 'The server picks the strongest cipher suite both sides support and sends its certificate (proving its identity) along with its own random number.',
      },
      {
        match: (s) => /certificate|verify/i.test(s),
        title: 'Certificate Verification',
        description: 'The client verifies the server\'s certificate against trusted Certificate Authorities (CAs). This prevents man-in-the-middle attacks — you know you\'re really talking to the right server.',
      },
      {
        match: (s) => /key|exchange|finished|encrypted/i.test(s),
        title: 'Key Exchange & Encryption',
        description: 'Both sides derive shared session keys using the exchanged random values. From this point on, all data is encrypted — even if someone intercepts the traffic, they can\'t read it.',
      },
    ],
  },
  HTTP: {
    description: 'HTTP (HyperText Transfer Protocol) is the foundation of the web. It defines how clients (browsers) request resources and servers respond with content.',
    steps: [
      {
        match: (s) => /GET|POST|PUT|DELETE|PATCH/i.test(s) && !/response|status/i.test(s),
        title: 'HTTP Request',
        description: 'The client sends a request with a method (GET = fetch data, POST = send data), the URL path, headers (metadata like cookies, content-type), and optionally a body.',
      },
      {
        match: (s) => /200|response|status/i.test(s),
        title: 'HTTP Response',
        description: 'The server responds with a status code (200 = OK, 404 = Not Found, 500 = Server Error), response headers, and the body (HTML, JSON, images, etc.).',
      },
      {
        match: (s) => /redirect|301|302|303|307/i.test(s),
        title: 'HTTP Redirect',
        description: 'The server says "the resource has moved" and provides a new URL. Your browser automatically follows the redirect. 301 = permanent, 302/307 = temporary.',
      },
    ],
  },
  SMTP: {
    description: 'SMTP (Simple Mail Transfer Protocol) is the standard protocol for sending email across the internet. It uses a series of text commands over a TCP connection.',
    steps: [
      {
        match: (s) => /220|greeting|banner/i.test(s),
        title: 'SMTP Server Greeting',
        description: 'When you connect to an SMTP server, it greets you with a 220 message identifying itself. This confirms the server is ready to accept mail.',
      },
      {
        match: (s) => /EHLO|HELO/i.test(s),
        title: 'EHLO / HELO Command',
        description: 'The client introduces itself with EHLO (Extended HELLO). The server responds with its capabilities — like whether it supports TLS encryption or authentication.',
      },
      {
        match: (s) => /MAIL FROM/i.test(s),
        title: 'MAIL FROM — Sender Envelope',
        description: 'The client specifies the sender\'s email address in the "envelope from." This is the address used for bounce messages (it can differ from the "From:" header in the email).',
      },
      {
        match: (s) => /RCPT TO/i.test(s),
        title: 'RCPT TO — Recipient Envelope',
        description: 'The client specifies who should receive the email. The server can accept or reject each recipient — for example, rejecting unknown addresses.',
      },
      {
        match: (s) => /DATA|354|message/i.test(s),
        title: 'DATA — Message Content',
        description: 'After the server sends "354 Start mail input," the client sends the actual email content (headers + body), ending with a line containing just a period (.).',
      },
      {
        match: (s) => /QUIT|221/i.test(s),
        title: 'QUIT — Closing Connection',
        description: 'The client says QUIT to close the session gracefully. The server responds with 221 and closes the connection. The email is now queued for delivery.',
      },
    ],
  },
  STREAMING: {
    description: 'HLS (HTTP Live Streaming) is Apple\'s adaptive streaming protocol. It breaks video into small segments and uses playlists to let the player fetch them one by one over HTTP.',
    steps: [
      {
        match: (s) => /master/i.test(s),
        title: 'HLS Master Playlist',
        description: 'The master playlist (master.m3u8) lists all available quality levels (360p, 720p, 1080p) with their bandwidths. The player picks the best quality for your connection speed.',
      },
      {
        match: (s) => /variant|rendition|playlist\.m3u8/i.test(s),
        title: 'HLS Variant Playlist',
        description: 'Each quality level has its own playlist listing individual video segments (small .ts files, usually 2-10 seconds each). The player downloads segments sequentially.',
      },
      {
        match: (s) => /segment|\.ts|chunk/i.test(s),
        title: 'HLS Video Segment',
        description: 'Each segment is a small MPEG-TS file containing a few seconds of video+audio. The player downloads and plays them in sequence, buffering ahead for smooth playback.',
      },
    ],
  },
};

/**
 * Get learn content for a given step.
 * Returns { protocolInfo, stepInfo } or null.
 */
export function getLearnContent(step) {
  if (!step || !step.protocol) return null;

  const protocolData = LEARN_CONTENT[step.protocol];
  if (!protocolData) return null;

  // Find matching step explanation
  let stepInfo = null;
  if (protocolData.steps) {
    for (const entry of protocolData.steps) {
      if (entry.match(step.summary || '')) {
        stepInfo = { title: entry.title, description: entry.description };
        break;
      }
    }
  }

  return {
    protocolInfo: protocolData.description,
    stepInfo,
  };
}

export default LEARN_CONTENT;
