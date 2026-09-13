"""
Streaming Service — Real HLS streaming with actual HTTP requests.
Generates HLS playlists and segments, then performs real HTTP fetches to visualize them.
"""

import httpx
import time
import uuid
from backend.networking.events import ProtocolEvent
from dataclasses import asdict


QUALITIES = {
    "360p":  {"bandwidth": 800000,  "resolution": "640x360"},
    "720p":  {"bandwidth": 2800000, "resolution": "1280x720"},
    "1080p": {"bandwidth": 5000000, "resolution": "1920x1080"},
}


def generate_master_playlist() -> str:
    return (
        "#EXTM3U\n"
        "#EXT-X-VERSION:3\n"
        "\n"
        '#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,CODECS="avc1.42e00a,mp4a.40.2"\n'
        "/api/stream/media/360p/playlist.m3u8\n"
        "\n"
        '#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720,CODECS="avc1.4d401f,mp4a.40.2"\n'
        "/api/stream/media/720p/playlist.m3u8\n"
        "\n"
        '#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"\n'
        "/api/stream/media/1080p/playlist.m3u8\n"
    )


def generate_variant_playlist(quality: str, segment_count: int) -> str:
    lines = [
        "#EXTM3U",
        "#EXT-X-VERSION:3",
        "#EXT-X-TARGETDURATION:6",
        "#EXT-X-MEDIA-SEQUENCE:0",
        "#EXT-X-PLAYLIST-TYPE:VOD",
    ]
    for i in range(segment_count):
        lines.append(f"#EXTINF:6.006,")
        lines.append(f"/api/stream/media/{quality}/segment{i}.ts")
    lines.append("#EXT-X-ENDLIST")
    return "\n".join(lines) + "\n"


def generate_segment_data(quality: str, segment_index: int) -> bytes:
    """Generate a small dummy MPEG-TS packet (188 bytes, sync byte 0x47)."""
    # Real TS packets start with 0x47 sync byte and are 188 bytes each
    header = b"\x47"  # sync byte
    # Fill with identifiable pattern
    payload = bytes([segment_index & 0xFF] * 187)
    return header + payload


async def perform_streaming_session(quality: str, segment_count: int, base_url: str) -> list[dict]:
    """Perform real HTTP requests to fetch HLS playlists and segments."""
    events = []
    start_time = time.time()
    session_id = uuid.uuid4().hex[:4]
    step_counter = 0

    def get_offset():
        return round((time.time() - start_time) * 1000, 1)

    def add_event(direction, summary, raw, key_fields, protocol="HTTP"):
        nonlocal step_counter
        evt = ProtocolEvent(
            id=f"stream-{session_id}-{step_counter}",
            protocol=protocol,
            direction=direction,
            summary=summary,
            raw=raw,
            keyFields=key_fields,
            offsetMs=get_offset(),
            status="real",
        )
        events.append(asdict(evt))
        step_counter += 1

    async def fetch_url(url: str, description: str):
        """Perform a real HTTP GET request and record request/response events."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Record request event
                add_event(
                    "client→server",
                    f"GET {description}",
                    f"GET {url} HTTP/1.1\r\nHost: 127.0.0.1:8000\r\nAccept: */*\r\nConnection: keep-alive\r\n\r\n",
                    [
                        {"label": "Method", "value": "GET"},
                        {"label": "Target", "value": description},
                        {"label": "Quality", "value": quality},
                    ],
                )

                resp = await client.get(url)

                # Build real response headers
                resp_raw = f"HTTP/1.1 {resp.status_code} {resp.reason_phrase}\r\n"
                for k, v in resp.headers.items():
                    resp_raw += f"{k}: {v}\r\n"
                resp_raw += "\r\n"

                content_type = resp.headers.get("content-type", "unknown")
                content_len = resp.headers.get("content-length", str(len(resp.content)))

                add_event(
                    "server→client",
                    f"HTTP {resp.status_code} {description} ({content_len} bytes)",
                    resp_raw,
                    [
                        {"label": "Status", "value": str(resp.status_code)},
                        {"label": "Content-Type", "value": content_type},
                        {"label": "Content-Length", "value": content_len},
                    ],
                )
        except Exception as e:
            add_event(
                "server→client",
                f"Error fetching {description}: {str(e)}",
                f"Request failed: {str(e)}",
                [{"label": "Error", "value": str(e)}],
            )

    # Fetch master playlist
    await fetch_url(f"{base_url}/api/stream/media/master.m3u8", "master.m3u8 (HLS Master Playlist)")

    # Fetch variant/quality playlist
    await fetch_url(
        f"{base_url}/api/stream/media/{quality}/playlist.m3u8",
        f"{quality}/playlist.m3u8 (Media Playlist)"
    )

    # Fetch each segment
    for i in range(segment_count):
        seg_name = f"segment{i}.ts"
        await fetch_url(
            f"{base_url}/api/stream/media/{quality}/{seg_name}",
            f"{quality}/{seg_name} (Segment #{i})"
        )

    return events
