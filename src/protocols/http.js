/**
 * HTTP Protocol Simulation
 * Generates realistic HTTP request/response Step objects for web browsing
 */

let httpIdCounter = 0;

/**
 * Build HTTP steps for a browsing session
 * @param {string} url - The URL being visited (e.g. "https://example.com/index.html")
 * @returns {Array<Step>} Array of HTTP Step objects
 */
export function buildHttpSteps(url) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    parsedUrl = new URL('https://example.com');
  }

  const host = parsedUrl.hostname;
  const path = parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname;
  const baseId = `http-${++httpIdCounter}`;
  const date = new Date().toUTCString();
  const steps = [];

  // 1. Main page request
  steps.push({
    id: `${baseId}-req-1`,
    protocol: 'HTTP',
    direction: 'client→server',
    summary: `GET ${path} HTTP/1.1`,
    raw: [
      `GET ${path} HTTP/1.1`,
      `Host: ${host}`,
      `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36`,
      `Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8`,
      `Accept-Language: en-US,en;q=0.5`,
      `Accept-Encoding: gzip, deflate, br`,
      `Connection: keep-alive`,
      `Upgrade-Insecure-Requests: 1`,
      `Cache-Control: max-age=0`,
      ``,
    ].join('\r\n'),
    keyFields: [
      { label: 'Method', value: 'GET' },
      { label: 'Path', value: path },
      { label: 'Host', value: host },
      { label: 'Connection', value: 'keep-alive' },
    ],
    offsetMs: 50,
  });

  // 2. Main page response
  const htmlSize = Math.floor(Math.random() * 8000) + 2000;
  steps.push({
    id: `${baseId}-res-1`,
    protocol: 'HTTP',
    direction: 'server→client',
    summary: `HTTP/1.1 200 OK (text/html, ${htmlSize} bytes)`,
    raw: [
      `HTTP/1.1 200 OK`,
      `Date: ${date}`,
      `Server: nginx/1.25.3`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Length: ${htmlSize}`,
      `Connection: keep-alive`,
      `X-Content-Type-Options: nosniff`,
      `X-Frame-Options: SAMEORIGIN`,
      `Cache-Control: public, max-age=3600`,
      `ETag: "5f3b8c2a-${htmlSize.toString(16)}"`,
      `Vary: Accept-Encoding`,
      `Content-Encoding: gzip`,
      ``,
      `<!DOCTYPE html>`,
      `<html lang="en">`,
      `<head>`,
      `  <meta charset="UTF-8">`,
      `  <title>${host}</title>`,
      `  <link rel="stylesheet" href="/styles/main.css">`,
      `  <script src="/js/app.js" defer></script>`,
      `</head>`,
      `<body>`,
      `  <h1>Welcome to ${host}</h1>`,
      `  <p>Page content...</p>`,
      `  <img src="/images/hero.webp" alt="Hero image">`,
      `</body>`,
      `</html>`,
    ].join('\r\n'),
    keyFields: [
      { label: 'Status', value: '200 OK' },
      { label: 'Content-Type', value: 'text/html; charset=UTF-8' },
      { label: 'Content-Length', value: `${htmlSize}` },
      { label: 'Server', value: 'nginx/1.25.3' },
      { label: 'Connection', value: 'keep-alive' },
    ],
    offsetMs: 120,
  });

  // 3. CSS sub-resource (reusing kept-alive connection)
  const cssSize = Math.floor(Math.random() * 3000) + 500;
  steps.push({
    id: `${baseId}-req-2`,
    protocol: 'HTTP',
    direction: 'client→server',
    summary: `GET /styles/main.css HTTP/1.1`,
    raw: [
      `GET /styles/main.css HTTP/1.1`,
      `Host: ${host}`,
      `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36`,
      `Accept: text/css,*/*;q=0.1`,
      `Referer: https://${host}${path}`,
      `Connection: keep-alive`,
      ``,
    ].join('\r\n'),
    keyFields: [
      { label: 'Method', value: 'GET' },
      { label: 'Path', value: '/styles/main.css' },
      { label: 'Referer', value: `https://${host}${path}` },
      { label: 'Connection', value: 'keep-alive (reused)' },
    ],
    offsetMs: 180,
  });

  steps.push({
    id: `${baseId}-res-2`,
    protocol: 'HTTP',
    direction: 'server→client',
    summary: `HTTP/1.1 200 OK (text/css, ${cssSize} bytes)`,
    raw: [
      `HTTP/1.1 200 OK`,
      `Date: ${date}`,
      `Server: nginx/1.25.3`,
      `Content-Type: text/css; charset=UTF-8`,
      `Content-Length: ${cssSize}`,
      `Connection: keep-alive`,
      `Cache-Control: public, max-age=86400`,
      `ETag: "css-${cssSize.toString(16)}"`,
      ``,
    ].join('\r\n'),
    keyFields: [
      { label: 'Status', value: '200 OK' },
      { label: 'Content-Type', value: 'text/css' },
      { label: 'Content-Length', value: `${cssSize}` },
      { label: 'Cache-Control', value: 'max-age=86400' },
    ],
    offsetMs: 210,
  });

  // 4. JavaScript sub-resource
  const jsSize = Math.floor(Math.random() * 15000) + 3000;
  steps.push({
    id: `${baseId}-req-3`,
    protocol: 'HTTP',
    direction: 'client→server',
    summary: `GET /js/app.js HTTP/1.1`,
    raw: [
      `GET /js/app.js HTTP/1.1`,
      `Host: ${host}`,
      `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36`,
      `Accept: application/javascript,*/*;q=0.1`,
      `Referer: https://${host}${path}`,
      `Connection: keep-alive`,
      ``,
    ].join('\r\n'),
    keyFields: [
      { label: 'Method', value: 'GET' },
      { label: 'Path', value: '/js/app.js' },
      { label: 'Connection', value: 'keep-alive (reused)' },
    ],
    offsetMs: 250,
  });

  steps.push({
    id: `${baseId}-res-3`,
    protocol: 'HTTP',
    direction: 'server→client',
    summary: `HTTP/1.1 200 OK (application/javascript, ${jsSize} bytes)`,
    raw: [
      `HTTP/1.1 200 OK`,
      `Date: ${date}`,
      `Server: nginx/1.25.3`,
      `Content-Type: application/javascript; charset=UTF-8`,
      `Content-Length: ${jsSize}`,
      `Connection: keep-alive`,
      `Cache-Control: public, max-age=604800`,
      `Content-Encoding: gzip`,
      ``,
    ].join('\r\n'),
    keyFields: [
      { label: 'Status', value: '200 OK' },
      { label: 'Content-Type', value: 'application/javascript' },
      { label: 'Content-Length', value: `${jsSize}` },
    ],
    offsetMs: 290,
  });

  // 5. Image sub-resource
  const imgSize = Math.floor(Math.random() * 50000) + 10000;
  steps.push({
    id: `${baseId}-req-4`,
    protocol: 'HTTP',
    direction: 'client→server',
    summary: `GET /images/hero.webp HTTP/1.1`,
    raw: [
      `GET /images/hero.webp HTTP/1.1`,
      `Host: ${host}`,
      `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36`,
      `Accept: image/avif,image/webp,image/apng,*/*;q=0.8`,
      `Referer: https://${host}${path}`,
      `Connection: keep-alive`,
      ``,
    ].join('\r\n'),
    keyFields: [
      { label: 'Method', value: 'GET' },
      { label: 'Path', value: '/images/hero.webp' },
      { label: 'Accept', value: 'image/avif,image/webp,...' },
      { label: 'Connection', value: 'keep-alive (reused)' },
    ],
    offsetMs: 330,
  });

  steps.push({
    id: `${baseId}-res-4`,
    protocol: 'HTTP',
    direction: 'server→client',
    summary: `HTTP/1.1 200 OK (image/webp, ${imgSize} bytes)`,
    raw: [
      `HTTP/1.1 200 OK`,
      `Date: ${date}`,
      `Server: nginx/1.25.3`,
      `Content-Type: image/webp`,
      `Content-Length: ${imgSize}`,
      `Connection: keep-alive`,
      `Cache-Control: public, max-age=2592000`,
      `Accept-Ranges: bytes`,
      ``,
    ].join('\r\n'),
    keyFields: [
      { label: 'Status', value: '200 OK' },
      { label: 'Content-Type', value: 'image/webp' },
      { label: 'Content-Length', value: `${imgSize}` },
      { label: 'Cache-Control', value: 'max-age=2592000 (30 days)' },
    ],
    offsetMs: 400,
  });

  return steps;
}
