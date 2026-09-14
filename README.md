# Protocol Visualizer (Real Networking Edition)

An interactive dual-panel protocol visualization dashboard upgraded with **real network communication** powered by **Python + FastAPI**, raw TCP socket communication, real DNS resolution, real HTTP/HTTPS requests, real HLS media streaming, and real-time Server-Sent Events (SSE).

> [!IMPORTANT]
> **Academic Integrity & Transparency Notice**:
> This project uses **real network communication** for all protocol demonstrations:
> - **Browsing**: Performs real DNS resolution and real HTTP/HTTPS requests with actual headers and status codes.
> - **Mail**: Performs real TCP socket communication using Python's `socket` module against a local test SMTP server (`127.0.0.1:2525`). It does **not** deliver email externally.
> - **Streaming**: Performs real HTTP requests to retrieve HLS master/rendition playlists and binary MPEG-TS segments.
> - Every event is explicitly labeled as **`REAL NETWORK EVENT`** or **`SIMULATED EVENT`** (when falling back if the backend or SMTP server is unavailable).

---

## Architecture

The system maintains a strict separation of concerns across a dual-panel interface:

```
Browser (React + Vite, Port 5173)
  ├── LEFT PANEL:  Activity Panel (Browsing, Mail, Streaming forms + Activity Log)
  └── RIGHT PANEL: Protocol Inspector (Timeline, Playback controls, Message details)
         ↕ (Server-Sent Events / SSE at /api/...)
FastAPI Backend (Python 3.10+, Port 8000)
  ├── /api/browse/stream  ─── Real DNS query via dnspython + Real HTTP/HTTPS via httpx
  ├── /api/mail/send     ─── Real TCP socket (RFC 5321) to 127.0.0.1:2525
  ├── /api/stream/start  ─── Real HTTP requests fetching HLS master, variant & segments
  └── /api/stream/media/ ─── HLS media endpoints serving real playlists and TS chunks
         ↕
Local SMTP Test Server (Python AsyncIO, Port 2525)
  └── Safe RFC 5321 test server — logs all commands, sends real SMTP replies, never delivers externally
```

---

## Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: 18 or higher
- **npm**: 9 or higher

---

## Quick Start Guide

### 1. Install Dependencies

#### Python Backend Dependencies:
```bash
pip install -r requirements.txt
```
*(Dependencies: `fastapi`, `uvicorn`, `httpx`, `dnspython`)*

#### Frontend Dependencies:
```bash
npm install
```

---

### 2. Start the Local SMTP Test Server

In your first terminal, start the safe local SMTP test server:
```bash
python backend/smtp_server.py
```
Output:
```
============================================================
  Protocol Visualizer — Local SMTP Test Server
  Listening on 127.0.0.1:2525
  This server does NOT deliver emails externally.
  Press Ctrl+C to stop.
============================================================
```

---

### 3. Start the FastAPI Backend Server

In your second terminal, start the FastAPI backend:
```bash
python -m backend.main
```
Or with uvicorn directly:
```bash
uvicorn backend.main:app --port 8000 --reload
```
The backend will be live at `http://127.0.0.1:8000`.

---

### 4. Start the Frontend Development Server

In your third terminal, start Vite:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

The top navbar will show:
- **`REAL NETWORK MODE`** (green badge)
- **`Protocol communication uses real network requests/sockets.`**

*(If the backend is not running, the application automatically shows `SIMULATION FALLBACK` and falls back gracefully).*

---

## How to Test Each Protocol Activity

### 🌐 A. Browsing (Real DNS + Real HTTP)
1. Select the **Browsing** tab on the Left Panel.
2. Enter any valid target URL (e.g. `https://example.com` or `https://httpbin.org/get`).
3. Click **Visit Page →**.
4. Observe the Right Panel:
   - **DNS Query & Response**: Actual resolved IP address, actual query time in milliseconds, transaction ID, and TTL.
   - **HTTP Request & Response**: Real HTTP method, headers, response status code (e.g. `200 OK`), server name, and snippet of response body.
   - For HTTPS URLs, transport is tagged as `HTTPS/TLS (Encrypted)` without fabricating fake handshake packets.
   - If an invalid domain is entered, the real DNS error is displayed.

