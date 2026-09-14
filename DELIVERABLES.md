# Project Deliverables & Technical Reflection Report
**Project Name:** Protocol Visualizer (Real Networking Edition)  
**Author:** Subham Pathak  
**Repository:** [https://github.com/itzsubham2006/Protocol-Visualizer](https://github.com/itzsubham2006/Protocol-Visualizer)  
**Live Production URL:** [https://protoviz.up.railway.app/](https://protoviz.up.railway.app/)  

---

## Table of Contents
1. [Deliverable 1: Working Dashboard & Execution Guide](#1-deliverable-1-working-dashboard--execution-guide)
2. [Deliverable 2: AI Usage Log, Artifacts & Prompt History](#2-deliverable-2-ai-usage-log-artifacts--prompt-history)
   - [2.1 AI Platforms and Artifact Storage Links](#21-ai-platforms-and-artifact-storage-links)
   - [2.2 Comprehensive Prompt Engineering History & AI Interaction Log](#22-comprehensive-prompt-engineering-history--ai-interaction-log)
   - [2.3 Detailed AI Usage & Development Evolution Log](#23-detailed-ai-usage--development-evolution-log)
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

### 2.3 Detailed AI Usage & Development Evolution Log

#### 2.3.1 AI Tool Used

**AI Coding Platform:** Google Antigravity  
**Project:** Protocol Visualizer  
**Purpose:** Development and improvement of a Computer Networks Application Layer protocol visualization system.  

Google Antigravity was used as an agentic AI coding assistant to inspect the existing project, modify the implementation, create new backend components, improve the UI, and test the application.

---

#### 2.3.2 Initial Project Development

The initial application was a React + Vite frontend containing:

* A dual-panel interface
* Browsing, Mail, and Streaming activities
* Activity logs
* Protocol visualization
* Playback controls such as Play, Pause, Previous, Next and Replay
* Simulated DNS, HTTP, SMTP and streaming protocol exchanges

Antigravity inspected the existing architecture and identified that the protocol exchanges were initially generated on the client side using simulated data rather than actual network communication.

---

#### 2.3.3 UI Design and Improvement

I used Antigravity to redesign the existing interface while preserving the application's functionality.

##### Major UI requirements given to the AI:

* Use a professional dark theme
* Improve typography
* Use **Bricolage Grotesque** for the interface
* Remove unnecessary gradients
* Use a solid professional color palette
* Remove excessive border radius
* Maintain exactly two main panels
* Improve the Protocol Inspector and Activity Panel
* Preserve existing interactions and animations

Antigravity subsequently modified the UI while keeping the existing application structure and features.

---

#### 2.3.4 Removing Misleading Simulation Indicators

One important improvement was making the UI accurately distinguish between real and simulated networking.

The original application displayed:

* `LIVE`
* `TLS 1.3 Active`

even though the application was not actually capturing real network communication.

I instructed Antigravity not to claim that networking was real unless it was actually implemented. The new design introduced separate **REAL NETWORK MODE** and **SIMULATION FALLBACK** states.

Protocol events were also given provenance labels such as:

* `REAL NETWORK EVENT`
* `SIMULATED EVENT`

This was specifically intended to maintain academic honesty.

---

#### 2.3.5 Converting Browsing to Real Networking

I instructed Antigravity to replace the simulated browsing protocol with actual networking.

The required architecture became:

**Browser → FastAPI → Python networking layer → Real DNS / HTTP servers → Protocol events → Browser**

For browsing, Antigravity implemented:

* Real DNS resolution
* Real HTTP/HTTPS requests
* Actual resolved IP addresses
* Actual HTTP status codes
* Actual response headers
* Real network timing
* Error reporting for failed requests

The backend uses Python networking modules, including `dnspython` and `httpx`.

---

#### 2.3.6 Converting Mail to Real SMTP Communication

I specifically requested that SMTP should use a real TCP connection instead of fabricated SMTP messages.

The implementation uses a local SMTP test server:

**127.0.0.1:2525**

The SMTP client establishes a real TCP connection using Python sockets and performs an RFC 5321 SMTP conversation.

The conversation includes real commands and responses such as:

* `220`
* `EHLO`
* `MAIL FROM`
* `RCPT TO`
* `DATA`
* `QUIT`

The user's recipient, subject and message body are included in the actual SMTP DATA payload.

The local SMTP server does not deliver emails externally; it is used to demonstrate the real TCP/SMTP communication safely.

---

#### 2.3.7 Converting Streaming to Real HTTP Requests

Antigravity was also instructed to make the Streaming activity perform real HTTP communication.

The implementation includes:

* HLS master playlist
* Different quality/rendition playlists
* Media segments
* Real HTTP GET requests
* Visualization of playlist and segment requests

The streaming service provides playlists and MPEG-TS chunks and performs real HTTP requests to retrieve them.

---

#### 2.3.8 Real-Time Event Visualization

A major requirement was that the visualization should show protocol events as they occur instead of generating the complete sequence beforehand.

Antigravity implemented progressive event streaming using **Server-Sent Events (SSE)**.

Each event contains information such as:

* Timestamp
* Protocol
* Direction
* Message
* Real/simulated status

The existing playback controls were preserved and operate on the received event list.

---

#### 2.3.9 Real-Time / Simulation Toggle

A universal toggle was added to switch between:

##### Real-Time Mode

* Real DNS queries
* Real HTTP/HTTPS requests
* Real TCP SMTP communication
* Real streaming HTTP requests
* Events labelled as real

##### Simulation Mode

* Offline simulated protocol exchanges
* No real network communication
* Events labelled as simulated

This allows the same application to demonstrate both protocol concepts and actual networking behavior.

---

#### 2.3.10 Error Handling and Accuracy

I instructed Antigravity not to convert network failures into fake successful protocol exchanges.

Examples of required error handling included:

* DNS resolution failure
* HTTP request failure
* SMTP server unavailable
* Connection refused
* Timeout
* Invalid URL

The application therefore reports actual errors instead of displaying fabricated protocol messages.

---

#### 2.3.11 Testing and Debugging

Antigravity was used to test and debug the implementation.

The project included automated tests covering:

* DNS resolution
* HTTP communication
* Raw TCP SMTP communication
* HLS streaming
* Error handling
* FastAPI SSE endpoints

The reported test result was:

**13/13 tests passed**

The frontend production build also completed successfully with zero errors.

---

#### 2.3.12 Debugging a Real-Time Browsing Problem

During testing, I identified that the Browsing activity was pausing before all network events had been displayed.

I reported the issue to Antigravity.

Antigravity analyzed the playback logic and found that the playback state was being stopped before the remaining remote HTTPS events had arrived.

It modified `SessionContext.jsx` and `usePlayback.js` so that incoming SSE events could continue the playback correctly.

After the fix, the browsing sequence could progress through:

**DNS → TCP → TLS → HTTP Request → HTTP Response**

The reported test suite again passed all 13 tests and the production build succeeded.

---

#### 2.3.13 Responsive UI Fixes

After testing the application on smaller screens, I asked Antigravity to fix overlapping elements and spacing problems without changing the functionality.

The AI adjusted:

* Activity log timestamps
* Message wrapping
* Playback controls
* Timeline headers
* Message cards
* Mobile/tablet spacing
* Dashboard padding

The changes were UI-only and the existing functionality was preserved. The reported build and 13 automated tests remained successful.

---

#### 2.3.14 AI Contribution Summary

Google Antigravity was used throughout the development process for:

1. Inspecting the existing project architecture
2. Planning modifications
3. Generating and modifying frontend code
4. Designing the UI
5. Creating the Python/FastAPI backend
6. Implementing networking modules
7. Implementing real DNS, HTTP, SMTP and streaming communication
8. Connecting frontend and backend using SSE
9. Debugging playback and networking issues
10. Creating automated tests
11. Testing the application
12. Updating documentation

I provided the requirements, design decisions, networking requirements, corrections and testing feedback, while Antigravity assisted with implementation and debugging.

---

#### 2.3.15 Final Outcome & Architecture Evolution

The project was evolved from a primarily simulated protocol visualizer into a system capable of demonstrating real network communication while retaining a simulation mode.

The final architecture includes:

```
React/Vite Frontend
       ↓
 FastAPI Backend
       ↓
Python Networking Layer
       ↓
DNS / HTTP / TCP SMTP / HLS Communication
       ↓
Real-Time Protocol Events
       ↓
Protocol Visualization
```

The project retained its required dual-panel structure and protocol playback controls while adding real networking capabilities.

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
