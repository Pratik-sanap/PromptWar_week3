# gemini.md — GenAI Integration Guide

Governs how the LLM (Gemini) is wired into the assistant. This is the file
judges will scrutinize hardest ("smart, dynamic assistant" + "logical
decision making based on user context").

## 1. Why Gemini
- Native function/tool calling → lets the model decide *when* to call
  stadium-data tools (find gate, get transport options, check queue) instead
  of hallucinating answers.
- Multilingual out of the box → satisfies the "multilingual assistance" angle
  from the problem statement.
- Free-tier friendly for a hackathon budget.

## 2. Key & Config Handling
- API key lives ONLY in `.env` (`GEMINI_API_KEY=...`), loaded via
  `python-dotenv` / `dotenv` — never hard-coded, never logged.
- Ship a `.env.example` with a placeholder value.
- Backend fails with a clear, user-safe error message if the key is missing —
  never crashes with a raw traceback.

## 3. Prompt Architecture
- **System prompt** (one file, `backend/ai/system_prompt.md`) defines:
  - Persona (e.g. "You are a stadium concierge for FIFA World Cup 2026 fans")
  - Tone (concise, calm, helpful — this is a live-event assistant, not a
    chatty companion)
  - Hard rules: never invent gate numbers/times not returned by a tool call;
    if a tool has no data, say so and offer the closest alternative.
- **Context injection per turn:** user's stated location/zone, language,
  accessibility needs (if given), and conversation history (last N turns,
  capped — see efficiency.md).
- **Tool/function definitions** (structured, not prose) for each capability:
  `find_nearest_gate`, `get_transport_options`, `get_crowd_density(zone)`,
  `get_accessibility_route`, etc. Each tool reads from `backend/data/*.json`.

## 4. Decision-Making Pattern (this is the "logic" judges want to see)
1. User message arrives with context (location, language, accessibility flag).
2. Model decides: does this need a tool call, or is it a direct answer
   (e.g. "hello")?
3. If tool call → backend executes against mock data → result returned to
   model → model composes final natural-language answer in user's language.
4. Model applies simple decision rules on top of raw data, e.g.:
   - If nearest gate's queue is "high" and an alternate gate is "low" and
     within X meters, recommend the alternate — don't just answer the literal
     question.
   - If user flagged a mobility need, only ever route through
     accessibility-tagged paths.
5. Log (locally, not to any external service) the tool calls made per
   request for demo/debugging — this becomes good evidence for the README.

## 5. Guardrails
- Validate/sanitize all user input before it reaches the prompt (see
  security.md) — treat it as untrusted.
- Set `max_output_tokens` and a request timeout; never let a call hang.
- Never let the model call a tool with unvalidated free-text where it should
  be a constrained enum (e.g. `zone` must be one of the known zone IDs).
- On tool/model failure, return a deterministic fallback answer (e.g. "I
  couldn't reach live data — here's the general stadium map") rather than
  failing the whole request.

## 6. Testing the AI Layer
- Mock the Gemini client in unit tests (don't burn API quota / add
  network flakiness to CI). See test.md §3.
- Keep a small `sample_conversations.md` of 5–10 real transcripts to include
  as evidence in the README/demo — judges reward this because it proves the
  "dynamic" behavior without them having to run the app.
