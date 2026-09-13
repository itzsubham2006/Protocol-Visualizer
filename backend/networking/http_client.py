import httpx
import time
import uuid
from backend.networking.events import ProtocolEvent
from dataclasses import asdict
from urllib.parse import urlparse

async def perform_http_request(url: str) -> list[dict]:
    events = []
    start_time = time.time()
    req_id = uuid.uuid4().hex[:6]

    normalized_url = url.strip()
    if not normalized_url.startswith(("http://", "https://")):
        normalized_url = f"https://{normalized_url}"

    parsed_url = urlparse(normalized_url)
    host = parsed_url.hostname or "unknown"
    port_suffix = f":{parsed_url.port}" if parsed_url.port and parsed_url.port not in (80, 443) else ""
    path = parsed_url.path or "/"
    if parsed_url.query:
        path += f"?{parsed_url.query}"

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=12.0) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ProtocolVisualizer/1.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Connection": "keep-alive",
            }
            req = client.build_request("GET", normalized_url, headers=headers)

            req_headers_str = f"GET {path} HTTP/1.1\r\nHost: {host}{port_suffix}\r\n"
            for k, v in req.headers.items():
                if k.lower() != "host":
                    req_headers_str += f"{k}: {v}\r\n"
            req_headers_str += "\r\n"

            key_fields_req = [
                {"label": "Method", "value": "GET"},
                {"label": "Host", "value": f"{host}{port_suffix}"},
                {"label": "Path", "value": path}
            ]
            if parsed_url.scheme == "https":
                key_fields_req.append({"label": "Transport", "value": "HTTPS/TLS (Encrypted)"})
            else:
                key_fields_req.append({"label": "Transport", "value": "Plaintext HTTP"})

            query_event = ProtocolEvent(
                id=f"http-{req_id}-req",
                protocol="HTTP",
                direction="client→server",
                summary=f"GET {path} HTTP/1.1",
                raw=req_headers_str,
                keyFields=key_fields_req,
                offsetMs=0.0,
                status="real"
            )
            events.append(asdict(query_event))

            resp = await client.send(req)
            elapsed_ms = round((time.time() - start_time) * 1000, 1)

            resp_headers_str = f"HTTP/{resp.http_version} {resp.status_code} {resp.reason_phrase}\r\n"
            for k, v in resp.headers.items():
                resp_headers_str += f"{k}: {v}\r\n"
            resp_headers_str += "\r\n"

            content_type = resp.headers.get("content-type", "")

            if "text" in content_type or "json" in content_type or "xml" in content_type:
                body_snippet = resp.text[:600]
                if len(resp.text) > 600:
                    body_snippet += f"\n... [{len(resp.text) - 600} more bytes truncated]"
            else:
                body_snippet = f"[binary data: {len(resp.content)} bytes]"

            resp_headers_str += body_snippet

            key_fields_resp = [
                {"label": "Status", "value": f"{resp.status_code} {resp.reason_phrase}"},
                {"label": "Content-Type", "value": content_type or "none"},
                {"label": "Content-Length", "value": resp.headers.get("content-length", str(len(resp.content)))},
            ]
            if "server" in resp.headers:
                key_fields_resp.append({"label": "Server", "value": resp.headers["server"]})

            resp_event = ProtocolEvent(
                id=f"http-{req_id}-resp",
                protocol="HTTP",
                direction="server→client",
                summary=f"HTTP/1.1 {resp.status_code} {resp.reason_phrase}",
                raw=resp_headers_str,
                keyFields=key_fields_resp,
                offsetMs=elapsed_ms,
                status="real"
            )
            events.append(asdict(resp_event))

    except Exception as e:
        elapsed_ms = round((time.time() - start_time) * 1000, 1)
        err_msg = str(e)
        err_event = ProtocolEvent(
            id=f"http-{req_id}-err",
            protocol="HTTP",
            direction="server→client",
            summary=f"HTTP Request Failed: {err_msg[:60]}",
            raw=f"HTTP/1.1 Client Connection Error\r\n\r\nRequest to {normalized_url} failed:\r\n{err_msg}",
            keyFields=[{"label": "Status", "value": "Connection Failed"}, {"label": "Error", "value": err_msg[:80]}],
            offsetMs=elapsed_ms,
            status="real"
        )
        events.append(asdict(err_event))

    return events
