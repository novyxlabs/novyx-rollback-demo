# Novyx Rollback Demo

Interactive demo showing time-travel rollback for AI agent memory, powered by [Novyx](https://novyxlabs.com).

**[Try the live demo →](https://demo.novyxlabs.com)**

## What This Demonstrates

Novyx gives AI agents persistent memory with a unique superpower: **time-travel rollback**. If bad data gets saved, you can rewind memory to any point in time — no data loss, full audit trail.

This interactive demo walks you through the core flow in 5 steps:

### Step 1: Store
Teach the agent some facts. Each one is saved to Novyx via the API.

### Step 2: Search
Run a semantic search query. Novyx returns the most relevant memories with similarity scores.

### Step 3: Corrupt
Simulate bad data getting saved — wrong facts overwrite the correct ones. This is what happens in production when an LLM hallucinates or a user gives bad input.

### Step 4: Rollback
Rewind memory to before the corruption happened. Novyx restores the correct state and logs every operation in a tamper-proof audit trail.

### Step 5: Done
Verify the memories are correct again. The bad data is gone, the good data is restored, and the audit trail shows exactly what happened.

## How It Works

The demo uses the Novyx API directly:

| Endpoint | Purpose |
|---|---|
| `POST /v1/memories` | Store facts |
| `GET /v1/memories/search` | Semantic search |
| `POST /v1/rollback` | Time-travel rollback |
| `GET /v1/audit` | Tamper-proof audit trail |

## Run Locally

```bash
git clone https://github.com/novyxlabs/novyx-rollback-demo.git
cd novyx-rollback-demo
cp .env.example .env
# Add your Novyx API key to .env
npm install
npm start
```

Get a free API key at [novyxlabs.com](https://novyxlabs.com) (5,000 memories, no credit card).

## Links

- [Live Demo](https://demo.novyxlabs.com)
- - [Novyx Docs](https://novyxlabs.com/docs)
  - - [Get a Free API Key](https://novyxlabs.com)
   
    - ## License
   
    - MIT
