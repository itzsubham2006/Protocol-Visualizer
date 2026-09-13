"""
API Mailer — Deliver real emails from cloud hosts (Railway/Render) over HTTPS (Port 443).
Bypasses cloud firewall blocks on outbound SMTP ports (25, 465, 587).
Supports Resend API and Brevo API with real protocol event streaming.
"""

import os
import json
import time
import uuid
import httpx
from dataclasses import asdict
from backend.networking.events import ProtocolEvent

async def perform_api_mail_delivery(
    to: str,
    subject: str,
    body: str,
    api_key: str = None,
    from_email: str = None
) -> list[dict]:
    """
    Delivers an email using an HTTPS API (Resend or Brevo) over Port 443.
    Streams real HTTP protocol request/response events into the visualizer.
    """
    events = []
    start_time = time.time()
    conv_id = uuid.uuid4().hex[:6]
    step_counter = 0

    def get_offset():
        return round((time.time() - start_time) * 1000, 1)

    def add_event(direction, summary, raw, key_fields):
        nonlocal step_counter
        evt = ProtocolEvent(
            id=f"mail-api-{conv_id}-{step_counter}",
            protocol="HTTP",
            direction=direction,
            summary=summary,
            raw=raw.rstrip(),
            keyFields=key_fields,
            offsetMs=get_offset(),
            status="real",
        )
        events.append(asdict(evt))
        step_counter += 1

    resend_key = (api_key.strip() if api_key and api_key.strip() else os.getenv("RESEND_API_KEY", "")).strip()
    brevo_key = os.getenv("BREVO_API_KEY", "").strip()

    if resend_key:
        sender = from_email.strip() if from_email and from_email.strip() else "Protocol Visualizer <onboarding@resend.dev>"
        payload = {
            "from": sender,
            "to": [to.strip()],
            "subject": subject.strip(),
            "text": body.strip(),
        }
        headers = {
            "Authorization": f"Bearer {resend_key}",
            "Content-Type": "application/json",
            "User-Agent": "Protocol-Visualizer/1.0",
        }
        masked_key = f"{resend_key[:6]}...{resend_key[-4:]}" if len(resend_key) > 10 else "***"
        raw_req = (
            f"POST /emails HTTP/1.1\r\n"
            f"Host: api.resend.com\r\n"
            f"Authorization: Bearer {masked_key}\r\n"
            f"Content-Type: application/json\r\n"
            f"User-Agent: Protocol-Visualizer/1.0\r\n\r\n"
            + json.dumps(payload, indent=2)
        )
        add_event(
            "client→server",
            f"POST /emails to api.resend.com (Recipient: {to.strip()})",
            raw_req,
            [
                {"label": "Method", "value": "POST"},
                {"label": "Endpoint", "value": "https://api.resend.com/emails"},
                {"label": "Transport", "value": "HTTPS/TLS (Port 443 - Cloud Allowed)"},
                {"label": "Recipient", "value": to.strip()},
            ],
        )

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post("https://api.resend.com/emails", json=payload, headers=headers)
                status_code = res.status_code
                res_body = res.text
                if status_code in (200, 201):
                    data = res.json()
                    email_id = data.get("id", "N/A")
                    add_event(
                        "server→client",
                        f"HTTP {status_code} OK — Real Email Dispatched to Inbox via Resend",
                        f"HTTP/1.1 {status_code} OK\r\nContent-Type: application/json\r\n\r\n{res_body}",
                        [
                            {"label": "Status", "value": f"{status_code} OK"},
                            {"label": "Message ID", "value": email_id},
                            {"label": "Delivery Status", "value": "Dispatched to Recipient Inbox"},
                        ],
                    )
                else:
                    add_event(
                        "server→client",
                        f"HTTP {status_code} Error from Resend API",
                        f"HTTP/1.1 {status_code}\r\nContent-Type: application/json\r\n\r\n{res_body}",
                        [
                            {"label": "Status", "value": str(status_code)},
                            {"label": "Error", "value": res_body[:120]},
                        ],
                    )
        except Exception as e:
            add_event(
                "server→client",
                f"Connection Error contacting Resend API: {e}",
                f"Connection failed: {str(e)}",
                [{"label": "Error", "value": str(e)}],
            )
        return events

    elif brevo_key:
        sender_email = from_email.strip() if from_email and from_email.strip() else "noreply@protocol-visualizer.app"
        payload = {
            "sender": {"name": "Protocol Visualizer", "email": sender_email},
            "to": [{"email": to.strip()}],
            "subject": subject.strip(),
            "textContent": body.strip(),
        }
        headers = {
            "api-key": brevo_key,
            "Content-Type": "application/json",
            "User-Agent": "Protocol-Visualizer/1.0",
        }
        masked_key = f"{brevo_key[:6]}...{brevo_key[-4:]}" if len(brevo_key) > 10 else "***"
        raw_req = (
            f"POST /v3/smtp/email HTTP/1.1\r\n"
            f"Host: api.brevo.com\r\n"
            f"api-key: {masked_key}\r\n"
            f"Content-Type: application/json\r\n\r\n"
            + json.dumps(payload, indent=2)
        )
        add_event(
            "client→server",
            f"POST /v3/smtp/email to api.brevo.com (Recipient: {to.strip()})",
            raw_req,
            [
                {"label": "Method", "value": "POST"},
                {"label": "Endpoint", "value": "https://api.brevo.com/v3/smtp/email"},
                {"label": "Transport", "value": "HTTPS/TLS (Port 443 - Cloud Allowed)"},
                {"label": "Recipient", "value": to.strip()},
            ],
        )

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post("https://api.brevo.com/v3/smtp/email", json=payload, headers=headers)
                status_code = res.status_code
                res_body = res.text
                if status_code in (200, 201, 202):
                    data = res.json()
                    email_id = data.get("messageId", "N/A")
                    add_event(
                        "server→client",
                        f"HTTP {status_code} OK — Real Email Dispatched to Inbox via Brevo",
                        f"HTTP/1.1 {status_code} OK\r\nContent-Type: application/json\r\n\r\n{res_body}",
                        [
                            {"label": "Status", "value": f"{status_code} OK"},
                            {"label": "Message ID", "value": email_id},
                            {"label": "Delivery Status", "value": "Dispatched to Recipient Inbox"},
                        ],
                    )
                else:
                    add_event(
                        "server→client",
                        f"HTTP {status_code} Error from Brevo API",
                        f"HTTP/1.1 {status_code}\r\nContent-Type: application/json\r\n\r\n{res_body}",
                        [
                            {"label": "Status", "value": str(status_code)},
                            {"label": "Error", "value": res_body[:120]},
                        ],
                    )
        except Exception as e:
            add_event(
                "server→client",
                f"Connection Error contacting Brevo API: {e}",
                f"Connection failed: {str(e)}",
                [{"label": "Error", "value": str(e)}],
            )
        return events

    else:
        # Neither Resend nor Brevo key configured
        add_event(
            "server→client",
            "No Cloud HTTPS Email API Key Configured",
            (
                "To deliver real emails from cloud platforms (Railway/Render) without SMTP port blocking:\n\n"
                "1. Sign up for a free Resend account at https://resend.com (takes 30 seconds, no credit card needed)\n"
                "2. Create an API Key (re_...)\n"
                "3. Set RESEND_API_KEY in your Railway Variables or enter it in the visualizer UI\n"
                "4. All emails will be delivered over HTTPS (Port 443) directly to recipient inboxes!"
            ),
            [
                {"label": "Error", "value": "Missing RESEND_API_KEY"},
                {"label": "Port 443", "value": "HTTPS Allowed on Cloud"},
            ],
        )
        return events
