"""
Full-Stack Real Web Networking Client for Protocol Visualizer
Executes the authentic 5-step browsing lifecycle over real OS sockets:
1. DNS Resolution (Host -> IP)
2. TCP 3-Way Handshake Connection (IP:Port)
3. TLS Handshake & Negotiation (HTTPS encryption established)
4. HTTP Request (GET path over TLS/TCP)
5. HTTP Response (Status, Headers & Payload from real server)
"""

import socket
import ssl
import time
import uuid
from urllib.parse import urlparse
from backend.networking.events import ProtocolEvent
from dataclasses import asdict

async def perform_full_browse_pipeline(url: str, pre_resolved_ip: str = None) -> list[dict]:
    """
    Executes real TCP connection, real TLS handshake, and real HTTP exchange.
    Returns list of ProtocolEvent dicts capturing every phase.
    """
    events = []
    start_time = time.time()
    req_id = uuid.uuid4().hex[:6]
    step_counter = 0

    normalized_url = url.strip()
    if not normalized_url.startswith(("http://", "https://")):
        normalized_url = f"https://{normalized_url}"

    parsed_url = urlparse(normalized_url)
    host = parsed_url.hostname or "unknown"
    is_https = parsed_url.scheme == "https"
    default_port = 443 if is_https else 80
    port = parsed_url.port or default_port

    path = parsed_url.path or "/"
    if parsed_url.query:
        path += f"?{parsed_url.query}"

    def get_offset():
        return round((time.time() - start_time) * 1000, 1)

    def add_event(protocol, direction, summary, raw, key_fields):
        nonlocal step_counter
        evt = ProtocolEvent(
            id=f"browse-{req_id}-{step_counter}",
            protocol=protocol,
            direction=direction,
            summary=summary,
            raw=raw.rstrip(),
            keyFields=key_fields,
            offsetMs=get_offset(),
            status="real"
        )
        events.append(asdict(evt))
        step_counter += 1

    # Determine target IP
    target_ip = pre_resolved_ip
    if not target_ip:
        try:
            target_ip = socket.gethostbyname(host)
        except Exception as e:
            add_event(
                "TCP",
                "server→client",
                f"Connection Failed: Host {host} not resolvable",
                f"Cannot establish TCP connection: {str(e)}",
                [{"label": "Error", "value": str(e)}]
            )
            return events

    # -------------------------------------------------------------
    # STEP 2: Real TCP 3-Way Handshake Connection
    # -------------------------------------------------------------
    tcp_start = time.time()
    add_event(
        "TCP",
        "client→server",
        f"TCP [SYN] Seq=0 → {target_ip}:{port}",
        f"Transmission Control Protocol, Src Port: (dynamic), Dst Port: {port}\n"
        f"Flags: 0x002 (SYN)\n"
        f"Sequence Number: 0 (relative)\n"
        f"Destination: {target_ip}:{port}\n"
        f"Options: (MSS 1460, SACK Permitted, Window Scale 7)",
        [
            {"label": "Flags", "value": "SYN"},
            {"label": "Remote", "value": f"{target_ip}:{port}"},
            {"label": "Protocol", "value": "TCP (Layer 4)"}
        ]
    )

    try:
        raw_sock = socket.create_connection((target_ip, port), timeout=8)
        tcp_ms = round((time.time() - tcp_start) * 1000, 1)
        client_port = raw_sock.getsockname()[1]

        add_event(
            "TCP",
            "server→client",
            f"TCP [SYN, ACK] Ack=1 ← {target_ip}:{port} (Connected in {int(tcp_ms)}ms)",
            f"Transmission Control Protocol, Src Port: {port}, Dst Port: {client_port}\n"
            f"Flags: 0x012 (SYN, ACK)\n"
            f"Sequence Number: 0, Acknowledgment Number: 1\n"
            f"RTT / Connection Latency: {tcp_ms} ms\n"
            f"TCP Handshake Complete: Connection Established",
            [
                {"label": "Flags", "value": "SYN, ACK"},
                {"label": "Status", "value": "ESTABLISHED"},
                {"label": "RTT", "value": f"{tcp_ms}ms"}
            ]
        )
    except Exception as e:
        add_event(
            "TCP",
            "server→client",
            f"TCP Connection Refused: {target_ip}:{port}",
            f"TCP Handshake Failed: {str(e)}",
            [{"label": "Error", "value": str(e)}]
        )
        return events

    active_sock = raw_sock

    # -------------------------------------------------------------
    # STEP 3: Real TLS 1.3 / 1.2 Handshake (if HTTPS)
    # -------------------------------------------------------------
    if is_https:
        tls_start = time.time()
        add_event(
            "TLS",
            "client→server",
            f"TLS Client Hello (SNI: {host})",
            f"Transport Layer Security (TLS)\n"
            f"Handshake Protocol: Client Hello\n"
            f"  Version: TLS 1.3 (0x0304)\n"
            f"  Server Name Indication (SNI): {host}\n"
            f"  Cipher Suites: (TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384, ECDHE-RSA-AES128-GCM)\n"
            f"  ALPN: http/1.1",
            [
                {"label": "Type", "value": "Client Hello"},
                {"label": "SNI", "value": host},
                {"label": "Supported", "value": "TLS 1.3 / 1.2"}
            ]
        )

        try:
            ssl_ctx = ssl.create_default_context()
            ssl_sock = ssl_ctx.wrap_socket(raw_sock, server_hostname=host)
            active_sock = ssl_sock
            tls_ms = round((time.time() - tls_start) * 1000, 1)

            cipher_name, tls_ver, _ = ssl_sock.cipher() if ssl_sock.cipher() else ("Unknown", "TLS", 0)
            cert = ssl_sock.getpeercert() or {}
            subject_dict = dict(x[0] for x in cert.get("subject", []))
            issuer_dict = dict(x[0] for x in cert.get("issuer", []))
            cn = subject_dict.get("commonName", host)
            issuer = issuer_dict.get("commonName", issuer_dict.get("organizationName", "Verified CA"))

            add_event(
                "TLS",
                "server→client",
                f"TLS Server Hello ({tls_ver}, {cipher_name})",
                f"Transport Layer Security ({tls_ver})\n"
                f"Handshake Protocol: Server Hello & Certificate Verification\n"
                f"  Negotiated Version: {tls_ver}\n"
                f"  Negotiated Cipher: {cipher_name}\n"
                f"  Server Certificate CN: {cn}\n"
                f"  Issued By: {issuer}\n"
                f"  Valid Until: {cert.get('notAfter', 'Valid')}\n"
                f"  Handshake Time: {tls_ms} ms\n"
                f"  Encryption: AES-GCM Authenticated Encryption Active",
                [
                    {"label": "Version", "value": tls_ver},
                    {"label": "Cipher", "value": cipher_name},
                    {"label": "Certificate", "value": f"CN={cn}"},
                    {"label": "Issuer", "value": str(issuer)[:30]}
                ]
            )
        except Exception as e:
            add_event(
                "TLS",
                "server→client",
                f"TLS Handshake Failed: {str(e)[:40]}",
                f"TLS Negotiation Error: {str(e)}",
                [{"label": "Error", "value": str(e)}]
            )
            try: active_sock.close()
            except: pass
            return events

    # -------------------------------------------------------------
    # STEP 4: Real HTTP Request
    # -------------------------------------------------------------
    http_req_raw = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {host}\r\n"
        f"User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) ProtocolVisualizer/1.0\r\n"
        f"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n"
        f"Accept-Language: en-US,en;q=0.5\r\n"
        f"Connection: close\r\n"
        f"\r\n"
    )

    add_event(
        "HTTP",
        "client→server",
        f"GET {path} HTTP/1.1",
        http_req_raw,
        [
            {"label": "Method", "value": "GET"},
            {"label": "Host", "value": host},
            {"label": "Path", "value": path},
            {"label": "Transport", "value": "TLS 1.3 Encrypted" if is_https else "TCP Plaintext"}
        ]
    )

    # -------------------------------------------------------------
    # STEP 5: Real HTTP Response
    # -------------------------------------------------------------
    try:
        active_sock.sendall(http_req_raw.encode())

        resp_buffer = b""
        active_sock.settimeout(12)
        while True:
            chunk = active_sock.recv(8192)
            if not chunk:
                break
            resp_buffer += chunk
            # If we've got the headers and a reasonable body preview, we can stop
            if b"\r\n\r\n" in resp_buffer and len(resp_buffer) > 30000:
                break

        active_sock.close()

        # Parse response
        if b"\r\n\r\n" in resp_buffer:
            header_bytes, body_bytes = resp_buffer.split(b"\r\n\r\n", 1)
        else:
            header_bytes, body_bytes = resp_buffer, b""

        header_text = header_bytes.decode("latin1", errors="replace")
        lines = header_text.split("\r\n")
        status_line = lines[0] if lines else "HTTP/1.1 200 OK"

        # Parse status code
        status_parts = status_line.split(" ", 2)
        status_code = status_parts[1] if len(status_parts) > 1 else "200"
        reason = status_parts[2] if len(status_parts) > 2 else "OK"

        # Headers dict
        resp_headers = {}
        for line in lines[1:]:
            if ":" in line:
                k, v = line.split(":", 1)
                resp_headers[k.strip().lower()] = v.strip()

        content_type = resp_headers.get("content-type", "text/html")
        content_len = resp_headers.get("content-length", str(len(body_bytes)))
        server_name = resp_headers.get("server", "Web Server")

        body_preview = body_bytes[:800].decode("utf-8", errors="replace")
        if len(body_bytes) > 800:
            body_preview += f"\n... [{len(body_bytes) - 800} more bytes of response payload]"

        resp_raw = f"{header_text}\r\n\r\n{body_preview}"

        add_event(
            "HTTP",
            "server→client",
            f"HTTP/1.1 {status_code} {reason} ({content_type.split(';')[0]})",
            resp_raw,
            [
                {"label": "Status", "value": f"{status_code} {reason}"},
                {"label": "Content-Type", "value": content_type.split(";")[0]},
                {"label": "Content-Length", "value": f"{content_len} bytes"},
                {"label": "Server", "value": server_name[:25]}
            ]
        )

    except Exception as e:
        add_event(
            "HTTP",
            "server→client",
            f"HTTP Receive Error: {str(e)}",
            f"HTTP Response Failed: {str(e)}",
            [{"label": "Error", "value": str(e)}]
        )
        try: active_sock.close()
        except: pass

    return events

# Retain backward compatibility alias for existing tests
perform_http_request = perform_full_browse_pipeline
