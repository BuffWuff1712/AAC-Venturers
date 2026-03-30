// Scenario system types shared across scenario pages and components.

export type Speaker = "friend" | "child" | "auntie" | "teacher";

// A single line in the conversation log
export interface TranscriptEntry {
  speaker: Speaker;
  label: string; // Display label, e.g. "Friend", "You"
  text: string;
  timestamp: number; // ms since scenario start, used for analytics
}

// One "page" (step) inside a scenario
export interface ScenarioStep {
  id: number;
  instruction: string; // Text shown in the instruction banner
  characterSpeech?: string; // What the character says (if any)
  waitForChild: boolean; // Whether we record the child's response
  autoAdvanceAfterMs?: number; // Auto-move to next step after N ms (no child input)
}

// Full scenario definition
export interface ScenarioConfig {
  id: string;
  title: string;
  totalSteps: number;
  backgroundImage: string; // Path inside /public/images/
  characterImage: string; // Path inside /public/images/
  characterName: string;
  steps: ScenarioStep[];
}

// Per-prompt analytics collected during a run
export interface PromptAnalytic {
  stepId: number;
  label: string; // e.g. "Greeting response"
  responseTimeMs: number;
  hintsUsed: number;
}

// Final session result passed to the completion / caregiver page
export interface SessionResult {
  scenarioId: string;
  scenarioTitle: string;
  transcript: TranscriptEntry[];
  analytics: PromptAnalytic[];
  totalSteps: number;
  completedSteps: number;
  totalResponseTimeMs: number;
  audioBlob?: Blob; // Merged recording, if available
}

// Character personality slider pair
export interface PersonalityPair {
  key: string;
  left: string;
  right: string;
  value: number; // 0 = fully left, 100 = fully right
}

// App-wide settings shape
export interface AppSettings {
  volume: number; // 0-100
  backgroundNoise: "low" | "medium" | "high";
  personality: PersonalityPair[];
}
