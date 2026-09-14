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
export function buildDnsSteps(hostname, overrideIp = null, allIps = [], overrideTtl = null, server = '8.8.8.8') {
  const txId = Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
  const ip = overrideIp || generateRealisticIP(hostname);
  const ips = allIps.length > 0 ? allIps : [ip];
  const ttl = overrideTtl || [60, 120, 300, 600, 3600][Math.floor(Math.random() * 5)];
  const baseId = `dns-${++dnsIdCounter}`;

  const answerSection = ips.map(addr => `${hostname}.              ${ttl}     IN      A       ${addr}`).join('\n');

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
        `;; SERVER: ${server}#53(${server}) (UDP)`,
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
      summary: `DNS ${hostname} → ${ip}` + (ips.length > 1 ? ` (+${ips.length - 1} more)` : '') + ` (TTL ${ttl}s)`,
      raw: [
        `;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 0x${txId}`,
        `;; flags: qr rd ra; QUERY: 1, ANSWER: ${ips.length}, AUTHORITY: 0, ADDITIONAL: 1`,
        ``,
        `;; QUESTION SECTION:`,
        `;${hostname}.                    IN      A`,
        ``,
        `;; ANSWER SECTION:`,
        answerSection,
        ``,
        `;; ADDITIONAL SECTION:`,
        `;; OPT PSEUDOSECTION:`,
        `; EDNS: version: 0, flags:; udp: 4096`,
        ``,
        `;; Query time: ${Math.floor(Math.random() * 25) + 5} msec`,
        `;; SERVER: ${server}#53(${server}) (UDP)`,
        `;; MSG SIZE  rcvd: ${44 + hostname.length + ip.length * ips.length}`,
      ].join('\n'),
      keyFields: [
        { label: 'Status', value: 'NOERROR' },
        { label: 'Answer', value: ip },
        ...(ips.length > 1 ? [{ label: 'All Records', value: ips.join(', ') }] : []),
        { label: 'TTL', value: `${ttl}s` },
        { label: 'Flags', value: 'QR RD RA' },
        { label: 'DNS Server', value: server },
      ],
      offsetMs: 25,
    },
  ];
}

/**
 * Generate a deterministic synthetic IP only as offline fallback (no hardcoded domain tables)
 */
function generateRealisticIP(hostname) {
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
