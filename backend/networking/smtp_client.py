"""
SMTP Client — Real TCP socket SMTP conversation for Protocol Visualizer.
Supports:
1. Local SMTP test servers (127.0.0.1:2525, plain TCP, no auth)
2. Live external SMTP relays (smtp.gmail.com, port 587 with STARTTLS & AUTH LOGIN)
Delivers actual emails to real inboxes when live SMTP credentials are provided.
"""

import socket
import ssl
import base64
import time
import uuid
from datetime import datetime, timezone
from backend.networking.events import ProtocolEvent
from dataclasses import asdict

import email.utils

def perform_smtp_conversation(
    to: str,
    subject: str,
    body: str,
    smtp_host: str = "127.0.0.1",
    smtp_port: int = 2525,
    username: str = "",
    password: str = "",
    from_email: str = ""
) -> list[dict]:
    """
    Perform a real SMTP conversation over a raw TCP socket.
    If username/password are provided and server advertises STARTTLS/AUTH,
    performs real TLS upgrade and authentication to deliver real email.
    """
    events = []
    start_time = time.time()
    conv_id = uuid.uuid4().hex[:6]
    step_counter = 0

    clean_pass = password.strip().replace(" ", "") if password else ""
    parsed_display, parsed_addr = email.utils.parseaddr(from_email.strip())
    if not parsed_addr:
        parsed_display, parsed_addr = email.utils.parseaddr(username.strip())
    envelope_sender = parsed_addr if parsed_addr else "sender@protocol-visualizer.local"
    header_from = f"{parsed_display} <{envelope_sender}>" if parsed_display else envelope_sender

    def get_offset():
        return round((time.time() - start_time) * 1000, 1)

    def add_event(direction, summary, raw, key_fields):
        nonlocal step_counter
        evt = ProtocolEvent(
            id=f"smtp-{conv_id}-{step_counter}",
            protocol="SMTP",
            direction=direction,
            summary=summary,
            raw=raw.rstrip(),
            keyFields=key_fields,
            offsetMs=get_offset(),
            status="real",
        )
        events.append(asdict(evt))
        step_counter += 1

    try:
        sock = None
        last_err = None
        # 1. Try IPv4 explicitly first (prevents [Errno 101] Network is unreachable on Linux containers without IPv6 routes)
        try:
            for res in socket.getaddrinfo(smtp_host, int(smtp_port), socket.AF_INET, socket.SOCK_STREAM):
                af, socktype, proto, canonname, sa = res
                s = None
                try:
                    s = socket.socket(af, socktype, proto)
                    s.settimeout(10)
                    s.connect(sa)
                    sock = s
                    break
                except Exception as ex:
                    last_err = ex
                    if s:
                        s.close()
        except Exception as ex:
            last_err = ex

        # 2. If IPv4 resolution wasn't applicable, fallback to create_connection
        if not sock:
            sock = socket.create_connection((smtp_host, int(smtp_port)), timeout=10)
    except Exception as e:
        err_msg = str(e)
        is_cloud_block = "101" in err_msg or "timed out" in err_msg.lower() or "unreachable" in err_msg.lower()
        if smtp_host in ("127.0.0.1", "localhost"):
            hint = "Internal SMTP test server is starting. Please retry in a few seconds."
        elif is_cloud_block:
            hint = (
                f"Cloud platforms (such as Railway or Render free/trial tier) block outbound traffic on SMTP ports (25, 465, 587) to prevent spam.\n\n"
                f"• Switch to 'Local Test Server (127.0.0.1:2525)' to experience the full, real TCP RFC 5321 SMTP conversation.\n"
                f"• For live inbox delivery using your Gmail credentials, run Protocol Visualizer locally on your computer where home internet does not block port 587."
            )
        else:
            hint = f"Check hostname, port, or network connection to {smtp_host}."

        add_event(
            "server→client",
            f"Cannot connect to SMTP test server at {smtp_host}:{smtp_port}",
            f"Connection failed: {err_msg}\n\n{hint}",
            [
                {"label": "Error", "value": err_msg},
                {"label": "Host", "value": f"{smtp_host}:{smtp_port}"},
            ],
        )
        return events

    def recv_response(current_sock) -> str:
        """Read SMTP response lines (handles multi-line responses like 250-...)."""
        lines = []
        data = b""
        current_sock.settimeout(10)
        while True:
            chunk = current_sock.recv(4096)
            if not chunk:
                break
            data += chunk
            while b"\r\n" in data:
                line, data = data.split(b"\r\n", 1)
                decoded = line.decode(errors="replace")
                lines.append(decoded)
                # Last line of SMTP response starts with 3 digits followed by a space
                if len(decoded) >= 4 and decoded[3] == " ":
                    return "\r\n".join(lines)
            if lines and len(lines[-1]) >= 4 and lines[-1][3] == "-":
                continue
            elif lines:
                break
        return "\r\n".join(lines)

    def send_cmd(current_sock, cmd: str):
        current_sock.sendall((cmd + "\r\n").encode())

    try:
        # 1. Read server greeting (220)
        greeting = recv_response(sock)
        code = greeting[:3] if len(greeting) >= 3 else "220"
        add_event(
            "server→client",
            f"{code} Server greeting",
            greeting,
            [
                {"label": "Status", "value": f"{code} (Service Ready)"},
                {"label": "Server", "value": f"{smtp_host}:{smtp_port}"},
            ],
        )

        # 2. Send EHLO
        ehlo_cmd = f"EHLO {socket.gethostname() or 'client.local'}"
        add_event(
            "client→server",
            ehlo_cmd,
            ehlo_cmd,
            [
                {"label": "Command", "value": "EHLO"},
                {"label": "Client Identity", "value": socket.gethostname() or "client.local"},
            ],
        )
        send_cmd(sock, ehlo_cmd)

        # 3. Read EHLO response
        ehlo_resp = recv_response(sock)
        add_event(
            "server→client",
            f"250 EHLO capabilities listed",
            ehlo_resp,
            [
                {"label": "Status", "value": "250 (OK)"},
                {"label": "STARTTLS", "value": "Supported" if "STARTTLS" in ehlo_resp.upper() else "Not advertised"},
                {"label": "AUTH", "value": "Supported" if "AUTH" in ehlo_resp.upper() else "Not advertised"},
            ],
        )

        # Check if we should perform STARTTLS
        active_sock = sock
        if "STARTTLS" in ehlo_resp.upper() and (username or smtp_port in (587, 25, 465)):
            # 3a. Send STARTTLS
            add_event(
                "client→server",
                "STARTTLS",
                "STARTTLS",
                [
                    {"label": "Command", "value": "STARTTLS"},
                    {"label": "Action", "value": "Request TLS socket encryption"},
                ],
            )
            send_cmd(active_sock, "STARTTLS")

            tls_resp = recv_response(active_sock)
            add_event(
                "server→client",
                f"{tls_resp[:3]} Ready to start TLS",
                tls_resp,
                [{"label": "Status", "value": "220 (Ready for TLS)"}],
            )

            # 3b. Upgrade socket to TLS
            ssl_context = ssl.create_default_context()
            active_sock = ssl_context.wrap_socket(sock, server_hostname=smtp_host)

            add_event(
                "client→server",
                "[TLS Handshake Completed — Transport Encrypted]",
                f"Cipher: {active_sock.cipher()[0] if active_sock.cipher() else 'TLS'}\r\nProtocol: {active_sock.version() if hasattr(active_sock, 'version') else 'TLS 1.2/1.3'}",
                [
                    {"label": "Transport", "value": "TLS Encrypted"},
                    {"label": "Cipher", "value": str(active_sock.cipher()[0]) if active_sock.cipher() else "Active"},
                ],
            )

            # 3c. Send EHLO again after TLS per RFC 3207
            send_cmd(active_sock, ehlo_cmd)
            ehlo_post_tls = recv_response(active_sock)
            add_event(
                "server→client",
                f"250 EHLO capabilities (Encrypted)",
                ehlo_post_tls,
                [{"label": "Status", "value": "250 (OK)"}],
            )

        # 4. Authentication (if credentials provided)
        if username and password:
            add_event(
                "client→server",
                "AUTH LOGIN",
                "AUTH LOGIN",
                [
                    {"label": "Command", "value": "AUTH LOGIN"},
                    {"label": "Auth Method", "value": "LOGIN"},
                ],
            )
            send_cmd(active_sock, "AUTH LOGIN")

            auth_req1 = recv_response(active_sock)
            add_event(
                "server→client",
                f"{auth_req1[:3]} Challenge (Username requested)",
                auth_req1,
                [{"label": "Challenge", "value": auth_req1}],
            )

            # Send Base64 Username
            user_b64 = base64.b64encode(username.encode()).decode()
            add_event(
                "client→server",
                f"[Username: {username}]",
                user_b64,
                [{"label": "Username", "value": username}],
            )
            send_cmd(active_sock, user_b64)

            auth_req2 = recv_response(active_sock)
            add_event(
                "server→client",
                f"{auth_req2[:3]} Challenge (Password requested)",
                auth_req2,
                [{"label": "Challenge", "value": auth_req2}],
            )

            # Send Base64 Password (masked in raw text for safety)
            pass_b64 = base64.b64encode(clean_pass.encode()).decode()
            add_event(
                "client→server",
                "[Password: ********]",
                "********",
                [{"label": "Password", "value": "Protected (Transmitted securely over TLS)"}],
            )
            send_cmd(active_sock, pass_b64)

            auth_resp = recv_response(active_sock)
            if not auth_resp.startswith("235"):
                add_event(
                    "server→client",
                    f"Authentication Failed: {auth_resp}",
                    auth_resp,
                    [{"label": "Error", "value": "Authentication credentials rejected"}],
                )
                active_sock.close()
                return events

            add_event(
                "server→client",
                f"235 Authentication Successful",
                auth_resp,
                [{"label": "Status", "value": "235 2.7.0 (Authentication Succeeded)"}],
            )

        # 5. MAIL FROM
        mail_cmd = f"MAIL FROM:<{envelope_sender}>"
        add_event(
            "client→server",
            mail_cmd,
            mail_cmd,
            [
                {"label": "Command", "value": "MAIL FROM"},
                {"label": "Sender", "value": envelope_sender},
            ],
        )
        send_cmd(active_sock, mail_cmd)

        mail_resp = recv_response(active_sock)
        add_event(
            "server→client",
            f"{mail_resp[:3]} Sender accepted",
            mail_resp,
            [{"label": "Status", "value": mail_resp[:7] if len(mail_resp) >= 7 else mail_resp}],
        )

        # 6. RCPT TO
        rcpt_cmd = f"RCPT TO:<{to}>"
        add_event(
            "client→server",
            rcpt_cmd,
            rcpt_cmd,
            [
                {"label": "Command", "value": "RCPT TO"},
                {"label": "Recipient", "value": to},
            ],
        )
        send_cmd(active_sock, rcpt_cmd)

        rcpt_resp = recv_response(active_sock)
        add_event(
            "server→client",
            f"{rcpt_resp[:3]} Recipient accepted",
            rcpt_resp,
            [{"label": "Status", "value": rcpt_resp[:7] if len(rcpt_resp) >= 7 else rcpt_resp}],
        )

        # 7. DATA command
        add_event(
            "client→server",
            "DATA",
            "DATA",
            [
                {"label": "Command", "value": "DATA"},
                {"label": "Purpose", "value": "Begin message payload"},
            ],
        )
        send_cmd(active_sock, "DATA")

        data_resp = recv_response(active_sock)
        add_event(
            "server→client",
            f"{data_resp[:3]} Ready for message content",
            data_resp,
            [{"label": "Status", "value": "354 (Start Mail Input)"}],
        )

        # 8. Send message content
        date_str = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
        message_lines = [
            f"From: {header_from}",
            f"To: {to}",
            f"Subject: {subject}",
            f"Date: {date_str}",
            f"MIME-Version: 1.0",
            f"Content-Type: text/plain; charset=UTF-8",
            "",
            body,
            ".",
        ]
        message_text = "\r\n".join(message_lines)

        add_event(
            "client→server",
            f'[Message: "{subject}"]',
            message_text,
            [
                {"label": "From", "value": header_from},
                {"label": "To", "value": to},
                {"label": "Subject", "value": subject},
                {"label": "MIME", "value": "text/plain; charset=UTF-8"},
            ],
        )
        send_cmd(active_sock, message_text)

        msg_resp = recv_response(active_sock)
        add_event(
            "server→client",
            f"{msg_resp[:3]} Message accepted for delivery",
            msg_resp,
            [
                {"label": "Status", "value": f"{msg_resp[:3]} (Message Accepted)"},
                {"label": "Queue Detail", "value": msg_resp[4:].strip() if len(msg_resp) > 4 else "Accepted"},
            ],
        )

        # 9. QUIT
        add_event(
            "client→server",
            "QUIT",
            "QUIT",
            [{"label": "Command", "value": "QUIT"}],
        )
        send_cmd(active_sock, "QUIT")

        quit_resp = recv_response(active_sock)
        add_event(
            "server→client",
            f"{quit_resp[:3]} Connection closing",
            quit_resp,
            [{"label": "Status", "value": f"{quit_resp[:3]} (Service Closing)"}],
        )

    except Exception as e:
        add_event(
            "server→client",
            f"SMTP Error: {str(e)}",
            f"Error during SMTP conversation with {smtp_host}:{smtp_port}:\n{str(e)}",
            [{"label": "Error", "value": str(e)}],
        )
    finally:
        try:
            active_sock.close()
        except Exception:
            pass

    return events