### ✉️ B. Mail (Real TCP SMTP Socket)
1. Select the **Mail** tab on the Left Panel.
2. Enter recipient (e.g. `user@example.com`), subject, and message body.
3. Click **Send Email →**.
4. Observe the conversation over the real TCP connection (`127.0.0.1:2525`):
   - `220 Server greeting`
   - `EHLO client.local`
   - `250 EHLO capabilities`
   - `MAIL FROM:<sender@protocol-visualizer.local>`
   - `250 Sender accepted`
   - `RCPT TO:<user@example.com>`
   - `250 Recipient accepted`
   - `DATA`
   - `354 Ready for message`
   - `[Message: "..."]` (Contains your exact recipient, subject, and body)
   - `250 Message accepted (queue ID)`
   - `QUIT`
   - `221 Connection closing`
5. Activity log records:
   - `"SMTP connection established"`
   - `"SMTP conversation completed"` *(never falsely claims "Email delivered")*
6. **Error Case**: Stop the SMTP server (`Ctrl+C` in Terminal 1) and click Send Email again. The visualizer clearly shows:
   `Cannot connect to SMTP test server at 127.0.0.1:2525` with instructions to start it.

### 📺 C. Streaming (Real HTTP HLS Chunks)
1. Select the **Streaming** tab on the Left Panel.
2. Choose a stream quality (`360p`, `720p`, `1080p`) and segment count (3, 6, or 10).
3. Click **Start Stream →**.
4. The backend and frontend execute real HTTP requests:
   - Real GET to `/api/stream/media/master.m3u8`
   - Real GET to `/api/stream/media/{quality}/playlist.m3u8`
   - Real GET requests for each individual segment (`segment0.ts`, `segment1.ts`, etc.)
   - Real HTTP `200 OK` status codes, `video/mp2t` content-types, and byte sizes.

---

## Running Automated Tests

Run the backend test suite:
```bash
python -m pytest -v -s tests/
```

This verifies:
- Real DNS resolution against live public hosts and error handling
- Direct IP literal bypass
- Real HTTP GET requests with actual headers and content
- Real TCP SMTP socket conversation with RFC 5321 server
- Connection refused error handling
- HLS media generation and TS packet structure
- FastAPI SSE and media endpoints

---

## Project Structure

```
Protocol-Visualizer/
├── backend/
│   ├── main.py                     # FastAPI application & SSE endpoints
│   ├── smtp_server.py              # Safe local RFC 5321 SMTP test server
│   └── networking/
│       ├── dns_client.py           # Real DNS resolution via dnspython + socket fallback
│       ├── http_client.py          # Real HTTP/HTTPS requests via httpx
│       ├── smtp_client.py          # Real raw TCP socket SMTP conversation
│       ├── stream_service.py       # Real HLS playlist & TS segment generation/fetching
│       └── events.py               # ProtocolEvent model & SSE stream formatters
├── src/
│   ├── App.jsx                     # Top navbar with real network mode status badge
│   ├── context/
│   │   └── SessionContext.jsx      # Dual-panel synchronization with SSE streaming support
│   ├── hooks/
│   │   └── usePlayback.js          # Interactive playback engine (Play/Pause/Step/Replay/Speed)
│   ├── components/
│   │   ├── layout/
│   │   │   └── DashboardLayout.jsx # Exactly two main panels (Left Activity, Right Inspector)
│   │   ├── activity/
│   │   │   ├── ActivityPanel.jsx   # Left panel container
│   │   │   ├── ActivityTabs.jsx    # Browsing / Mail / Streaming switcher
│   │   │   ├── BrowsingForm.jsx    # Real DNS/HTTP visit form with SSE
│   │   │   ├── MailForm.jsx        # Real TCP SMTP email form with SSE
│   │   │   ├── StreamingPlayer.jsx # Real HLS streaming player with SSE
│   │   │   └── ActivityLog.jsx     # Timestamped real network activity log
│   │   └── protocol/
│   │       ├── ProtocolPanel.jsx   # Right panel container
│   │       ├── Timeline.jsx        # Step sequence with REAL vs SIM tags
│   │       ├── MessageCard.jsx     # Message inspector with REAL NETWORK EVENT badge
│   │       └── PlaybackControls.jsx# Transport controls & speed selector
│   └── styles/
│       └── index.css               # Professional dark neutral theme
├── tests/
│   ├── test_backend.py             # Networking integration tests
│   └── test_api.py                 # FastAPI endpoints tests
├── package.json
├── requirements.txt
├── vite.config.js                  # Proxy configuration (/api -> localhost:8000)
└── README.md
```

---

## License

MIT License
