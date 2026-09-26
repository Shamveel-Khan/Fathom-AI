# Meeting JSON Import Schema Documentation

This document describes the structure of JSON files accepted by the **Fathom AI Clone Meeting Importer**.

You can upload a `.json` file or paste raw JSON directly into the **Import Meeting** dialog on the dashboard.

---

## **JSON Structure Overview**

A valid meeting JSON file must have the following top-level structure:

```json
{
  "title": "H2 Product Strategy & AI Memory Architecture",
  "date": "Oct 28, 2026",
  "durationMinutes": 45,
  "template": "project",
  "videoUrl": "https://example.com/recording.mp4",
  "participants": [
    {
      "name": "Sarah Chen",
      "email": "sarah@fathom.ai",
      "role": "Head of Product",
      "avatarColor": "bg-emerald-500"
    }
  ],
  "transcript": [
    {
      "speaker": "Sarah Chen",
      "speakerRole": "Head of Product",
      "timestamp": "00:00",
      "timestampSeconds": 0,
      "text": "Thanks everyone for hopping on."
    }
  ],
  "analysis": {
    "executiveSummary": "Summary text...",
    "keyTakeaways": ["Point 1", "Point 2"],
    "actionItems": [
      {
        "task": "Deliver high-fidelity mockups",
        "assignee": "Elena Rostova",
        "dueDate": "Nov 2, 2026",
        "context": "Needs Wednesday delivery",
        "completed": false
      }
    ],
    "decisions": [
      {
        "decision": "Adopt GPT-4o Mini as default model",
        "rationale": "Cost reduction with high accuracy",
        "madeBy": "Sarah Chen",
        "timestamp": "02:40",
        "timestampSeconds": 160
      }
    ],
    "highlights": [
      {
        "quote": "Executives want readiness scores.",
        "speaker": "Elena Rostova",
        "timestamp": "04:10",
        "timestampSeconds": 250,
        "significance": "Core UX insight",
        "category": "key_moment"
      }
    ]
  },
  "review": {
    "overallScore": 92,
    "summary": "High alignment across product and engineering.",
    "unresolvedQuestions": [
      {
        "id": "q-1",
        "question": "Will offline LLMs need custom token streaming?",
        "context": "Marcus mentioned Ollama support in passing.",
        "raisedBy": "Marcus Brody",
        "severity": "low"
      }
    ],
    "unassignedResponsibilities": [],
    "missingDeadlines": [],
    "missingDependencies": [],
    "contradictions": [],
    "potentialRisks": [
      {
        "id": "r-1",
        "risk": "Large meeting transcripts may exceed prompt token limits.",
        "severity": "medium",
        "mitigation": "Implement multi-pass map-reduce summarization."
      }
    ]
  }
}
```

---

## **Field Reference & Types**

### **Top-Level Meeting Metadata**

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | Optional | Auto-generated | Unique meeting identifier (e.g. `mtg-101`). |
| `title` | `string` | **Yes** | — | Title of the meeting. |
| `date` | `string` | **Yes** | — | Formatted date string (e.g. `Oct 28, 2026` or `2026-10-28`). |
| `durationMinutes` | `number` | Optional | `30` | Duration of the meeting in minutes. |
| `template` | `string` | Optional | `"general"` | One of: `"general"`, `"one_on_one"`, `"sales"`, `"interview"`, `"project"`. |
| `videoUrl` | `string` | Optional | `null` | Optional URL to meeting recording. |
| `participants` | `Array<Participant>` | **Yes** | — | List of attendees (at least 1 required). |
| `transcript` | `Array<Utterance>` | **Yes** | — | Sequence of dialogue turns (at least 1 required). |
| `analysis` | `Object` | Optional | `null` | Structured AI summary, action items, decisions, highlights. |
| `review` | `Object` | Optional | `null` | AI Quality & Risk Audit findings. |

---

### **Participant Object**

```json
{
  "name": "Sarah Chen",
  "email": "sarah@fathom.ai",
  "role": "Head of Product",
  "avatarColor": "bg-emerald-500"
}
```

* `avatarColor` presets: `bg-emerald-500`, `bg-indigo-500`, `bg-blue-600`, `bg-purple-500`, `bg-rose-500`, `bg-amber-500`, `bg-teal-500`, `bg-slate-700`.

---

### **Transcript Utterance Object**

```json
{
  "id": "u-1",
  "speaker": "Sarah Chen",
  "speakerRole": "Head of Product",
  "timestamp": "01:24",
  "timestampSeconds": 84,
  "text": "Let's review the product milestones for next week."
}
```

* `timestamp`: String formatted as `"mm:ss"` or `"hh:mm:ss"`.
* `timestampSeconds`: Integer seconds (e.g. `84`). If omitted, it is automatically computed from `timestamp`.

---

### **Analysis Object (`analysis`)**

```json
{
  "executiveSummary": "Short 2-3 paragraph overview of key topics and agreements.",
  "keyTakeaways": [
    "Key takeaway point 1",
    "Key takeaway point 2"
  ],
  "actionItems": [
    {
      "task": "Task description",
      "assignee": "Assignee Name",
      "dueDate": "Nov 2, 2026",
      "context": "Optional quote or context",
      "completed": false
    }
  ],
  "decisions": [
    {
      "decision": "Agreed decision text",
      "rationale": "Why this decision was made",
      "madeBy": "Decision maker",
      "timestamp": "02:40",
      "timestampSeconds": 160
    }
  ],
  "highlights": [
    {
      "quote": "Important spoken quote",
      "speaker": "Speaker Name",
      "timestamp": "04:10",
      "timestampSeconds": 250,
      "significance": "Why this moment is noteworthy",
      "category": "key_moment"
    }
  ]
}
```

* `category` options: `"key_moment"`, `"decision"`, `"action"`, `"risk"`, `"question"`, `"user_saved"`.

---

### **AI Review Object (`review`)**

```json
{
  "overallScore": 88,
  "summary": "Executive audit summary assessing clarity and execution gaps.",
  "unresolvedQuestions": [
    {
      "id": "q-1",
      "question": "Unanswered question text",
      "context": "Context from dialogue",
      "raisedBy": "Person who asked",
      "severity": "high"
    }
  ],
  "unassignedResponsibilities": [
    {
      "id": "u-1",
      "task": "Task needing an owner",
      "suggestedRole": "Engineering Lead",
      "context": "Spoken in sync"
    }
  ],
  "missingDeadlines": [
    {
      "id": "md-1",
      "task": "Task missing delivery date",
      "assignee": "Assignee Name",
      "urgency": "medium"
    }
  ],
  "missingDependencies": [
    {
      "id": "dep-1",
      "blocker": "Blocker item",
      "impactedArea": "Release milestone",
      "description": "Blocker details"
    }
  ],
  "contradictions": [
    {
      "id": "c-1",
      "topic": "Conflicting topic",
      "statements": [
        "Statement 1 by Speaker A",
        "Conflicting statement by Speaker B"
      ]
    }
  ],
  "potentialRisks": [
    {
      "id": "r-1",
      "risk": "Potential execution risk",
      "severity": "high",
      "mitigation": "Action to mitigate risk"
    }
  ]
}
```

---

## **Pre-built Demo Files**

Check the `demo/` folder for three production-quality templates:
- `demo/meeting-1.json`: **Product Strategy & AI Memory Architecture** (`project` template)
- `demo/meeting-2.json`: **Enterprise Sales Discovery: Acme Global** (`sales` template)
- `demo/meeting-3.json`: **Engineering Sync: Zero-Downtime Database Migration** (`general` template)
