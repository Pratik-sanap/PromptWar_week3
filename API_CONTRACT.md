# API Contract — `POST /api/chat`

> Single endpoint for all chat interactions between the frontend and the
> Smart Stadium Concierge backend. Defined per `guidelines.md §3`.

## Base URL

| Environment | URL |
|-------------|-----|
| Dev         | `http://localhost:5000` (proxied via Vite at `http://localhost:3000/api`) |
| Demo        | Set via `VITE_BACKEND_URL` env var |

---

## Request

```
POST /api/chat
Content-Type: application/json
```

### Body

| Field               | Type                        | Required | Constraints                                      |
|---------------------|-----------------------------|----------|--------------------------------------------------|
| `message`           | `string`                    | ✅       | Max 500 characters                               |
| `language`          | `string`                    | ✅       | Enum: `"en"`, `"es"`, `"fr"`, `"ar"`             |
| `sessionId`         | `string`                    | ✅       | Opaque client-generated ID                       |
| `zone`              | `string`                    | ✅       | Enum: `"zone_a"` – `"zone_f"`                    |
| `accessibilityNeeds`| `{ wheelchair: bool, visual: bool }` | ✅ | Both keys required                         |
| `history`           | `Array<HistoryTurn>`        | ❌       | Defaults to `[]`. Capped to last 6 turns server-side. |

#### `HistoryTurn`

```json
{
  "sender": "user" | "assistant",
  "text": "string"
}
```

### Example Request

```json
{
  "message": "Where is the nearest gate?",
  "language": "en",
  "sessionId": "session-abc123xyz",
  "zone": "zone_a",
  "accessibilityNeeds": { "wheelchair": true, "visual": false },
  "history": [
    { "sender": "user", "text": "Hello" },
    { "sender": "assistant", "text": "Welcome! How can I help?" }
  ]
}
```

---

## Success Response — `200 OK`

```json
{
  "reply": "string",
  "structuredData": StructuredData | null
}
```

| Field            | Type                   | Description |
|------------------|------------------------|-------------|
| `reply`          | `string`               | Natural-language answer from the concierge. |
| `structuredData` | `StructuredData \| null` | Rich card data for the frontend to render, or `null` if the answer is text-only. |

### `StructuredData` — Gate Recommendation

```json
{
  "type": "gate_recommendation",
  "data": {
    "gateName": "Gate A1",
    "distance": "75m",
    "queueStatus": "Low" | "Medium" | "High",
    "accessible": true
  }
}
```

### `StructuredData` — Transport Options

```json
{
  "type": "transport_options",
  "data": {
    "options": [
      { "mode": "train" | "bus" | "shuttle", "line": "string", "eta": "string" }
    ]
  }
}
```

### `StructuredData` — Crowd Density

```json
{
  "type": "crowd_density",
  "data": {
    "zone": "ZONE_A",
    "density": "40%",
    "status": "Normal" | "Busy"
  }
}
```

---

## Error Responses

All errors follow this shape:

```json
{
  "detail": "string"
}
```

| Status | Condition                        | Example `detail`                                                      |
|--------|----------------------------------|-----------------------------------------------------------------------|
| `422`  | Validation error (bad field)     | `"Language must be one of {'en', 'es', 'fr', 'ar'}"`                  |
| `429`  | Rate limit exceeded (5 req/10s)  | `"Rate limit exceeded. Please wait a moment before sending another message."` |
| `500`  | Unexpected server / AI failure   | `"An unexpected error occurred. Please try again later."`             |

> **Note:** On AI failure (Gemini API down / key missing), the backend
> returns `200` with a deterministic **offline fallback** reply — not a 500.
> A 500 only occurs for truly unexpected exceptions. See `gemini.md §5`.

---

## Rate Limiting

- **Window:** 10 seconds
- **Max requests per session:** 5
- Tracked by `sessionId` (in-memory, not persisted).

---

## CORS

- Allowed origins set via `ALLOWED_ORIGINS` environment variable.
- Defaults to `http://localhost:3000, http://127.0.0.1:3000` in dev.
- See `security.md §4`.
