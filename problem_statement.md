# Problem Statement — [Challenge 4] Smart Stadiums & Tournament Operations

**Event:** PromptWars Virtual — Hack2Skill

## Brief
Build a GenAI-enabled solution that enhances stadium operations and the overall
tournament experience for **fans, organizers, volunteers, or venue staff** during the
**FIFA World Cup 2026**.

The solution must leverage Generative AI to improve at least one of:
- Navigation
- Crowd management
- Accessibility
- Transportation
- Sustainability
- Multilingual assistance
- Operational intelligence
- Real-time decision support

## Chosen Vertical (fill in / lock this before building)
> Pick ONE persona and design the entire solution around it. Do not try to serve all
> personas — judges penalize unfocused scope.

- [ ] **Fan** — e.g. an AI concierge that answers "where's my gate / nearest restroom /
      how do I get back to my hotel" in the fan's own language.
- [ ] **Volunteer / Venue Staff** — e.g. an AI dispatch assistant that triages incoming
      radio/chat reports (medical, crowd density, lost child) and recommends next action.
- [ ] **Organizer** — e.g. an operational-intelligence dashboard that summarizes live
      signals (crowd density by zone, incident reports, transport delays) into a
      GenAI-generated action brief every N minutes.
- [ ] **Accessibility-focused** — e.g. an assistant for wheelchair users / visually
      impaired fans giving route guidance and real-time obstacle/queue info.

**Recommended default (used in the rest of these docs):** Fan-facing multilingual
stadium assistant — a chat/voice concierge that helps a fan navigate the stadium,
get accessibility routes, find transport options, and get real-time crowd/queue
guidance, powered by an LLM (Gemini) with tool-calling into structured stadium data.

## Hard Submission Constraints
- Max **3 attempts**
- Repo size **< 10 MB**
- Repo must be **public**
- **Single branch only**
- Complete code + README (vertical chosen, approach/logic, how it works, assumptions)

## Evaluation Weighting (design to these, in this order)
1. **High Impact:** Core GenAI logic actually working end-to-end for the chosen persona;
   demonstrable "smart, dynamic assistant" behavior; logical decision-making based on
   user context.
2. **Medium Impact:** Code quality, security, efficiency — "works under the hood."
3. **Low Impact:** Polish — UI finish, accessibility niceties, extra docs.

## Assumptions to state explicitly in the README
- No real FIFA/stadium data is available → mock/synthetic data used for gates, zones,
  transport lines, crowd density, etc.
- No production LLM budget → API key provided via `.env`, not committed; graceful
  fallback if quota/key is missing.
- Real-time feeds (crowd sensors, transit APIs) are simulated with mock JSON/random
  generators, clearly labeled as such in code and README.
