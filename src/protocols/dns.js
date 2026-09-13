/**
 * DNS Protocol Simulation
 * Generates realistic DNS query/response Step objects
 */

let dnsIdCounter = 0;

/**
 * Build DNS resolution steps for a given hostname
 * @param {string} hostname - The domain to resolve (e.g. "example.com")
 * @returns {Array<Step>} Array of DNS Step objects
 */
export function buildDnsSteps(hostname) {
  const txId = Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
  const ip = generateRealisticIP(hostname);
  const ttl = [60, 120, 300, 600, 3600][Math.floor(Math.random() * 5)];
  const baseId = `dns-${++dnsIdCounter}`;

  return [
    {
      id: `${baseId}-query`,
      protocol: 'DNS',
      direction: 'client→server',
      summary: `DNS A? ${hostname}`,
      raw: [
        `;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 0x${txId}`,
        `;; flags: rd; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 1`,
        ``,
        `;; QUESTION SECTION:`,
        `;${hostname}.                    IN      A`,
        ``,
        `;; ADDITIONAL SECTION:`,
        `;; OPT PSEUDOSECTION:`,
        `; EDNS: version: 0, flags:; udp: 4096`,
        ``,
        `;; Query time: 0 msec`,
        `;; SERVER: 8.8.8.8#53(8.8.8.8) (UDP)`,
        `;; MSG SIZE  rcvd: ${28 + hostname.length}`,
      ].join('\n'),
      keyFields: [
        { label: 'Type', value: 'A (Host Address)' },
        { label: 'Name', value: hostname },
        { label: 'Transport', value: 'UDP port 53' },
        { label: 'Flags', value: 'RD (Recursion Desired)' },
        { label: 'Transaction ID', value: `0x${txId}` },
      ],
      offsetMs: 0,
    },
    {
      id: `${baseId}-response`,
      protocol: 'DNS',
      direction: 'server→client',
      summary: `DNS ${hostname} → ${ip} (TTL ${ttl}s)`,
      raw: [
        `;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 0x${txId}`,
        `;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1`,
        ``,
        `;; QUESTION SECTION:`,
        `;${hostname}.                    IN      A`,
        ``,
        `;; ANSWER SECTION:`,
        `${hostname}.              ${ttl}     IN      A       ${ip}`,
        ``,
        `;; ADDITIONAL SECTION:`,
        `;; OPT PSEUDOSECTION:`,
        `; EDNS: version: 0, flags:; udp: 4096`,
        ``,
        `;; Query time: ${Math.floor(Math.random() * 30) + 5} msec`,
        `;; SERVER: 8.8.8.8#53(8.8.8.8) (UDP)`,
        `;; MSG SIZE  rcvd: ${44 + hostname.length + ip.length}`,
      ].join('\n'),
      keyFields: [
        { label: 'Status', value: 'NOERROR' },
        { label: 'Answer', value: ip },
        { label: 'TTL', value: `${ttl}s` },
        { label: 'Flags', value: 'QR RD RA' },
        { label: 'Transaction ID', value: `0x${txId}` },
      ],
      offsetMs: 25,
    },
  ];
}

/**
 * Generate a deterministic but realistic-looking IP for a hostname
 */
function generateRealisticIP(hostname) {
  const knownHosts = {
    'example.com': '93.184.216.34',
    'www.example.com': '93.184.216.34',
    'google.com': '142.250.80.46',
    'www.google.com': '142.250.80.46',
    'github.com': '140.82.121.4',
    'mail.example.com': '93.184.216.100',
    'cdn.example.com': '104.16.132.229',
    'stream.example.com': '151.101.1.69',
  };
  if (knownHosts[hostname]) return knownHosts[hostname];

  // Generate a deterministic IP from the hostname
  let hash = 0;
  for (let i = 0; i < hostname.length; i++) {
    hash = ((hash << 5) - hash) + hostname.charCodeAt(i);
    hash |= 0;
  }
  const a = Math.abs(hash % 200) + 20;
  const b = Math.abs((hash >> 8) % 256);
  const c = Math.abs((hash >> 16) % 256);
  const d = Math.abs((hash >> 24) % 200) + 10;
  return `${a}.${b}.${c}.${d}`;
}
