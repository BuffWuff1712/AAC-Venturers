# AACventure – Scenario System

## File Structure

Drop all files into your existing Next.js project:

```
project/
├── types/
│   └── scenario.ts              ← Shared TypeScript interfaces
├── components/
│   └── scenario/
│       ├── InstructionBanner.tsx  ← Purple step banner (top of screen)
│       ├── CharacterStage.tsx     ← Character + speech bubble
│       ├── TranscriptPanel.tsx    ← Scrollable conversation log
│       ├── RecordingIndicator.tsx ← Auto-recording badge + Stop button
│       └── AchievementBanner.tsx  ← Slide-in notification + confetti
├── pages/
│   ├── scenarios.tsx            ← Updated card grid (Start Adventure works)
│   ├── settings.tsx             ← Volume, noise level, personality sliders
│   └── scenario/
│       ├── canteen.tsx          ← Full 4-step canteen scenario orchestrator
│       └── completion.tsx       ← Mascot, checklist, analytics, eval form
└── public/
    └── images/
        ├── canteen.jpg          ← ⚠️  Add your canteen background here
        └── student.png          ← ⚠️  Add your character image here
```

## Install Required Package

```bash
npm install canvas-confetti
npm install -D @types/canvas-confetti
```

## Image Placeholders

1. **`public/images/canteen.jpg`** – Use the uploaded canteen background image.
2. **`public/images/student.png`** – Add a transparent-background character PNG.
   A free placeholder: download any child character from Freepik/Unsplash and
   save it to this path.

## Tailwind Custom Colours (tailwind.config.js)

The existing project uses these custom colours – make sure they're present:

```js
theme: {
  extend: {
    colors: {
      "page-peach":  "#FFF5EC",
      "text-brown":  "#5C3B1E",
      "child-green": "#A3D56A",
    },
    fontFamily: {
      fredoka: ["Fredoka One", "cursive"],
    },
  },
},
```

## How the Scenario Flow Works

```
ScenariosPage  →  [Start Adventure]
    ↓
canteen.tsx     (Step 1-4, auto-recording, transcript)
    ↓
completion.tsx  (Mascot → Checklist → Analytics → Eval form)
```

## Speech Recognition

Uses the native **Web Speech API** (`SpeechRecognition`).
- Works in Chrome and Edge on desktop and Android.
- On iOS Safari, recognition is limited — consider adding a fallback manual text input.
- Language is set to `en-SG` (Singapore English). Change in `RecordingIndicator.tsx`.

## Settings Persistence

Settings are saved to `localStorage` under the key `aacventure_settings`.
They survive page refreshes automatically.
