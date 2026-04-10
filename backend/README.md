# AAC Venturers Backend

Backend server for the AAC Venturers application, providing APIs for user authentication, scenario management, and interactive practice sessions.

## Quick Start

### Installation

```bash
cd backend
npm install
```

### Running Locally

```bash
npm run dev    # Development mode with hot reload
npm start      # Production mode
```

The server runs on `http://localhost:3000` by default.

## Database Schema

The database uses SQLite with the following table structure:

### User Management

**users**

- `user_id` (TEXT, PRIMARY KEY)
- `role` (TEXT: 'caregiver' | 'child')
- `created_at` (TIMESTAMP)

**caregivers**

- `caregiver_id` (TEXT, PRIMARY KEY)
- `user_id` (TEXT, FOREIGN KEY to users)
- `email` (TEXT, UNIQUE)
- `password_hash` (TEXT, bcryptjs hashed)

**children**

- `child_id` (TEXT, PRIMARY KEY)
- `user_id` (TEXT, FOREIGN KEY to users)
- `caregiver_id` (TEXT, FOREIGN KEY to caregivers)
- `name` (TEXT)
- `xp` (INTEGER, DEFAULT 0)

### Scenarios & Content

**scenarios**

- `scenario_id` (TEXT, PRIMARY KEY)
- `title` (TEXT)
- `created_by` (TEXT, FOREIGN KEY to caregivers)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)

**scenario_settings**

- `settings_id` (TEXT, PRIMARY KEY)
- `scenario_id` (TEXT, UNIQUE, FOREIGN KEY to scenarios)
- `location_name` (TEXT)
- `location_image_url` (TEXT)
- `background_noise` (INTEGER, DEFAULT 20)
- `ai_personality_prompt` (TEXT)
- `contingencies` (TEXT)
- `updated_at` (TIMESTAMP)

**objectives**

- `objective_id` (TEXT, PRIMARY KEY)
- `scenario_id` (TEXT, FOREIGN KEY to scenarios)
- `description` (TEXT)
- `position` (INTEGER)
- `is_required` (BOOLEAN)

### Sessions & Interactions

**sessions**

- `session_id` (TEXT, PRIMARY KEY)
- `child_id` (TEXT, FOREIGN KEY to children)
- `scenario_id` (TEXT, FOREIGN KEY to scenarios)
- `start_time` (TIMESTAMP)
- `end_time` (TIMESTAMP)
- `total_questions` (INTEGER)
- `successful_first_attempts` (INTEGER)
- `xp_earned` (INTEGER)

**interactions**

- `interaction_id` (TEXT, PRIMARY KEY)
- `session_id` (TEXT, FOREIGN KEY to sessions)
- `question_text` (TEXT)
- `asked_at` (TIMESTAMP)

**responses**

- `response_id` (TEXT, PRIMARY KEY)
- `interaction_id` (TEXT, FOREIGN KEY to interactions)
- `response_text` (TEXT)
- `input_mode` (TEXT: 'voice' | 'text' | 'aac')
- `response_time_seconds` (FLOAT)
- `used_prompt` (BOOLEAN)
- `is_successful` (BOOLEAN)
- `created_at` (TIMESTAMP)

### Analytics

**session_analytics**

- `session_id` (TEXT, PRIMARY KEY, FOREIGN KEY to sessions)
- `avg_response_time` (FLOAT)
- `longest_response_time` (FLOAT)
- `shortest_response_time` (FLOAT)
- `success_rate` (FLOAT)
- `longest_question_id` (TEXT)
- `shortest_question_id` (TEXT)

**objective_completion**

- `completion_id` (TEXT, PRIMARY KEY)
- `session_id` (TEXT, FOREIGN KEY to sessions)
- `objective_id` (TEXT, FOREIGN KEY to objectives)
- `is_checked` (BOOLEAN)

**session_recordings** (for future use)

- `recording_id` (TEXT, PRIMARY KEY)
- `session_id` (TEXT, UNIQUE, FOREIGN KEY to sessions)
- `audio_url` (TEXT)
- `transcript` (TEXT)

## Demo Credentials

```
Email: teacher@example.com
Password: demo123
```

