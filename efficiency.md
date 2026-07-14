# efficiency.md — Efficiency Guidelines

Judged on: **optimal use of resources.** For a live-event assistant, this
means fast responses and low wasted compute/API spend, not just "big-O."

## 1. LLM Call Efficiency
- Cap conversation history sent to the model (e.g. last 6–10 turns) —
  don't resend the entire chat every time.
- Set a reasonable `max_output_tokens` — a stadium-navigation answer doesn't
  need 2000 tokens.
- Cache tool results that don't change per-request within a short TTL (e.g.
  crowd density refreshed every 30–60s, not recomputed per message).
- Batch/skip redundant tool calls: if the model already has the user's zone
  from context, don't re-fetch it.
- Debounce/throttle on the frontend so rapid typing doesn't fire multiple
  requests.

## 2. Data & Backend Efficiency
- Mock stadium data should be loaded once at startup (in-memory dict/JSON),
  not re-read from disk per request.
- Use indexed/O(1) lookups (dict by zone/gate ID) instead of scanning lists
  linearly for every query.
- Keep payloads small — return only the fields the frontend needs, not
  entire raw objects.

## 3. Frontend Efficiency
- Avoid unnecessary re-renders (memoize components/lists that don't change
  per message).
- Lazy-load anything non-critical (maps, images) so first response feels
  fast.
- Show a loading/typing indicator immediately — perceived speed matters as
  much as raw speed for a demo.

## 4. Resource/Cost Awareness
- Log approximate token usage per request during dev to catch runaway
  prompts early.
- Timeout every external call (LLM, mock "transit API") — never let a
  request hang indefinitely; fail fast with a fallback (see gemini.md §5).

## 5. Repo-Size Efficiency (ties back to the 10 MB hard limit)
- No committed datasets beyond small mock JSON.
- No committed `node_modules`, virtualenvs, model files, or media over a
  few hundred KB.
- Prefer CDN-hosted or SVG assets over embedded large images.

## 6. Quick Checklist
- [ ] Response time for a typical query is demoable in a few seconds
- [ ] No duplicate tool calls for data already known in context
- [ ] History/context sent to LLM is capped
- [ ] All data loaded once, looked up efficiently
- [ ] Repo stays well under 10 MB after `git gc`
