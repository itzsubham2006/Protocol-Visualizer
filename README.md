#  Protocol Visualizer
Website Link = https://protocol-visualizer-seven.vercel.app/

An interactive dual-panel protocol visualization dashboard built with React + Vite. Simulate and inspect DNS, HTTP, SMTP, and HLS adaptive streaming protocols in real-time with animated step-by-step playback.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

##  Features

- **Dual-Panel Layout** — Activity panel (left) and Protocol Inspector (right) synchronized in real-time
- **Three Activity Modes**
  - 🌐 **Browsing** — DNS resolution → HTTP requests with sub-resource fetches (CSS, JS, images)
  - ✉️ **Mail** — DNS resolution → Full SMTP conversation (13 steps per RFC 5321)
  - 📺 **Streaming** — DNS resolution → HLS adaptive bitrate (master playlist → variant → segment fetches)
- **Playback Controls** — Play, pause, step forward/backward, replay, adjustable speed (0.5x–4x)
- **Keyboard Shortcuts** — `Space` (play/pause), `←` / `→` (step), `R` (replay)
- **Message Inspector** — Click any timeline step to expand its raw wire-format message and highlighted key fields
- **Dark Cyberpunk Theme** — Glassmorphism cards, protocol color-coding, neon accents, smooth animations
- **Fully Responsive** — Two-column grid collapses to single column on mobile/tablet

---

##  Architecture

```
src/
├── main.jsx                          # Entry point
├── App.jsx                           # Root component (SessionProvider wrapper)
├── context/
│   └── SessionContext.jsx            # Shared state — the dual-panel sync mechanism
├── hooks/
│   └── usePlayback.js                # setInterval-based step progression engine
├── protocols/                        # Pure JS modules — zero React dependencies
│   ├── dns.js                        # DNS A query/response simulation
│   ├── http.js                       # HTTP request/response with keep-alive sub-resources
│   ├── smtp.js                       # Full SMTP conversation (220→EHLO→MAIL→RCPT→DATA→QUIT)
│   ├── streaming.js                  # HLS adaptive streaming (master→variant→segments)
│   └── sequenceBuilders.js           # Composes DNS + protocol per activity type
├── components/
│   ├── layout/
│   │   └── DashboardLayout.jsx       # CSS Grid two-column layout
│   ├── activity/
│   │   ├── ActivityPanel.jsx         # Left panel container
│   │   ├── ActivityTabs.jsx          # Browsing / Mail / Streaming tab switcher
│   │   ├── BrowsingForm.jsx          # URL input → triggers DNS + HTTP sequence
│   │   ├── MailForm.jsx              # To/Subject/Body → triggers DNS + SMTP sequence
│   │   ├── StreamingPlayer.jsx       # Quality selector → triggers DNS + HLS sequence
│   │   └── ActivityLog.jsx           # Scrolling timestamped activity history
│   └── protocol/
│       ├── ProtocolPanel.jsx         # Right panel container
│       ├── Timeline.jsx             # Progressive step-by-step protocol reveal
│       ├── MessageCard.jsx          # Expandable raw message + key field chips
│       └── PlaybackControls.jsx     # Transport buttons + speed selector
└── styles/
    └── index.css                     # Complete design system (750+ lines)
```

### How the Dual-Panel Sync Works

Both panels read from a single `SessionContext` powered by `useReducer`:

1. User submits a form on the **Activity Panel** (left)
2. A **pure sequence builder function** returns an array of `Step` objects — no side effects, fully synchronous
3. Steps are dispatched into context (`SET_STEPS`), resetting playback
4. A **`usePlayback` hook** runs `setInterval` to increment `currentStepIndex`
5. The **Protocol Panel** (right) renders only steps where `index ≤ currentStepIndex`
6. Both panels re-render from the same state change — **sync is automatic**

No WebSockets, no events, no polling. Just React's built-in re-rendering.

---

##  Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/itzsubham2006/Protocol-Visualizer.git
cd Protocol-Visualizer

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

##  Usage Guide

###  Browsing Mode

1. Select the **Browsing** tab
2. Enter a URL (default: `https://example.com`)
3. Click **"Visit Page"**
4. Watch the right panel animate: **DNS query → DNS response → HTTP GET → 200 OK → CSS/JS/image sub-resources**

###  Mail Mode

1. Select the **Mail** tab
2. Fill in recipient, subject, and body (pre-filled with defaults)
3. Click **"Send Email"**
4. Watch the full SMTP conversation: **220 greeting → EHLO → MAIL FROM → RCPT TO → DATA → 354 → message → 250 queued → QUIT → 221 Bye**

###  Streaming Mode

1. Select the **Streaming** tab
2. Choose quality (360p / 720p / 1080p) and segment count
3. Click **"Start Stream"**
4. Watch HLS adaptive streaming: **DNS → master.m3u8 → variant playlist → repeated segment fetches**

### Playback Controls

| Control | Action |
|---------|--------|
| ▶ / ⏸ | Play / Pause (or `Space`) |
| ⏮ | Step backward (or `←`) |
| ⏭ | Step forward (or `→`) |
| 🔄 | Replay from beginning (or `R`) |
| 0.5x–4x | Adjust playback speed |

Click any **timeline step** to expand its message card showing raw protocol text and highlighted key fields.

---

##  Design

- **Theme**: Dark cyberpunk with glassmorphism cards
- **Protocol Colors**:
  - 🟦 DNS — Cyan (`hsl(190, 90%, 60%)`)
  - 🟩 HTTP — Green (`hsl(145, 80%, 55%)`)
  - 🟨 SMTP — Amber (`hsl(40, 95%, 60%)`)
  - 🟪 Streaming — Magenta (`hsl(280, 80%, 65%)`)
- **Typography**: Inter (UI) + JetBrains Mono (protocol text)
- **Responsive**: CSS Grid, stacks to single column below 768px

---

##  Protocol Accuracy

All protocol simulations follow their respective RFCs:

| Protocol | Reference | Key Details |
|----------|-----------|-------------|
| DNS | RFC 1035 | A record query/response, recursion desired flag, TTL, NOERROR rcode |
| HTTP/1.1 | RFC 9110 | Proper headers (Host, User-Agent, Content-Type, Connection: keep-alive), sub-resource reuse |
| SMTP | RFC 5321 | Complete 13-step conversation with correct status codes (220, 250, 354, 221) |
| HLS | RFC 8216 | Master playlist → variant playlist → MPEG-TS segment fetches, adaptive bitrate metadata |

---

##  Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **CSS Custom Properties** | Design system & theming |
| **React Context + useReducer** | State management & panel synchronization |
| **Pure JS Modules** | Protocol simulation (no framework dependency) |

---

##  License

This project is licensed under the MIT License.