## API Routes

All endpoints return JSON. Use camelCase in requests/responses.

### Authentication

#### Login

```http
POST /auth/login
```

**Request:**

```json
{
  "email": "teacher@example.com",
  "password": "demo123",
  "role": "caregiver"
}
```

**Response (201):**

```json
{
  "user": {
    "userId": "user-caregiver-001",
    "caregiverId": "caregiver-001",
    "role": "caregiver",
    "email": "teacher@example.com"
  },
  "token": "demo-session-token"
}
```

For child login:

```json
{
  "role": "child"
}
```

**Response:**

```json
{
  "user": {
    "userId": "user-child-001",
    "childId": "child-001",
    "role": "child",
    "name": "Sample Child"
  },
  "token": "demo-session-token"
}
```

**Error (401):**

```json
{
  "message": "Invalid caregiver credentials."
}
```

---

### Child Routes

#### Get Available Scenarios

```http
GET /child/scenarios
```

**Response (200):**

```json
[
  {
    "scenarioId": "scenario-001",
    "title": "Western Stall at School Canteen",
    "locationName": "Western Stall at School Canteen",
    "locationImage": "/images/western-stall.jpg"
  }
]
```

#### Start a New Session

```http
POST /child/sessions
```

**Request:**

```json
{
  "scenarioId": "scenario-001",
  "childId": "child-001"
}
```

**Response (201):**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "scenario": {
    "scenarioId": "scenario-001",
    "title": "Western Stall at School Canteen",
    "isActive": true
  },
  "messages": [
    {
      "speaker": "assistant",
      "message": "Hello! How can I help you today?"
    }
  ]
}
```

#### Get Session Details

```http
GET /child/sessions/:sessionId
```

**Response (200):**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "childId": "child-001",
  "scenarioId": "scenario-001",
  "startTime": "2026-04-03T15:30:00.000Z",
  "endTime": null,
  "totalQuestions": 5,
  "successfulFirstAttempts": 3,
  "xpEarned": 0,
  "interactions": [
    {
      "interactionId": "int-001",
      "questionText": "What would you like to order?",
      "askedAt": "2026-04-03T15:30:05.000Z",
      "responses": [
        {
          "responseId": "resp-001",
          "responseText": "I'd like chicken chops",
          "inputMode": "text",
          "responseTimeSeconds": 2.5,
          "usedPrompt": false,
          "isSuccessful": true,
          "createdAt": "2026-04-03T15:30:07.500Z"
        }
      ]
    }
  ]
}
```

#### Send Response During Session

```http
POST /child/sessions/:sessionId/respond
```

**Request:**

```json
{
  "input": "I'd like chicken chops",
  "inputMode": "text"
}
```

Valid input modes: `"text"`, `"voice"`, `"aac"`

**Response (200):**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "message": "That's a great choice! Would you like any customizations?",
  "sessionComplete": false,
  "xpEarned": 0
}
```

When session completes:

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "message": "Great job! You've completed the scenario.",
  "sessionComplete": true,
  "xpEarned": 50
}
```

---

### Caregiver Routes

#### Get All Scenarios

```http
GET /caregiver/scenarios
```

**Response (200):**

```json
[
  {
    "scenarioId": "scenario-001",
    "title": "Western Stall at School Canteen",
    "locationName": "Western Stall at School Canteen",
    "isActive": true
  }
]
```

#### Get Scenario Details & Settings

```http
GET /caregiver/scenarios/:scenarioId
```

**Response (200):**

```json
{
  "scenario": {
    "scenarioId": "scenario-001",
    "title": "Western Stall at School Canteen",
    "isActive": true
  },
  "settings": {
    "settings_id": "settings-001",
    "scenario_id": "scenario-001",
    "location_name": "Western Stall at School Canteen",
    "location_image_url": "/images/western-stall.jpg",
    "background_noise": 20,
    "ai_personality_prompt": "You are a friendly and patient western food stall owner...",
    "contingencies": "If the child struggles, offer to show them a menu..."
  },
  "objectives": [
    {
      "objective_id": "objective-001",
      "scenario_id": "scenario-001",
      "description": "Order at least one menu item clearly",
      "position": 1,
      "is_required": 1
    }
  ]
}
```

