"""
FastAPI endpoints integration test for Protocol Visualizer.
"""

import asyncio
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api_status():
    resp = client.get("/api/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] == "real_network"
    assert "Protocol communication" in data["message"]
    print("Status endpoint test passed!")

def test_api_stream_media_master():
    resp = client.get("/api/stream/media/master.m3u8")
    assert resp.status_code == 200
    assert "#EXTM3U" in resp.text
    assert "application/vnd.apple.mpegurl" in resp.headers["content-type"]
    print("Master playlist test passed!")

def test_api_stream_media_playlist():
    resp = client.get("/api/stream/media/720p/playlist.m3u8")
    assert resp.status_code == 200
    assert "#EXTM3U" in resp.text
    assert "segment0.ts" in resp.text
    print("Variant playlist test passed!")

def test_api_stream_media_segment():
    resp = client.get("/api/stream/media/720p/segment0.ts")
    assert resp.status_code == 200
    assert resp.content[0] == 0x47  # TS sync byte
    assert "video/mp2t" in resp.headers["content-type"]
    print("Segment fetch test passed!")

def test_api_browse_stream_sse():
    with client.stream("GET", "/api/browse/stream?url=https://example.com") as resp:
        assert resp.status_code == 200
        assert "text/event-stream" in resp.headers["content-type"]
        body = resp.read().decode("utf-8")
        assert "data: " in body
        assert "[DONE]" in body
        assert "DNS" in body
        assert "HTTP" in body
        print("Browse SSE stream test passed!")

def test_api_mail_send_unavailable_sse():
    with client.stream("GET", "/api/mail/send?to=u24cse1034@cit.ac.in&subject=Test&body=Hello&smtp_port=2529") as resp:
        assert resp.status_code == 200
        body = resp.read().decode("utf-8")
        assert "data: " in body
        assert "[DONE]" in body
        assert "Cannot connect to SMTP test server" in body
        print("Mail SSE stream (server offline error) test passed!")
