# Novyx Rollback Demo
**Skill for OpenClaw**

Travel back in your agent's memory to see what it knew at any point in time.

## What It Does

When you ask:
- "What did I know at 2pm?"
- "What was the plan before we pivoted?"
- "Show me context before that bug happened"

This skill uses Novyx's rollback preview (dry-run) to show past memory state **without changing anything**.

## Setup

```bash
cd skills/memory-time-travel
npm install
```

## Usage

```bash
# See what memories existed at a specific time
node time_travel.js --timestamp "2026-02-09T14:00:00Z"

# See memories from 1 hour ago
node time_travel.js --hours-ago 1

# Compare now vs then
node time_travel.js --compare --timestamp "2026-02-09T10:00:00Z"

# List all memory snapshots
node time_travel.js --list
```

## Integration

```javascript
const MemoryTimeTravel = require('./time_travel');

const traveler = new MemoryTimeTravel({
  apiKey: process.env.NOVYX_API_KEY,
  apiUrl: process.env.NOVYX_API_URL
});

// In your agent:
async function handleTimeQuery(message) {
  const match = message.match(/at\s+(\d{1,2}:\d{2})/);
  if (match) {
    const time = parseTime(match[1]); // "2:30pm" -> ISO
    return await traveler.getMemoryAt(time);
  }
}
```

## Novyx Features Used

| Feature | Tier | Notes |
|---------|------|-------|
| `nx.list_memories()` | FREE | Get memories |
| `nx.rollback(dry_run=True)` | FREE | Preview past state |
| `nx.stats()` | FREE | Compare metrics |

## Requirements

- Novyx API key (free tier works)
- Node.js 16+
- novyx SDK (installed)

## License

MIT