#### Update Scenario Settings

```http
PUT /caregiver/scenarios/:scenarioId/settings
```

**Request:**

```json
{
  "locationName": "Updated Location",
  "locationImageUrl": "/images/new-image.jpg",
  "backgroundNoise": 25,
  "aiPersonalityPrompt": "Updated personality prompt...",
  "contingencies": "Updated contingencies..."
}
```

**Response (200):**

```json
{
  "message": "Settings updated successfully"
}
```

#### Get Session History for Scenario

```http
GET /caregiver/scenarios/:scenarioId/history
```

**Response (200):**

```json
[
  {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "child_id": "child-001",
    "start_time": "2026-04-03T15:30:00.000Z",
    "end_time": "2026-04-03T15:45:00.000Z",
    "total_questions": 5,
    "successful_first_attempts": 3,
    "xp_earned": 50
  }
]
```

#### Get Session Analytics

```http
GET /caregiver/sessions/:sessionId/analytics
```

**Response (200):**

```json
{
  "avgResponseTime": 2.8,
  "longestResponseTime": 5.2,
  "shortestResponseTime": 1.3,
  "successRate": 0.85
}
```

#### Get Overall Analytics Summary

```http
GET /caregiver/analytics
```

**Response (200):**

```json
{
  "summary": {
    "totalSessions": 12,
    "averageResponseTime": 2.5,
    "averageSuccessRate": 0.82
  },
  "recentSessions": [
    {
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "child_id": "child-001",
      "start_time": "2026-04-03T15:30:00.000Z",
      "end_time": "2026-04-03T15:45:00.000Z",
      "xp_earned": 50,
      "success_rate": 0.85,
      "avg_response_time": 2.8
    }
  ]
}
```

---

## Error Handling

Common error responses:

**400 Bad Request:**

```json
{
  "message": "Invalid role."
}
```

**401 Unauthorized:**

```json
{
  "message": "Invalid caregiver credentials."
}
```

**404 Not Found:**

```json
{
  "message": "Scenario not found"
}
```

**500 Internal Server Error:**

```json
{
  "message": "Login failed",
  "error": "Error details..."
}
```

## Development Notes

- **Password Hashing:** Uses bcryptjs (bcrypt algorithm) for secure password storage
- **UUIDs:** Session IDs, interaction IDs, and response IDs are generated using Node's crypto module
- **Timestamps:** All timestamps are in ISO 8601 format (UTC)
- **SQLite:** Uses better-sqlite3 for synchronous database operations
- **CORS:** Enabled for cross-origin requests from frontend

## File Structure

```
backend/
├── src/
│   ├── app.js                 # Express app setup
│   ├── server.js              # Server entry point
│   ├── config/
│   │   └── env.js             # Environment variables
│   ├── db/
│   │   ├── database.js        # Database initialization
│   │   ├── schema.js          # Database schema
│   │   └── seed.js            # Seed data
│   ├── data/
│   │   └── seedData.js        # Sample data
│   ├── middleware/
│   │   └── errorHandler.js    # Error handling middleware
│   ├── routes/
│   │   ├── authRoutes.js      # Authentication routes
│   │   ├── childRoutes.js     # Child interaction routes
│   │   └── caregiverRoutes.js # Caregiver management routes
│   └── services/
│       └── orchestration/
│           ├── conversationOrchestrator.js  # Session flow control
│           ├── contextBuilder.js            # Data loading
│           ├── decisionEngine.js            # Logic for next actions
│           ├── llmService.js                # LLM integration
│           ├── responseValidator.js         # Response validation
│           └── sessionTracker.js            # Session tracking & analytics
└── package.json
```

## Next Steps for Frontend

1. Install the `aac-venturers-backend` as a dependency or run locally
2. Use the `/auth/login` endpoint to authenticate users
3. Call `/child/scenarios` to display available practice scenarios (child view)
4. Call `/child/sessions` to create a new session
5. Use `/child/sessions/:sessionId/respond` in a loop for interactive conversation
6. Use `/caregiver/` endpoints to display caregiver dashboards
