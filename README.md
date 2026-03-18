# WorkflowOS ⚙️

A workflow automation system I built to understand how platforms like Zapier and n8n work under the hood. Instead of using a workflow library, I built the execution engine, rule evaluator, and step orchestrator from scratch.

---

## What it does

You define a workflow as a series of steps. Each step can be a task, an approval gate, or a notification. You attach rules to steps — conditions that evaluate against real data at runtime and decide whether a step runs, gets skipped, or stops the whole execution.

Every run is tracked in full. You can watch steps complete in real time, see exactly how long each one took, inspect the output, retry failures, and cancel mid-flight.

---

## Why I built it this way

Most tutorials show you how to use Bull queues and Redis for job processing. I wanted to understand what problem they actually solve first — so I built the queue layer as a simple in-memory async runner using `setImmediate`. It works the same way conceptually, just without the Redis dependency for now.

Same with the rule engine. I could have used a library, but writing the condition evaluator myself meant I had to think through operator handling, dot-notation path resolution, AND/OR logic, and priority ordering — things that are invisible when a library handles them.

---

## Tech Stack

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- Winston for structured logging

**Frontend**
- React 18
- React Router v6
- Axios with interceptors
- date-fns

---

## Features

- **Workflow builder** — create workflows with any number of steps, set retry policies per step, pick step type and handler
- **Rule engine** — write conditions using dot-notation paths (`order.amount`, `customer.tier`), combine them with AND/OR, attach multiple rules per step with their own inter-rule logic
- **Rule actions** — `skip_step`, `deny`, `allow`, `notify` — each changes execution behavior differently
- **Execution engine** — runs steps sequentially, evaluates rules before each step, handles retries with exponential backoff, writes step logs to MongoDB in real time
- **Live monitoring** — execution detail page auto-polls while a run is active, shows a progress bar, expandable step cards with output and error detail
- **Cancel and retry** — cancel any running execution mid-flight, retry any failed execution which creates a new linked run

---

## How the rule engine works

When you trigger a workflow, you pass a JSON context object. The rule engine resolves field paths from that object and evaluates conditions:
```
Context passed at trigger time:
{
  "order": { "amount": 250, "country": "India" }
}

Step: "Process Payment"
  Rule 1: order.amount  gte  500   →  skip_step
  Rule 2: order.country  eq  India  →  allow
  Inter-rule logic: AND

Both rules must match for the action to fire.
Rule 1 fails (250 is not gte 500) → AND fails → step runs normally.
```

Change the amount to 600 and rerun — both rules match, step gets skipped.

This is what makes it actually useful to test. You pass different context data and watch the execution path change.

---

## Project structure
```
workflowos/
├── backend/
│   ├── engine/
│   │   ├── ExecutionEngine.js   # runs steps, handles retry, checks rules
│   │   └── RuleEngine.js        # evaluates conditions against context
│   ├── models/
│   │   ├── Workflow.js          # workflow + embedded steps
│   │   ├── ExecutionLog.js      # execution + step-level logs
│   │   └── Rule.js              # rule + conditions
│   ├── queues/
│   │   └── execution.queue.js   # async runner, no Redis needed
│   ├── routes/                  # workflow, execution, rule endpoints
│   ├── services/                # business logic layer
│   ├── middleware/              # error handler
│   ├── utils/                   # logger, api response helpers
│   ├── app.js
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Layout.jsx       # sidebar + nav
        │   └── UI.jsx           # shared components — Button, Card, Modal, Table
        └── pages/
            ├── Dashboard.jsx    # stats + recent runs
            ├── Workflows.jsx    # create and manage workflows
            ├── Executions.jsx   # all runs with filters
            ├── Logs.jsx         # step-by-step execution detail
            ├── AllLogs.jsx      # full history
            └── Rules.jsx        # rule builder
```

---

## Getting started

You need Node.js 18+ and MongoDB running locally.

**Start MongoDB**
```bash
# Windows (run PowerShell as Administrator)
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Start the backend**
```bash
cd backend
npm install
npm run dev
```

**Start the frontend**
```bash
cd frontend
npm install
npm start
```

Opens at **http://localhost:3000** — no login, straight to the dashboard.

---

## API

### Workflows
```
GET     /api/workflows
POST    /api/workflows
PUT     /api/workflows/:id
DELETE  /api/workflows/:id
POST    /api/workflows/:id/publish
POST    /api/workflows/:id/execute
GET     /api/workflows/:id/executions
```

### Executions
```
GET     /api/executions
GET     /api/executions/:id
POST    /api/executions/:id/cancel
POST    /api/executions/:id/retry
GET     /api/executions/:id/steps
```

### Rules
```
GET     /api/rules
POST    /api/rules
PUT     /api/rules/:id
DELETE  /api/rules/:id
```

### Trigger a workflow with context
```bash
curl -X POST http://localhost:5000/api/workflows/<id>/execute \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "order": { "amount": 1500, "country": "India" },
      "customer": { "tier": "premium" }
    }
  }'
```

## What I learned

Building the execution engine was the most interesting part. The tricky bit was making cancellation work mid-execution — you can't just stop an async loop, so I added a status re-fetch between every step to check if it was cancelled externally before continuing.

The rule engine taught me how much complexity hides inside a "simple" condition evaluator. Edge cases like null field paths, type coercion in comparisons, and combining AND/OR across multiple rules took a few rewrites to get right.

---

## License

MIT