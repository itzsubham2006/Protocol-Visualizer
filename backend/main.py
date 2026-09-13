import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse, Response
from urllib.parse import urlparse
import uvicorn
import asyncio
from dotenv import load_dotenv

# Load .env file at startup
load_dotenv()

from backend.networking.dns_client import resolve_dns
from backend.networking.http_client import perform_http_request
from backend.networking.smtp_client import perform_smtp_conversation
from backend.networking.stream_service import (
    generate_master_playlist,
    generate_variant_playlist,
    generate_segment_data,
    perform_streaming_session
)
from backend.networking.events import event_to_sse, done_sse

app = FastAPI(title="Protocol Visualizer Real Network Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/status")
def status():
    return {
        "mode": "real_network",
        "message": "Protocol communication uses real network requests/sockets."
    }

@app.get("/api/mail/config")
def mail_config():
    """Returns current SMTP configuration status from .env."""
    load_dotenv(override=True)  # reload in case user updated .env while server runs
    host = os.getenv("SMTP_HOST", "127.0.0.1").strip()
    port = int(os.getenv("SMTP_PORT", "2525") or "2525")
    user = os.getenv("SMTP_USER", "").strip()
    has_pass = bool(os.getenv("SMTP_PASS", "").strip())
    from_email = os.getenv("SMTP_FROM", "").strip() or user
    is_live = bool(user and has_pass and host not in ("127.0.0.1", "localhost"))

    return {
        "is_live": is_live,
        "host": host,
        "port": port,
        "user": user,
        "from_email": from_email,
        "has_password": has_pass,
    }

@app.get("/api/browse/stream")
async def browse_stream(url: str):
    async def event_generator():
        normalized_url = url.strip()
        if not normalized_url.startswith(("http://", "https://")):
            normalized_url = f"https://{normalized_url}"

        parsed = urlparse(normalized_url)
        hostname = parsed.hostname or normalized_url

        # 1. Real DNS resolution
        dns_events = await resolve_dns(hostname)
        resolved_ip = None
        for ev in dns_events:
            for kf in ev.get("keyFields", []):
                if kf.get("label") == "Resolved IP":
                    resolved_ip = kf.get("value")
            yield event_to_sse(ev)
            await asyncio.sleep(0.01)

        last_dns_offset = dns_events[-1]["offsetMs"] if dns_events else 0

        # 2, 3, 4, 5. Real TCP connect -> TLS handshake -> HTTP request -> HTTP response
        from backend.networking.http_client import perform_full_browse_pipeline
        pipeline_events = await perform_full_browse_pipeline(normalized_url, pre_resolved_ip=resolved_ip)
        for ev in pipeline_events:
            ev["offsetMs"] += last_dns_offset + 20
            yield event_to_sse(ev)
            await asyncio.sleep(0.01)

        yield done_sse()

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/mail/send")
async def mail_send(
    to: str,
    subject: str,
    body: str,
    smtp_host: str = None,
    smtp_port: int = None,
    username: str = None,
    password: str = None,
    from_email: str = None
):
    # Reload .env in case user just edited it
    load_dotenv(override=True)

    env_host = os.getenv("SMTP_HOST", "127.0.0.1").strip()
    env_port = int(os.getenv("SMTP_PORT", "2525") or "2525")
    env_user = os.getenv("SMTP_USER", "").strip()
    env_pass = os.getenv("SMTP_PASS", "").strip()
    env_from = os.getenv("SMTP_FROM", "").strip() or env_user

    actual_host = (smtp_host.strip() if smtp_host and smtp_host.strip() else env_host) or "127.0.0.1"
    actual_port = smtp_port if smtp_port is not None else env_port
    actual_user = username.strip() if username and username.strip() else env_user
    actual_pass = password if password is not None and password != "" else env_pass
    actual_from = from_email.strip() if from_email and from_email.strip() else env_from

    async def event_generator():
        events = perform_smtp_conversation(
            to=to,
            subject=subject,
            body=body,
            smtp_host=actual_host,
            smtp_port=actual_port,
            username=actual_user,
            password=actual_pass,
            from_email=actual_from
        )
        for ev in events:
            yield event_to_sse(ev)
            await asyncio.sleep(0.01)
        yield done_sse()

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/stream/start")
async def stream_start(request: Request, quality: str = "720p", segments: int = 6):
    async def event_generator():
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        events = await perform_streaming_session(quality, segments, base_url)
        for ev in events:
            yield event_to_sse(ev)
            await asyncio.sleep(0.01)
        yield done_sse()

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/stream/media/master.m3u8")
def get_master():
    content = generate_master_playlist()
    return Response(content=content, media_type="application/vnd.apple.mpegurl")

@app.get("/api/stream/media/{quality}/playlist.m3u8")
def get_playlist(quality: str):
    content = generate_variant_playlist(quality, 6)
    return Response(content=content, media_type="application/vnd.apple.mpegurl")

@app.get("/api/stream/media/{quality}/segment{index}.ts")
def get_segment(quality: str, index: int):
    content = generate_segment_data(quality, index)
    return Response(content=content, media_type="video/mp2t")

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
