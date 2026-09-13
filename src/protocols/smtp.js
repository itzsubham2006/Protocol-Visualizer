/**
 * SMTP Protocol Simulation
 * Generates the full SMTP conversation per RFC 5321
 */

let smtpIdCounter = 0;

/**
 * Build SMTP conversation steps for sending an email
 * @param {Object} params
 * @param {string} params.from - Sender email address
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.body - Email body text
 * @returns {Array<Step>} Array of SMTP Step objects
 */
export function buildSmtpSteps({ from, to, subject, body }) {
  const baseId = `smtp-${++smtpIdCounter}`;
  const fromDomain = from.split('@')[1] || 'example.com';
  const toDomain = to.split('@')[1] || 'example.com';
  const mailServer = `mail.${toDomain}`;
  const clientHost = `client.${fromDomain}`;
  const queueId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const date = new Date().toUTCString();
  const msgId = `${Date.now()}.${queueId}@${fromDomain}`;

  return [
    // 1. Server greeting (220)
    {
      id: `${baseId}-greeting`,
      protocol: 'SMTP',
      direction: 'server→client',
      summary: `220 ${mailServer} ESMTP ready`,
      raw: `220 ${mailServer} ESMTP Postfix (Ubuntu)\r\n`,
      keyFields: [
        { label: 'Status', value: '220 (Service Ready)' },
        { label: 'Server', value: mailServer },
        { label: 'Port', value: '25' },
      ],
      offsetMs: 0,
    },

    // 2. Client EHLO
    {
      id: `${baseId}-ehlo`,
      protocol: 'SMTP',
      direction: 'client→server',
      summary: `EHLO ${clientHost}`,
      raw: `EHLO ${clientHost}\r\n`,
      keyFields: [
        { label: 'Command', value: 'EHLO' },
        { label: 'Client Identity', value: clientHost },
      ],
      offsetMs: 30,
    },

    // 3. Server EHLO response (250 multi-line)
    {
      id: `${baseId}-ehlo-resp`,
      protocol: 'SMTP',
      direction: 'server→client',
      summary: `250 ${mailServer} Hello — capabilities listed`,
      raw: [
        `250-${mailServer} Hello ${clientHost} [203.0.113.42]`,
        `250-SIZE 52428800`,
        `250-8BITMIME`,
        `250-STARTTLS`,
        `250-ENHANCEDSTATUSCODES`,
        `250-PIPELINING`,
        `250-CHUNKING`,
        `250 SMTPUTF8`,
      ].join('\r\n') + '\r\n',
      keyFields: [
        { label: 'Status', value: '250 (OK)' },
        { label: 'Max Size', value: '50 MB' },
        { label: '8BITMIME', value: 'Supported' },
        { label: 'STARTTLS', value: 'Available' },
        { label: 'PIPELINING', value: 'Supported' },
      ],
      offsetMs: 55,
    },

    // 4. MAIL FROM
    {
      id: `${baseId}-mail-from`,
      protocol: 'SMTP',
      direction: 'client→server',
      summary: `MAIL FROM:<${from}>`,
      raw: `MAIL FROM:<${from}> SIZE=${estimateSize(subject, body)}\r\n`,
      keyFields: [
        { label: 'Command', value: 'MAIL FROM' },
        { label: 'Sender', value: from },
        { label: 'Estimated Size', value: `${estimateSize(subject, body)} bytes` },
      ],
      offsetMs: 80,
    },

    // 5. Server acknowledges MAIL FROM
    {
      id: `${baseId}-mail-from-ok`,
      protocol: 'SMTP',
      direction: 'server→client',
      summary: `250 2.1.0 OK`,
      raw: `250 2.1.0 Ok\r\n`,
      keyFields: [
        { label: 'Status', value: '250 (OK)' },
        { label: 'Enhanced Code', value: '2.1.0 (Sender OK)' },
      ],
      offsetMs: 100,
    },

    // 6. RCPT TO
    {
      id: `${baseId}-rcpt-to`,
      protocol: 'SMTP',
      direction: 'client→server',
      summary: `RCPT TO:<${to}>`,
      raw: `RCPT TO:<${to}>\r\n`,
      keyFields: [
        { label: 'Command', value: 'RCPT TO' },
        { label: 'Recipient', value: to },
      ],
      offsetMs: 120,
    },

    // 7. Server acknowledges RCPT TO
    {
      id: `${baseId}-rcpt-to-ok`,
      protocol: 'SMTP',
      direction: 'server→client',
      summary: `250 2.1.5 OK`,
      raw: `250 2.1.5 Ok\r\n`,
      keyFields: [
        { label: 'Status', value: '250 (OK)' },
        { label: 'Enhanced Code', value: '2.1.5 (Recipient OK)' },
      ],
      offsetMs: 140,
    },

    // 8. DATA command
    {
      id: `${baseId}-data`,
      protocol: 'SMTP',
      direction: 'client→server',
      summary: `DATA`,
      raw: `DATA\r\n`,
      keyFields: [
        { label: 'Command', value: 'DATA' },
        { label: 'Purpose', value: 'Begin message content' },
      ],
      offsetMs: 160,
    },

    // 9. Server 354 — go ahead
    {
      id: `${baseId}-data-ok`,
      protocol: 'SMTP',
      direction: 'server→client',
      summary: `354 End data with <CR><LF>.<CR><LF>`,
      raw: `354 End data with <CR><LF>.<CR><LF>\r\n`,
      keyFields: [
        { label: 'Status', value: '354 (Start Mail Input)' },
        { label: 'Terminator', value: '<CRLF>.<CRLF>' },
      ],
      offsetMs: 175,
    },

    // 10. Message content
    {
      id: `${baseId}-message`,
      protocol: 'SMTP',
      direction: 'client→server',
      summary: `[Message: "${subject}"]`,
      raw: [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `Date: ${date}`,
        `Message-ID: <${msgId}>`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset="UTF-8"`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        body,
        `.`,
      ].join('\r\n') + '\r\n',
      keyFields: [
        { label: 'From', value: from },
        { label: 'To', value: to },
        { label: 'Subject', value: subject },
        { label: 'Message-ID', value: msgId },
        { label: 'MIME', value: 'text/plain; charset=UTF-8' },
      ],
      offsetMs: 200,
    },

    // 11. Server accepts message
    {
      id: `${baseId}-queued`,
      protocol: 'SMTP',
      direction: 'server→client',
      summary: `250 OK: queued as ${queueId}`,
      raw: `250 2.0.0 Ok: queued as ${queueId}\r\n`,
      keyFields: [
        { label: 'Status', value: '250 (OK)' },
        { label: 'Queue ID', value: queueId },
        { label: 'Enhanced Code', value: '2.0.0 (Message Accepted)' },
      ],
      offsetMs: 250,
    },

    // 12. QUIT
    {
      id: `${baseId}-quit`,
      protocol: 'SMTP',
      direction: 'client→server',
      summary: `QUIT`,
      raw: `QUIT\r\n`,
      keyFields: [
        { label: 'Command', value: 'QUIT' },
      ],
      offsetMs: 280,
    },

    // 13. Server goodbye
    {
      id: `${baseId}-bye`,
      protocol: 'SMTP',
      direction: 'server→client',
      summary: `221 2.0.0 Bye`,
      raw: `221 2.0.0 Bye\r\n`,
      keyFields: [
        { label: 'Status', value: '221 (Service Closing)' },
        { label: 'Enhanced Code', value: '2.0.0' },
      ],
      offsetMs: 300,
    },
  ];
}

function estimateSize(subject, body) {
  return 200 + (subject || '').length + (body || '').length;
}
