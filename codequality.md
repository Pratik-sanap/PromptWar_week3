# codequality.md — Code Quality Standards

Judged on: **structure, readability, maintainability.**

## 1. Structure
- Follow the layout in guidelines.md §3 — don't dump everything in one file.
- One responsibility per module: routing ≠ business logic ≠ LLM prompt
  building ≠ data access. Keep AI prompt/tool code isolated in `backend/ai/`
  so it's easy for a reviewer to find the "smart" part.
- No dead code, no commented-out experiments left in — delete or note in a
  `NOTES.md` outside the main tree.

## 2. Naming & Style
- Descriptive names over comments where possible: `get_nearest_gate(zone)`
  not `get_data(z)`.
- One consistent formatter/linter per language, run before every commit:
  - Python: `black` + `ruff` (or `flake8`)
  - JS/TS: `prettier` + `eslint`
- Consistent casing: `snake_case` (Python), `camelCase` (JS), `PascalCase`
  for components/classes.

## 3. Functions & Files
- Keep functions small and single-purpose (~<40 lines as a rule of thumb).
  If a function both calls the LLM *and* parses stadium data *and* formats
  a response, split it.
- Avoid deep nesting — prefer early returns / guard clauses.
- Avoid magic numbers/strings — put zone IDs, thresholds (e.g. "queue is
  'high' above N people"), and config in one constants/config file.

## 4. Comments & Docstrings
- Every public function (tools, API routes, decision-rule functions) gets a
  1–3 line docstring: what it does, inputs, outputs.
- Comment *why*, not *what*, for non-obvious logic (e.g. why a certain
  distance threshold was chosen for "nearby gate").

## 5. Error Handling
- No bare `except:` / empty `catch {}`. Catch specific errors, log them,
  return a clean user-facing message.
- Never let an unhandled exception surface a stack trace to the frontend.

## 6. Version Control Hygiene
- Small, focused commits with meaningful messages (see guidelines.md §2).
- No secrets, no generated build folders, no `.env` ever committed.

## 7. Quick Self-Review Checklist (run before each commit)
- [ ] Linter/formatter run, no warnings
- [ ] No `console.log` / `print` debug statements left in
- [ ] No TODOs left unresolved without a tracking note
- [ ] Function/file names still describe what's actually inside
- [ ] Would a stranger understand this file in under 2 minutes?
