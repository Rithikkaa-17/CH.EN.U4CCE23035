# Stage 1 — Notification System Design

## Approach

### Priority Inbox Algorithm

The priority inbox fetches all notifications from the evaluation server and ranks them using a two-level sort:

1. **Type Weight (descending):** Placement → 3, Result → 2, Event → 1
2. **Recency (descending):** Among notifications of equal weight, the newest (by Timestamp) appears first.

The top N items from the sorted list are returned.

```
score = WEIGHT[type]
sort by: (score DESC, timestamp DESC)
return first N
```

### Handling New Notifications Efficiently

Since new notifications keep coming in (no database), the system re-fetches from the evaluation API on each request. This ensures the priority inbox is always computed on the freshest data without any stale cache issues.

**Trade-off:** Each `/priority-inbox` call makes one upstream request. This is acceptable given the evaluation context. In production, a short TTL cache (e.g., 10 seconds with Redis) or a webhook/polling approach would reduce upstream load.

### Logging

Every significant event (route hit, upstream fetch, errors) is logged via the `logging_middleware` module to the evaluation server with structured fields: `stack`, `level`, `package`, `message`.

---

## File Structure

```
CH.EN.U4CCE23035/
├── logging_middleware/
│   ├── index.js          ← shared Log() function
│   └── package.json
├── stage1/
│   ├── index.js          ← Express server (GET /notifications, GET /priority-inbox, POST /log)
│   ├── package.json
│   └── .env              ← AUTH_TOKEN
├── stage2/
│   └── frontend/         ← React app (MUI, all notifications + priority inbox UI)
│       ├── src/App.js
│       ├── src/index.js
│       ├── public/index.html
│       └── package.json
├── .gitignore
└── Notification_System_Design.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Proxy to evaluation server; supports `limit`, `page`, `notification_type` |
| GET | `/priority-inbox?limit=N` | Returns top N notifications by weight + recency |
| POST | `/log` | Frontend log proxy forwarded to evaluation server |
| GET | `/health` | Health check |

---

## Stage 2 — Frontend Design

- **Framework:** React 18 with Material UI v5
- **Pages:** All Notifications (with type filter) + Priority Inbox (top N selector)
- **Read tracking:** Stored in `localStorage` — unread notifications are visually highlighted
- **Responsive:** Works on desktop and mobile
- **Logging:** Every user action and API call is logged via the backend `/log` proxy
