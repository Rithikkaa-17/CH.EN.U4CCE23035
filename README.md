# CH.EN.U4CCE23035 — Afford Med Campus Hiring Evaluation

**Name:** Rithikkaa S J  
**Roll No:** CH.EN.U4CCE23035  
**GitHub:** Rithikkaa-17

---

## ⚠️ IMPORTANT — Setup AUTH_TOKEN Before Running

1. Open `stage1/.env`
2. Paste your full `access_token` from Postman (POST `/evaluation-service/auth` response)
3. The `.env` is gitignored — never commit the token

```env
AUTH_TOKEN=eyJhbGci...your-full-token-here
```

---

## Project Structure

```
CH.EN.U4CCE23035/
├── logging_middleware/     ← Shared logging module (used by backend)
├── stage1/                 ← Backend: Express server
├── stage2/frontend/        ← Frontend: React + Material UI
├── Notification_System_Design.md
└── .gitignore
```

---

## Stage 1 — Backend Setup

```bash
# 1. Install logging middleware
cd logging_middleware
npm install

# 2. Setup and run backend
cd ../stage1
npm install
# Add your AUTH_TOKEN to .env file first!
npm start
```

Server runs at `http://localhost:5000`

**Endpoints:**
- `GET /notifications?limit=20&notification_type=Placement`
- `GET /priority-inbox?limit=10`

---

## Stage 2 — Frontend Setup

```bash
cd stage2/frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000`  
> Requires backend (stage1) to be running on port 5000

---

## GitHub Submission Checklist

- [x] Single repository named `CH.EN.U4CCE23035`
- [x] Single branch (`main`)
- [x] Separate folders per stage (`stage1/`, `stage2/`)
- [x] `node_modules` in `.gitignore`
- [x] `.DS_Store` in `.gitignore`
- [x] `Notification_System_Design.md` with Stage 1 heading
- [ ] Push screenshots of priority inbox output to repo
- [ ] Fill Google Form submission link
