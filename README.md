# FIFA World Cup 2026 — Smart Stadium Concierge

An intelligent, multilingual, and accessibility-first assistant designed to streamline fan navigation and operations inside the stadium during match days.

---

## 1. Chosen Vertical & Pitch
**Vertical**: Fan Stadium Navigation and Operations.
**Pitch**: Navigating a massive stadium during the FIFA World Cup 2026 can be stressful and chaotic for fans. The Smart Stadium Concierge is a premium, real-time assistant that helps fans locate nearest gates, check transit schedules, and monitor crowd density. It dynamically reroutes fans away from high-density gates, ensures wheelchair/mobility routes are strictly adhered to, translates replies into multiple languages (English, Spanish, French, Arabic), and degrades gracefully to offline caching if internet connection is lost—delivering a seamless, barrier-free fan experience.

---

## 2. System Architecture

```
+--------------------------------------------------------------+
|                     React + Vite Frontend                    |
|       (Language dropdowns, Zone & Accessibility switches)     |
+------------------------------+-------------------------------+
                               |
                   HTTP POST   | JSON/SSE
                  /api/chat    | Stream
                               v
+--------------------------------------------------------------+
|                    FastAPI Backend Server                    |
|        (CORS validation, Rate limiters, Payload checks)       |
+------------------------------+-------------------------------+
                               |
             +-----------------+-----------------+
             |                                   |
             v                                   v
+--------------------------+         +-------------------------+
|     Gemini GenAI API     |         |     In-Memory DB        |
|  (concierge agent system |         | (gates, zones, crowd,   |
|   prompts, tool calling) |         |  transit cached JSON)   |
+------------+-------------+         +------------+------------+
             |                                    ^
             |         Tool Execution             |
             +------------------------------------+
```

---

## 3. Quick Setup & Run Instructions
Ensure you have Node.js (v18+) and Python (v3.9+) installed.

### A. Environment Configuration
Create a `.env` file in the `/backend` folder (copy from `/backend/.env.example`):
```bash
GEMINI_API_KEY=your_google_gemini_api_key_here
```
*Note*: If the key is left blank, the system automatically falls back to safe, cached offline lookups.

### B. Run the Backend
From the repository root:
```bash
cd backend
pip install -r requirements.txt
python main.py
```
The server will start running on `http://localhost:5000`.

### C. Run the Frontend
From the repository root (in a new terminal):
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server will launch on `http://localhost:3000`.

---

## 4. How GenAI Logic Makes Decisions
The assistant utilizes **Gemini Function Calling (Tools)** to dynamically gather stadium data rather than hallucinating replies. The model applies the following decision rules:
1. **Dynamic Queue Rerouting**: When a fan queries about a gate exit, the backend decision logic checks the nearest gate. If its queue is "High", it scans for alternate gates in the same zone. If a gate with a "Low/Medium" queue is found within 100 meters, the concierge recommends the alternate instead of the closest gate.
2. **Strict Accessibility Enforcement**: If the wheelchair assistance setting is checked, the model filters all tool requests to exclusively look up and return gates and routes tagged as wheelchair accessible (e.g. recommending Gate A1 with ramp access instead of Gate A2).
3. **Out-of-Scope Safety redirect**: The system prompt strictly limits operations. If a fan asks about medical emergencies, the assistant immediately instructs them to flag nearby stadium staff/stewards or call emergency services instead of attempting medical diagnosis.

---

## 5. Assumptions & Known Limitations
- **Simulated Feeds**: Data feeds (crowd density, transit ETAs, gate queues) are loaded from static, structured JSON files in-memory representing simulated live feeds.
- **Language Scope**: Language translation is supported for English, Spanish, French, and Arabic.
- **No PII**: No personal user details are captured or stored; location is session-scoped.

---

## 6. Unified Testing Command
To run both the React frontend tests (Vitest) and python backend tests (Pytest) in one go:

### Windows (Command Prompt / PowerShell)
Execute the batch script from the repository root:
```bash
.\run_tests.bat
```

### Manual Execution
- **Backend Tests**: Run `python -m pytest` in the repository root.
- **Frontend Tests**: Run `npm run test` in `/frontend`.
