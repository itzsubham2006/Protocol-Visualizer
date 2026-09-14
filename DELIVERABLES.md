# Project Deliverables & Technical Reflection Report
**Project Name:** Protocol Visualizer (Real Networking Edition)  
**Author:** Subham Pathak  
**Repository:** [https://github.com/itzsubham2006/Protocol-Visualizer](https://github.com/itzsubham2006/Protocol-Visualizer)  
**Live Production URL:** [https://protoviz.up.railway.app/](https://protoviz.up.railway.app/)  

---

## Table of Contents
1. [Deliverable 1: Working Dashboard & Execution Guide](#1-deliverable-1-working-dashboard--execution-guide)
2. [Deliverable 2: AI Usage Log, Artifacts & Prompt History](#2-deliverable-2-ai-usage-log-artifacts--prompt-history)
3. [Deliverable 3: Demo Video & Visual Evidence](#3-deliverable-3-demo-video--visual-evidence)
4. [Deliverable 4: Technical Reflection Document](#4-deliverable-4-technical-reflection-document)
   - [4.1 Chosen AI Platform(s) and Model(s) & Rationale](#41-chosen-ai-platforms-and-models--rationale)
   - [4.2 How the Two Panels Stay Synchronized](#42-how-the-two-panels-stay-synchronized)
   - [4.3 What the AI Got Wrong and How It Was Corrected](#43-what-the-ai-got-wrong-and-how-it-was-corrected)
   - [4.4 Key Differences Observed Across Protocol Flows](#44-key-differences-observed-across-protocol-flows)
5. [Submission Checklist](#5-submission-checklist)

---

## 1. Deliverable 1: Working Dashboard & Execution Guide

### 1.1 Project Links
- **Source Code Repository**: [https://github.com/itzsubham2006/Protocol-Visualizer](https://github.com/itzsubham2006/Protocol-Visualizer)
- **Live Interactive Dashboard**: [https://protoviz.up.railway.app/](https://protoviz.up.railway.app/)

### 1.2 System Prerequisites
- **Python**: Version 3.10 or higher
- **Node.js**: Version 18 or higher (tested on Node 18, 20, and 22)
- **npm**: Version 9 or higher
- **Git**: Latest version

---

### 1.3 Step-by-Step Instructions to Run Locally

#### Step 1: Clone the Repository
```bash
git clone https://github.com/itzsubham2006/Protocol-Visualizer.git
cd Protocol-Visualizer
```

#### Step 2: Install Backend Dependencies
Set up a Python virtual environment (optional but recommended) and install dependencies:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Install requirements (fastapi, uvicorn, httpx, dnspython)
pip install -r requirements.txt
```

#### Step 3: Install Frontend Dependencies
```bash
npm install
```

#### Step 4: Launch the Services (Three-Terminal Setup)

* **Terminal 1: Start Safe Local SMTP Test Server**
  ```bash
  python backend/smtp_server.py
  ```
  *Output confirms: Listening on `127.0.0.1:2525` (RFC 5321 safe test server).*

* **Terminal 2: Start FastAPI Backend Server**
  ```bash
  python -m backend.main
  ```
  *(Alternatively: `uvicorn backend.main:app --port 8000 --reload`)*  
  *Backend will be running on `http://127.0.0.1:8000` with automated proxy to `/api/*`.*

* **Terminal 3: Start Vite Frontend Development Server**
  ```bash
  npm run dev
  ```
  *Open your browser and navigate to `http://localhost:5173`.*

---

### 1.4 Verification & Testing Protocol Flows
- **Browsing (Real DNS + HTTP/HTTPS)**:
  1. Open the **Browsing** tab on the left panel.
  2. Input a target URL (e.g. `https://example.com` or `https://httpbin.org/get`).
  3. Click **Visit Page →**.
  4. Observe the right panel timeline and flowchart showing the 5-step pipeline: real DNS query & response via UDP, TCP 3-way handshake, TLS negotiation, HTTP request dispatch, and response receipt.
- **Mail (Real RFC 5321 SMTP Socket)**:
  1. Switch to the **Mail** tab on the left panel.
  2. Enter recipient, subject, and body.
  3. Click **Send Email →**.
  4. Inspect the right panel step-by-step stateful transcript (`220 Greeting` → `EHLO` → `MAIL FROM` → `RCPT TO` → `DATA 354` → `250 Accepted` → `QUIT 221`).
- **Streaming (Real HTTP HLS Video Chunks)**:
  1. Select the **Streaming** tab.
  2. Choose a quality rendition (`360p`, `720p`, `1080p`) and segment count.
  3. Click **Start Stream →**.
  4. Verify the sequential loading of `master.m3u8`, variant `playlist.m3u8`, and individual binary MPEG-TS chunks (`segment0.ts`, etc.) over HTTP 200 responses.

---

## 2. Deliverable 2: AI Usage Log, Artifacts & Prompt History

### 2.1 AI Platforms and Artifact Storage Links
- **Primary AI Agent Platform**: Google Antigravity (Agentic Pair-Programming Assistant powered by Gemini 3.6 Flash and Gemini 3.8 Flash)
- **Secondary AI Architectural Planning**: ChatGPT (GPT-4o)
- **ChatGPT Conversation Export**: [https://chatgpt.com/share/6aa7f8bc-463c-83e8-bab3-32e25523a4d9](https://chatgpt.com/share/6aa7f8bc-463c-83e8-bab3-32e25523a4d9)
- **AI Artifacts, Screenshots & Logs Drive Folder**: [https://drive.google.com/drive/folders/17pzhkchdhBcoEwXjDgp5XCQCwJbUv1c_?usp=drive_link](https://drive.google.com/drive/folders/17pzhkchdhBcoEwXjDgp5XCQCwJbUv1c_?usp=drive_link)

---

### 2.2 Comprehensive Prompt Engineering History & AI Interaction Log

The following chronological log details the iterative prompts, tasks assigned to the AI assistant, the actions taken by the AI, and the developer's verification and corrections:

| Phase & Timestamp | User Prompt / Task | AI Agent Response & Actions | Developer Observation & Outcome |
| :--- | :--- | :--- | :--- |
| **Phase 1: Architecture & UI Setup** | *"Design a dual-panel web dashboard for visualizing computer networking protocols in React. The left panel must show activity forms and logs, and the right panel must show interactive timeline steps and packet details."* | Generated modular React architecture with `ActivityPanel`, `ProtocolPanel`, `DashboardLayout`, and created `SessionContext.jsx` with `useReducer` to manage shared state. | Approved initial layout. Identified need for clean dark neutral styling and strict synchronization between panels. |
| **Phase 2: Playback & State Synchronization** | *"How can we ensure stepping through protocol events in the right panel keeps the activity log and message cards synchronized in real time without race conditions?"* | Implemented `usePlayback.js` hook providing Play, Pause, Step Forward, Step Backward, Speed Multipliers, and unified dispatch through `SessionContext`. | Synchronization worked smoothly for simulated static steps. Real-time dynamic networking needed next. |
| **Phase 3: Real Networking Backend** | *"Upgrade the visualizer from mock data to real network execution using Python and FastAPI. It must perform real DNS lookups, real HTTP calls, and real SMTP transmission."* | Built `backend/main.py` using FastAPI and created networking clients (`dns_client.py` using `dnspython`, `http_client.py` using `httpx`, and `smtp_client.py` using raw Python sockets). Set up Server-Sent Events (SSE) endpoints. | Backend communicated over real networks. However, connection errors emerged when SMTP server was not started manually. |
| **Phase 4: Bug Fix - SMTP Daemon & Cloud Mail** | *"When testing mail sending, we encounter ConnectionRefusedError: [Errno 111] Connection refused on 127.0.0.1:2525. Also, cloud hosts like Railway block outbound raw SMTP ports."* | **AI initially suggested telling user to always run a terminal manually.**<br>**User corrected:** Auto-start background daemon in FastAPI startup lifecycle (`auto_start_smtp_server()`) and create `api_mailer.py` with HTTPS cloud dispatch (Resend/Brevo) for hosted production. | Resolved completely in commit `cde6cc6` and `3568779`. Mail execution now succeeds seamlessly both locally and in cloud containers. |
| **Phase 5: Bug Fix - SSE Streaming Playback** | *"In browsing mode, during live SSE streaming, the playback stops prematurely before all 5 network steps arrive from the backend."* | Investigated `SessionContext.jsx` and discovered `STEP_FORWARD` set `isPlaying: false` whenever index caught up to buffered steps. Updated reducer to check `isStreaming` state: `keepPlaying = state.isStreaming ? true : isAtEnd ? false : state.isPlaying`. | Resolved in commit `522a0bc`. The timeline and flowchart now smoothly stream all incoming packets in real-time. |
| **Phase 6: Real Browsing 5-Step Pipeline** | *"Browsing should not just show an HTTP GET and 200 OK. It must show the real low-level sequence: DNS resolution, TCP handshake, TLS handshake, HTTP request, and HTTP response."* | Implemented authentic 5-step socket pipeline in `backend/networking/http_client.py` capturing socket connect timestamps, SSL cipher negotiation, HTTP raw headers, and timing metrics. | Successfully displays low-level packet mechanics with real DNS query times and IP resolution. |
| **Phase 7: Production Deployment & Containerization** | *"Create Dockerfile and Railway deployment configuration so the full application (frontend and FastAPI backend) runs in production."* | Configured multi-stage Docker build, Vite production build, FastAPI static file mounting, `railway.json`, and dynamic `$PORT` binding. Switched base image from Alpine to `node:22-slim` to avoid `musl` libc issues. | Application successfully deployed live at `https://protoviz.up.railway.app/`. |

---

## 3. Deliverable 3: Demo Video & Visual Evidence

- **Demo Video Google Drive Link**:  
  [https://drive.google.com/drive/folders/1guHfdLAG3NF0rZWIcWkJlfFf8E9_e3JB?usp=drive_link](https://drive.google.com/drive/folders/1guHfdLAG3NF0rZWIcWkJlfFf8E9_e3JB?usp=drive_link)
- **Drive Folder Contents**:
  - `protocol_visualizer_demo.mp4` (Full walkthrough: Browsing, Mail, Streaming, Real-Time toggles, and dual-panel synchronization).
  - High-resolution screenshots capturing parallel updates across both panels.

---

## 4. Deliverable 4: Technical Reflection Document

### 4.1 Chosen AI Platform(s) and Model(s) & Rationale

For the architectural design, implementation, debugging, and deployment of the Protocol Visualizer, **Google Antigravity** (powered by **Gemini 3.6 Flash** and **Gemini 3.8 Flash**) served as the primary agentic pair-programming platform, supplemented by **ChatGPT (GPT-4o)** for initial conceptual outlining and RFC protocol verification.

#### Why Google Antigravity & Gemini Were Chosen:
1. **Full-Codebase Awareness and Direct Tool Execution**:
   Unlike standard chatbots that only suggest disjointed code snippets, Antigravity operates as an agentic assistant capable of inspecting directory structures, viewing full files, executing git and terminal commands, making unified multi-file edits, and validating build status directly inside the repository.
2. **Polyglot Full-Stack Integration**:
   The Protocol Visualizer required concurrent coordination between a modern React/Vite frontend (ESM, Tailwind CSS, React hooks, Context API) and an asynchronous Python FastAPI backend (raw TCP sockets, `dnspython`, `httpx`, `asyncio`). Antigravity seamlessly reasoned across both technology stacks.
3. **Iterative Problem-Solving and Rapid Feedback Loops**:
   Developing complex network flows (such as HLS MPEG-TS segment streaming and RFC 5321 SMTP socket conversations) involved runtime debugging. Antigravity allowed immediate inspection of test logs and rapid code fixes.

---

### 4.2 How the Two Panels Stay Synchronized

The Protocol Visualizer interface adheres strictly to a dual-panel layout:
- **Left Panel (Activity Panel)**: Contains interactive configuration forms (Browsing, Mail, Streaming), network mode controls, and a real-time event log.
- **Right Panel (Protocol Inspector)**: Contains the interactive step-by-step timeline, visual flowchart state diagram, message inspection cards (headers, payload, raw hex/text), and transport playback controls.

#### Synchronization Architecture:
```
┌───────────────────────────────────────────────────────────┐
│              SessionContext (Single State Store)          │
│   steps[] | currentStepIndex | isPlaying | activityLog[]  │
└─────────────┬───────────────────────────────┬─────────────┘
              │                               │
              ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   LEFT: Activity Panel    │   │ RIGHT: Protocol Inspector │
│ - Browsing/Mail/Stream Form│  │ - Protocol Timeline       │
│ - Timestamped Event Log   │   │ - Interactive Flowchart   │
│ - Real-Time Toggle        │   │ - Message Card Inspector  │
└───────────────────────────┘   └───────────────────────────┘
              ▲                               ▲
              └───────────────┬───────────────┘
                              │
               FastAPI Backend SSE Stream
           (/api/browse/stream, /api/mail/send)
```

1. **Centralized Single Source of Truth**:
   Dual-panel state is centralized within `src/context/SessionContext.jsx` using React's `useReducer`. No local component stores duplicated protocol state. When an event or user input dispatches an action:
   - `APPEND_STEP`: Dynamically pushes a new network packet step into `state.steps`.
   - `STEP_FORWARD` / `SET_STEP_INDEX`: Updates `currentStepIndex`.
   - `ADD_LOG`: Appends a timestamped log item to `state.activityLog`.
2. **Unified React Re-rendering**:
   Because both `ActivityPanel` and `ProtocolPanel` are direct consumers of `useSession()`, any dispatched action triggers a simultaneous, coordinated re-render of both panels without needing external pub/sub libraries or manual DOM polling.
3. **Server-Sent Events (SSE) Coordination with Playback Engine**:
   When a real network activity starts:
   - The frontend initiates an SSE connection to FastAPI endpoints (`/api/browse/stream`, `/api/mail/send`, `/api/stream/start`).
   - As chunks arrive over SSE, `APPEND_STEP` appends each network event.
   - The `usePlayback` hook drives the sequence forward automatically, revealing steps in synchronization with the playback speed and triggering corresponding updates in the activity log and message card inspector.

---

### 4.3 What the AI Got Wrong and How It Was Corrected

While the AI provided strong boilerplate code, real-world networking constraints and edge cases exposed several significant deficiencies that required developer intervention:

#### 1. SMTP Server Connection Refused (`ConnectionRefusedError`)
- **The Issue**: The AI implemented `smtp_client.py` expecting a local SMTP listener on `127.0.0.1:2525`. When tested by a new user or deployed to cloud platforms, sending emails caused immediate `ConnectionRefusedError` failures because the standalone script `backend/smtp_server.py` had not been launched in a separate terminal.
- **AI's Initial (Inadequate) Suggestion**: The AI suggested adding warning text in the UI telling the user to keep another terminal open.
- **Developer Correction**: 
  - Implemented an internal background SMTP daemon directly inside `backend/main.py` using Python's `asyncio` loop (`auto_start_smtp_server()`), automatically starting the RFC 5321 server on FastAPI startup.
  - Implemented `backend/networking/api_mailer.py` with HTTPS cloud dispatch (Resend / Brevo API) as an alternative for production environments where raw TCP socket port 25/2525 outbound traffic is blocked by cloud firewalls.

#### 2. Premature Playback Halt During Server-Sent Event Streams
- **The Issue**: In real-time browsing and streaming flows, events arrive asynchronously over SSE. The `usePlayback` reducer previously had logic stating:
  ```javascript
  const isAtEnd = nextIndex >= state.steps.length - 1;
  return { ...state, currentStepIndex: nextIndex, isPlaying: !isAtEnd };
  ```
  Because the network latency between DNS resolution and HTTP response took ~150ms, the playback engine immediately caught up with the first DNS step and paused `isPlaying`, halting playback before the remaining HTTP response steps arrived.
- **Developer Correction**:
  Introduced an `isStreaming` state flag in `SessionContext.jsx`. The condition was corrected to:
  ```javascript
  const keepPlaying = state.isStreaming ? true : (isAtEnd ? false : state.isPlaying);
  ```
  Playback now stays active until the backend explicitly transmits a `FINISH_STREAMING` event.

#### 3. Superficial HTTP Browsing Simulation
- **The Issue**: The AI's initial browsing implementation made a basic `httpx.get()` call and generated two generic cards (Request & Response). This hid the essential network mechanics required for an educational networking tool.
- **Developer Correction**:
  Re-architected `backend/networking/http_client.py` into a genuine 5-phase network probe:
  1. DNS Resolution (querying system resolvers with `dnspython` and recording query duration).
  2. TCP 3-Way Handshake (opening OS TCP socket to target IP on port 80/443).
  3. TLS Handshake & Negotiation (wrapping socket with `ssl.SSLContext` and extracting cipher suite / TLS version).
  4. HTTP Request (transmitting formatted HTTP/1.1 request headers).
  5. HTTP Response (parsing raw HTTP status code, response headers, and content).

#### 4. Cloud Container Deployment Failures (Railway / Render)
- **The Issue**: The initial Dockerfile suggested by the AI used Alpine Linux with Node and Python combined. During build time, native compilation dependencies failed due to `musl` libc incompatibility with Python networking libraries. Additionally, the backend was started with hardcoded port 8000, ignoring Railway's dynamic `$PORT` environment variable.
- **Developer Correction**:
  Refactored the build to use `node:22-slim`, configured `railway.json`, updated the start command to `python -m backend.main`, and bound the server dynamically using `os.environ.get("PORT", 8000)`.

---

### 4.4 Key Differences Observed Across Protocol Flows

By building real network probes for Browsing, Mail, and Streaming, distinct behavioral differences between application-layer protocols were directly observed and quantified:

| Dimension / Characteristic | DNS + HTTP / HTTPS Flow | SMTP Flow (RFC 5321) | Streaming HTTP (HLS) Flow |
| :--- | :--- | :--- | :--- |
| **Architectural Model** | **Client-Driven Request-Response** (Transactional) | **Conversational State Machine** (Lockstep interactive dialogue) | **Adaptive Media Chunking over HTTP** (Manifest-driven segment downloads) |
| **Transport Layer** | Hybrid: UDP (port 53 for DNS) + TCP/TLS (port 80/443 for HTTP/S) | Pure TCP stream (Port 25 / 587 / 2525) | Standard TCP/TLS (port 80/443) |
| **Statefulness** | **Stateless**: Each HTTP request is self-contained. Connections may be reused via `Keep-Alive`, but no conversational state is preserved across transactions. | **Strictly Stateful**: Client cannot issue commands out of order. Sequence must follow `EHLO` → `MAIL FROM` → `RCPT TO` → `DATA` → `QUIT`. | **Client-State Governed**: The server remains stateless, while the client maintains buffer state, bitrate calculations, and playlist index tracking. |
| **Turn-Taking & Pacing** | Immediate client dispatch; client waits for complete response headers and body. | Strictly turn-based: client transmits one command and blocks until the server responds with a 3-digit status code (`220`, `250`, `354`, etc.). | Iterative loop: Client polls manifests (`.m3u8`) and continuously fetches independent video chunks (`.ts`) on a timer. |
| **Payload Format** | Structured HTTP envelope containing headers and binary/text payload (HTML, JSON, CSS). | Plain ASCII text envelope ending with the RFC terminal sequence `<CRLF>.<CRLF>`. | Master playlist containing variant playlists, followed by raw binary MPEG-TS audio/video packets. |
| **Observed Latency Profile** | Front-loaded: DNS lookup (~15–50ms) + TCP/TLS handshake (~60–120ms), followed by swift data transfer. | Cumulative round-trip latency: Every command requires a distinct network round-trip, making total session duration proportional to step count. | Pipelined & continuous: Small manifest downloads followed by steady throughput bursts as video segments are buffered. |

---

## 5. Submission Checklist

- [x] **Deliverable 1**: Complete working dashboard source code on GitHub + Live production deployment on Railway + Detailed multi-terminal execution instructions.
- [x] **Deliverable 2**: AI usage log, prompt history table, Google Drive artifact folder, and ChatGPT conversation export link.
- [x] **Deliverable 3**: Short demo video link and visual inspection records on Google Drive.
- [x] **Deliverable 4**: 1–2 page technical reflection covering platform choice, synchronization mechanism, AI errors and developer corrections, and protocol comparison analysis.
