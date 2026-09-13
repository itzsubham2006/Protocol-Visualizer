/**
 * Streaming Protocol Simulation (HLS Adaptive Bitrate)
 * Generates realistic HLS streaming steps: master playlist → variant playlist → segment fetches
 */

let streamIdCounter = 0;

const QUALITIES = {
  '360p':  { bandwidth: 800000,   resolution: '640x360',   avgSegSize: 450000 },
  '720p':  { bandwidth: 2800000,  resolution: '1280x720',  avgSegSize: 1500000 },
  '1080p': { bandwidth: 5000000,  resolution: '1920x1080', avgSegSize: 3000000 },
};

/**
 * Build HLS streaming steps
 * @param {string} quality - Starting quality: '360p', '720p', or '1080p'
 * @param {number} segmentCount - Number of segments to simulate (default 6)
 * @returns {Array<Step>} Array of Step objects
 */
export function buildStreamingSteps(quality = '720p', segmentCount = 6) {
  const baseId = `stream-${++streamIdCounter}`;
  const cdnHost = 'cdn.example.com';
  const qualityInfo = QUALITIES[quality] || QUALITIES['720p'];
  const date = new Date().toUTCString();
  const steps = [];
  let offsetMs = 0;

  // 1. GET master playlist
  steps.push({
    id: `${baseId}-master-req`,
    protocol: 'HTTP',
    direction: 'client→server',
    summary: `GET /video/master.m3u8 HTTP/1.1`,
    raw: [
      `GET /video/master.m3u8 HTTP/1.1`,
      `Host: ${cdnHost}`,
      `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36`,
      `Accept: application/vnd.apple.mpegurl,application/x-mpegURL,*/*`,
      `Connection: keep-alive`,
      `Origin: https://stream.example.com`,
      ``,
    ].join('\r\n'),
    keyFields: [
      { label: 'Method', value: 'GET' },
      { label: 'Path', value: '/video/master.m3u8' },
      { label: 'Content', value: 'HLS Master Playlist' },
      { label: 'Host', value: cdnHost },
    ],
    offsetMs: offsetMs,
  });
  offsetMs += 40;

  // 2. Master playlist response
  steps.push({
    id: `${baseId}-master-res`,
    protocol: 'HTTP',
    direction: 'server→client',
    summary: `HTTP/1.1 200 OK (master playlist — 3 renditions)`,
    raw: [
      `HTTP/1.1 200 OK`,
      `Date: ${date}`,
      `Server: CloudFront`,
      `Content-Type: application/vnd.apple.mpegurl`,
      `Content-Length: 312`,
      `Cache-Control: max-age=30`,
      `Access-Control-Allow-Origin: *`,
      `X-CDN-Pop: IAD79-P2`,
      ``,
      `#EXTM3U`,
      `#EXT-X-VERSION:3`,
      ``,
      `#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,CODECS="avc1.42e00a,mp4a.40.2"`,
      `360p/playlist.m3u8`,
      ``,
      `#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720,CODECS="avc1.4d401f,mp4a.40.2"`,
      `720p/playlist.m3u8`,
      ``,
      `#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"`,
      `1080p/playlist.m3u8`,
    ].join('\r\n'),
    keyFields: [
      { label: 'Status', value: '200 OK' },
      { label: 'Content-Type', value: 'application/vnd.apple.mpegurl' },
      { label: 'Renditions', value: '360p, 720p, 1080p' },
      { label: 'CDN', value: 'CloudFront (IAD79-P2)' },
    ],
    offsetMs: offsetMs,
  });
  offsetMs += 30;

  // 3. GET variant playlist for selected quality
  steps.push({
    id: `${baseId}-variant-req`,
    protocol: 'HTTP',
    direction: 'client→server',
    summary: `GET /video/${quality}/playlist.m3u8 HTTP/1.1`,
    raw: [
      `GET /video/${quality}/playlist.m3u8 HTTP/1.1`,
      `Host: ${cdnHost}`,
      `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36`,
      `Accept: application/vnd.apple.mpegurl,*/*`,
      `Connection: keep-alive`,
      ``,
    ].join('\r\n'),
    keyFields: [
      { label: 'Method', value: 'GET' },
      { label: 'Path', value: `/video/${quality}/playlist.m3u8` },
      { label: 'Quality', value: `${quality} (${qualityInfo.resolution})` },
    ],
    offsetMs: offsetMs,
  });
  offsetMs += 35;

  // 4. Variant playlist response
  const segmentLines = [];
  for (let i = 0; i < segmentCount; i++) {
    segmentLines.push(`#EXTINF:6.006,`);
    segmentLines.push(`segment${String(i).padStart(3, '0')}.ts`);
  }

  steps.push({
    id: `${baseId}-variant-res`,
    protocol: 'HTTP',
    direction: 'server→client',
    summary: `HTTP/1.1 200 OK (media playlist — ${segmentCount} segments)`,
    raw: [
      `HTTP/1.1 200 OK`,
      `Date: ${date}`,
      `Server: CloudFront`,
      `Content-Type: application/vnd.apple.mpegurl`,
      `Cache-Control: max-age=6`,
      ``,
      `#EXTM3U`,
      `#EXT-X-VERSION:3`,
      `#EXT-X-TARGETDURATION:7`,
      `#EXT-X-MEDIA-SEQUENCE:0`,
      `#EXT-X-PLAYLIST-TYPE:VOD`,
      ...segmentLines,
      `#EXT-X-ENDLIST`,
    ].join('\r\n'),
    keyFields: [
      { label: 'Status', value: '200 OK' },
      { label: 'Segments', value: `${segmentCount}` },
      { label: 'Duration per Segment', value: '~6s' },
      { label: 'Total Duration', value: `~${(segmentCount * 6).toFixed(0)}s` },
      { label: 'Bandwidth', value: `${(qualityInfo.bandwidth / 1000000).toFixed(1)} Mbps` },
    ],
    offsetMs: offsetMs,
  });
  offsetMs += 20;

  // 5. Repeated segment fetches
  for (let i = 0; i < segmentCount; i++) {
    const segName = `segment${String(i).padStart(3, '0')}.ts`;
    const segSize = qualityInfo.avgSegSize + Math.floor(Math.random() * 200000) - 100000;

    steps.push({
      id: `${baseId}-seg-req-${i}`,
      protocol: 'HTTP',
      direction: 'client→server',
      summary: `GET /video/${quality}/${segName} HTTP/1.1`,
      raw: [
        `GET /video/${quality}/${segName} HTTP/1.1`,
        `Host: ${cdnHost}`,
        `User-Agent: Mozilla/5.0`,
        `Accept: */*`,
        `Connection: keep-alive`,
        `Range: bytes=0-`,
        ``,
      ].join('\r\n'),
      keyFields: [
        { label: 'Method', value: 'GET' },
        { label: 'Segment', value: `#${i} (${segName})` },
        { label: 'Quality', value: quality },
        { label: 'Playback Time', value: `${(i * 6).toFixed(1)}s — ${((i + 1) * 6).toFixed(1)}s` },
      ],
      offsetMs: offsetMs,
    });
    offsetMs += 15;

    steps.push({
      id: `${baseId}-seg-res-${i}`,
      protocol: 'HTTP',
      direction: 'server→client',
      summary: `HTTP/1.1 200 OK (video/mp2t, ${(segSize / 1024).toFixed(0)} KB)`,
      raw: [
        `HTTP/1.1 200 OK`,
        `Date: ${date}`,
        `Server: CloudFront`,
        `Content-Type: video/mp2t`,
        `Content-Length: ${segSize}`,
        `Accept-Ranges: bytes`,
        `Cache-Control: public, max-age=31536000`,
        `X-Cache: Hit from cloudfront`,
        ``,
      ].join('\r\n'),
      keyFields: [
        { label: 'Status', value: '200 OK' },
        { label: 'Content-Type', value: 'video/mp2t (MPEG-TS)' },
        { label: 'Size', value: `${(segSize / 1024).toFixed(0)} KB` },
        { label: 'Cache', value: 'CDN Hit' },
      ],
      offsetMs: offsetMs,
    });
    offsetMs += 100;
  }

  return steps;
}

export { QUALITIES };
