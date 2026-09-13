"""
Comprehensive test suite for Protocol Visualizer real networking components.
Uses standard asyncio.run for maximum compatibility.
"""

import asyncio
import socket
import time
import pytest

from backend.networking.dns_client import resolve_dns
from backend.networking.http_client import perform_http_request
from backend.networking.smtp_client import perform_smtp_conversation
from backend.networking.stream_service import (
    generate_master_playlist,
    generate_variant_playlist,
    generate_segment_data,
    perform_streaming_session
)
from backend.smtp_server import handle_smtp_client

def test_dns_resolution_real_domain():
    print("\n--- Testing Real DNS Resolution (example.com) ---")
    events = asyncio.run(resolve_dns("example.com"))
    assert len(events) >= 2, f"Expected at least 2 DNS events, got {len(events)}"

    query = events[0]
    assert query["protocol"] == "DNS"
    assert query["direction"] == "client→server"
    assert "example.com" in query["summary"]
    assert query["status"] == "real"

    resp = events[1]
    assert resp["protocol"] == "DNS"
    assert resp["direction"] == "server→client"
    assert resp["status"] == "real"
    print(f"Query: {query['summary'].encode('ascii', 'replace').decode('ascii')}")
    print(f"Response: {resp['summary'].encode('ascii', 'replace').decode('ascii')}")
    print("DNS resolution test passed!")

def test_dns_ip_literal():
    print("\n--- Testing DNS for IP Literal (127.0.0.1) ---")
    events = asyncio.run(resolve_dns("127.0.0.1"))
    assert len(events) == 1
    assert "bypassed" in events[0]["summary"].lower()
    print("IP literal test passed!")

def test_dns_resolution_error():
    print("\n--- Testing DNS Resolution Error ---")
    events = asyncio.run(resolve_dns("nonexistent-domain-xyz123456789.test"))
    assert len(events) >= 2
    err_event = events[-1]
    assert "failed" in err_event["summary"].lower() or "error" in err_event["summary"].lower()
    assert err_event["status"] == "real"
    print("DNS error handling test passed!")

def test_http_request_real_url():
    print("\n--- Testing Real Full Browsing Pipeline (https://example.com) ---")
    events = asyncio.run(perform_http_request("https://example.com"))
    assert len(events) >= 4, f"Expected at least 4 pipeline events (TCP, TLS, HTTP), got {len(events)}"

    protocols = [e["protocol"] for e in events]
    assert "TCP" in protocols, "Missing TCP handshake event"
    assert "TLS" in protocols, "Missing TLS handshake event"
    assert "HTTP" in protocols, "Missing HTTP event"

    http_resp = next(e for e in events if e["protocol"] == "HTTP" and e["direction"] == "server→client")
    assert "200" in http_resp["summary"]
    assert all(e["status"] == "real" for e in events)
    print("Full browsing pipeline test passed!")

def test_smtp_conversation_with_local_server():
    print("\n--- Testing SMTP TCP Conversation with Local Server ---")

    async def run_test():
        server = await asyncio.start_server(handle_smtp_client, "127.0.0.1", 2527)
        server_task = asyncio.create_task(server.serve_forever())

        try:
            await asyncio.sleep(0.1)

            loop = asyncio.get_running_loop()
            events = await loop.run_in_executor(
                None,
                perform_smtp_conversation,
                "u24cse1034@cit.ac.in",
                "Test Email Subject",
                "Hello from Protocol Visualizer Automated Test",
                "127.0.0.1",
                2527
            )

            assert len(events) >= 10, f"Expected at least 10 SMTP conversation events, got {len(events)}"

            summaries = [e["summary"] for e in events]
            print("Captured SMTP steps:")
            for s in summaries:
                print(f"  - {s}")

            assert any("220" in s for s in summaries), "Missing 220 greeting"
            assert any("EHLO" in s for s in summaries), "Missing EHLO"
            assert any("MAIL FROM" in s for s in summaries), "Missing MAIL FROM"
            assert any("RCPT TO" in s for s in summaries), "Missing RCPT TO"
            assert any("DATA" in s for s in summaries), "Missing DATA"
            assert any("QUIT" in s for s in summaries), "Missing QUIT"
            assert all(e["status"] == "real" for e in events), "All events should have status='real'"

            msg_event = next(e for e in events if 'Message: "Test Email Subject"' in e["summary"])
            assert "u24cse1034@cit.ac.in" in msg_event["raw"]
            assert "Hello from Protocol Visualizer Automated Test" in msg_event["raw"]
            print("SMTP TCP conversation test passed!")

        finally:
            server.close()
            await server.wait_closed()
            server_task.cancel()
            try:
                await server_task
            except asyncio.CancelledError:
                pass

    asyncio.run(run_test())

def test_smtp_server_unavailable():
    print("\n--- Testing SMTP Server Unavailable (Connection Refused) ---")
    events = perform_smtp_conversation(
        "test@example.com",
        "Subject",
        "Body",
        smtp_port=2529
    )
    assert len(events) == 1
    assert "Cannot connect to SMTP test server" in events[0]["summary"]
    assert events[0]["status"] == "real"
    print("SMTP connection error test passed!")

def test_hls_generation():
    print("\n--- Testing HLS Media Generation ---")
    master = generate_master_playlist()
    assert "#EXTM3U" in master
    assert "720p" in master

    variant = generate_variant_playlist("720p", 4)
    assert "#EXTM3U" in variant
    assert "segment0.ts" in variant
    assert "segment3.ts" in variant

    seg = generate_segment_data("720p", 0)
    assert len(seg) == 188
    assert seg[0] == 0x47
    print("HLS generation test passed!")

if __name__ == "__main__":
    pytest.main(["-v", "-s", __file__])
