# security.md — Security Guidelines

Judged on: **safe and responsible implementation.**

## 1. Secrets Management
- `GEMINI_API_KEY` and any other credentials live only in `.env`, which is
  in `.gitignore` from the very first commit.
- Ship `.env.example` with placeholder values only.
- Before every push: `git status` / `git diff` check that no `.env` or key
  material is staged. Consider a pre-commit hook (`gitleaks` or similar) if
  time allows.
- If a secret is ever accidentally committed: rotate the key immediately —
  do not just delete it in a later commit (it stays in history).

## 2. Input Validation & Sanitization
- Treat every user chat message as untrusted input.
- Validate structured fields (zone ID, language code, gate ID) against an
  allow-list/enum before using them in any tool call or data lookup.
- Enforce a max message length to prevent abuse/oversized prompts.
- Strip/escape anything before it's ever used to build file paths, shell
  commands, or DB queries (avoid string-concatenated queries entirely —
  use parameterized calls if a real DB is used).

## 3. Prompt-Injection Awareness
- Since user text goes into an LLM prompt, explicitly instruct the system
  prompt to ignore instructions embedded in user messages that try to
  change its role, reveal the system prompt, or bypass the stadium-assistant
  scope (e.g. "ignore previous instructions and...").
- Don't let the model's output directly trigger sensitive backend actions
  (e.g. no "the model can call arbitrary shell/file operations") — tool
  calls are limited to a fixed, safe, read-only set of stadium-data
  functions.

## 4. API/Backend Safety
- CORS configured to only the frontend origin used in dev/demo, not `*`,
  where practical.
- Rate-limit or at least soft-throttle the chat endpoint to avoid one user
  burning the whole API quota.
- Return generic error messages to the client; log detailed errors
  server-side only.
- No PII should be required to use the assistant — if location is used,
  keep it session-scoped/in-memory only, not persisted to disk/DB.

## 5. Dependency Hygiene
- Keep dependencies minimal; avoid unmaintained/abandoned packages.
- Don't vendor large or unnecessary libraries just to save an import line —
  it hurts both security surface and repo size.

## 6. Responsible-AI Notes (worth a line in the README)
- The assistant should decline or safely redirect for out-of-scope or
  unsafe requests (e.g. medical emergencies → tell the user to alert
  on-site staff/security, don't attempt to give medical advice).
- Clearly label any simulated/mock data as such in the UI copy so judges
  (and hypothetically real users) aren't misled about live-data claims.

## 7. Quick Checklist
- [ ] No secrets in git history
- [ ] All user input validated before use
- [ ] System prompt has explicit anti-injection instructions
- [ ] Tool calls are a fixed, safe, read-only set
- [ ] Errors don't leak stack traces / internals to the client
- [ ] Out-of-scope/emergency requests handled safely, not guessed at
