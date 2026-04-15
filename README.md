# AAC-Venturers

AAC-Venturers is a hackathon-friendly vertical slice for AAC communication practice. A caregiver configures one canteen scenario, then a child practices ordering food from an AI-powered western stall owner.

## Stack

- Frontend: Next.js + React + Tailwind CSS
- Backend: Node.js + Express
- Database: SQLite with `better-sqlite3`
- AI: OpenAI API with a guarded orchestration pipeline and fallback local responses

## Documentation

- **Backend API & Database:** See [backend/README.md](backend/README.md) for complete API documentation, schema details, and setup instructions.

## Project structure

```text
AAC-Venturers/
  backend/
    src/
      config/
      data/
      db/
      middleware/
      routes/
      services/orchestration/
  frontend/
    src/
      app/
      api/
      components/
      context/
      layouts/
      styles/
      views/
```

## Architecture

The prototype is intentionally modular so the demo story is easy to explain:

1. `routes/`
   HTTP endpoints for caregiver login, scenario management, analytics, and child chat.
2. `db/`
   SQLite schema creation plus one-pass seed setup for the western stall scenario, menu items, memory, and demo caregiver credentials.
3. `services/orchestration/contextBuilder.js`
   Loads the scenario, menu, memory, and session transcript context from SQLite.
4. `services/orchestration/decisionEngine.js`
   The controlled flow engine. It decides the next conversation action before any LLM call.
5. `services/orchestration/llmService.js`
   Builds a constrained prompt, requests structured JSON from OpenAI, and provides deterministic fallbacks if the API is unavailable.
6. `services/orchestration/responseValidator.js`
   Verifies the model stayed on the expected action and did not mention unsupported menu items.
7. `services/orchestration/sessionTracker.js`
   Persists transcripts, updates conversation state, and computes analytics values.
8. `services/orchestration/conversationOrchestrator.js`
   Coordinates the end-to-end workflow for conversation start and turn handling.

## Process flow

### Caregiver flow

1. Login with seeded demo credentials.
2. Open the manage scenario dashboard.
3. Edit the single seeded scenario: `Western Stall at school canteen`.
4. Choose one personality:
   - `impatient`
   - `hard_of_hearing`
   - `personable_familiar`
5. Toggle child memory on or off.
6. Review analytics and simple history.

### Child flow

1. Select the western stall scenario.
2. Start a session with a child name.
3. Chat by text with the AI stall owner.
4. Complete the purchase interaction.
5. Land on the completion screen with an XP placeholder.

## How the agent works

The AI is not allowed to run the whole flow. The code chooses the next step first.

### Action set

- `greet`
- `list_menu`
- `clarify`
- `follow_up`
- `suggest_usual`
- `confirm_order`
- `request_payment`
- `hint`
- `end`

### Orchestration sequence

1. Load scenario context.
2. Load menu data.
3. Load personality config.
4. Load optional child memory.
5. Inspect child input and stored session state.
6. Decide the next action in code.
7. Build a constrained LLM prompt.
8. Request a structured JSON reply.
9. Validate the response.
10. Save transcript and analytics in SQLite.

If the model output is invalid or OpenAI is not configured, the app falls back to deterministic canned replies so the prototype still works.

## Seeded prototype data

- Scenario: `Western Stall at school canteen`
- Menu:
  - Chicken Chop - `$5.50`
  - Fish and Chips - `$5.80`
  - Spaghetti - `$4.80`
- Customisations:
  - `no coleslaw`
  - `chilli on the side`
  - `extra fries`
- Child memory example:
  - `Chicken Chop, no coleslaw, chilli on the side`

## Analytics captured

- Average response time
- Hints used
- Clarification count
- Whether the ordering objective was completed

## Local setup

### 1. Install dependencies

From the project root:

```bash
npm install
```

### 2. Configure environment

Copy the backend example env file:

```bash
cd backend
copy .env.example .env
```

Add `OPENAI_API_KEY` if you want live model responses. Without it, the app still works using fallback responses.

### 3. Run the backend

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:4000`.

### 4. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Demo credentials

- Caregiver email: `teacher@example.com`
- Caregiver password: `demo123`

## Notes

- Authentication is intentionally simplified.
- Voice input is a placeholder only.
- There is one scenario and one child memory profile for the prototype.
- The database file is created automatically at `backend/data/aac_venturers.db`.
