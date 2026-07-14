# test.md — Testing Strategy

"Testing" is an explicit evaluation criterion — don't skip this even under
time pressure; a thin real test suite beats zero tests.

## 1. Test Pyramid (scaled for hackathon time budget)
- **Unit tests (most of your effort):** pure functions — data lookups,
  decision rules (e.g. "pick alternate gate if queue high"), input
  validators, prompt-formatting helpers.
- **Integration tests (a handful):** API endpoint → mocked LLM/tool layer →
  expected JSON shape. Confirms frontend/backend contract holds.
- **Manual/E2E (documented, not necessarily automated):** 5–10 scripted
  chat conversations run by hand and pasted into `sample_conversations.md`
  as evidence.

## 2. What Must Have a Test
- Every stadium-data tool function (`find_nearest_gate`, `get_transport_options`,
  `get_crowd_density`, `get_accessibility_route`, ...): happy path + at least
  one edge case (unknown zone, empty data, malformed input).
- Every decision rule that changes the answer based on context (queue
  comparison, accessibility routing) — assert the *decision*, not just that
  it "returns something."
- Input validation / sanitization functions.
- API route error handling (missing field → 400, not 500).

## 3. Mocking the LLM
- Never call the real Gemini API in automated tests — mock the client and
  assert on: (a) the prompt/context sent, (b) that tool results are correctly
  merged, (c) fallback behavior when the mock raises an error/timeout.
- Keep one optional "live" smoke test, skipped by default, for manual runs
  against the real API before a demo.

## 4. Tooling
- Python: `pytest` (+ `pytest-mock` or `unittest.mock`).
- Node: `jest` or `vitest`.
- Add a single `npm test` / `pytest` command documented in the README —
  reviewers will try to run it.
- Optional: a minimal GitHub Actions workflow that runs tests on push
  (nice-to-have, low impact, only if repo size allows — Actions config is
  tiny so it's fine).

## 5. Definition of "Tested Enough" for Submission
- [ ] All tool/data functions have ≥1 passing test
- [ ] At least 2 tests cover the "smart decision" logic explicitly
- [ ] At least 1 integration test covers a full API request/response
- [ ] `sample_conversations.md` has 5+ real transcripts showing multilingual
      or accessibility or crowd-routing behavior
- [ ] Test command runs clean (`0 failing`) before every commit to `main`
