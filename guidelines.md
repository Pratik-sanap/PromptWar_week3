# Project Guidelines — PromptWars Smart Stadium Assistant

These are the master rules the whole build must follow. Every other doc
(codequality.md, security.md, efficiency.md, test.md, gemini.md) is a
zoomed-in view of one section here. When in doubt, this file wins.

## 1. Scope Discipline
- One persona, one core use-case, done well > five half-built features.
- Before writing code, freeze: (a) chosen vertical, (b) 3–5 user stories,
  (c) what is explicitly OUT of scope. Put this in the README.
- If a feature doesn't serve the frozen use-case, cut it — repo size and
  time are both hard-capped.

## 2. Repo & Git Hygiene (hard requirements)
- Single repo, **single branch** (`main`). Never create feature branches for
  this submission — commit directly with clear messages.
- Repo must be **public** and **under 10 MB total** including `.git` history.
  - Never commit: `node_modules/`, `venv/`, `.env`, build artifacts, model
    weights, large sample media. Add a `.gitignore` before the first commit.
  - Keep mock data small (a few KB of JSON, not MBs of CSV).
- Commit early, commit often, with meaningful messages
  (`feat: add gate-finder tool call`, not `update`).
- You get 3 attempts total on the whole challenge — treat every commit as if
  it could be the last one evaluated. Keep `main` always in a working state.

## 3. Architecture (recommended)
```
/frontend      -> simple web UI (React or plain HTML/JS) — chat/voice interface
/backend       -> API layer (FastAPI/Flask/Node/Express) — auth, orchestration
/backend/ai    -> Gemini integration, prompt templates, tool/function definitions
/backend/data  -> mock stadium data (gates, zones, transport, crowd density)
/tests         -> unit + integration tests
docs/          -> this folder
README.md
.env.example
.gitignore
```
- Keep frontend and backend decoupled via a documented REST/JSON contract
  (`connections` prompts below exist specifically to define this contract).

## 4. Definition of Done (per feature)
A feature is "done" only when:
1. It works against realistic mock data end-to-end (UI → API → LLM → response).
2. It has at least one automated test (see test.md).
3. It fails gracefully (see security.md / efficiency.md) — no stack traces
   leaking to the user, no silent hangs.
4. It's documented in the README in one sentence.

## 5. Documentation Requirements
README must contain, in this order:
1. Chosen vertical + one-paragraph pitch
2. Architecture diagram (ASCII is fine)
3. Setup/run instructions (must work on a clean machine in < 5 min)
4. How the GenAI logic makes decisions (the judged "smart, dynamic" part)
5. Assumptions & known limitations
6. Screenshots or a short GIF if size allows

## 6. Communication with AI Pair-Programmer (Antigravity)
- Work in small, reviewable diffs — one prompt per feature slice, not
  "build the whole app."
- Always tell the assistant the current file tree and constraints (repo size,
  no secrets in code) at the start of a new session.
- Review every generated file before committing — you are accountable for
  the code, not the tool.

## 7. Priority Order When Time Runs Short
1. Core GenAI flow working for one user story (High Impact)
2. Basic security (no leaked keys, input validation) + tests passing (Medium)
3. Code cleanliness, efficiency tuning (Medium)
4. UI polish, accessibility, extra personas (Low) — only if time remains
