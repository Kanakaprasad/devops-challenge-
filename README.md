# 🚀 Devops-challenge

**Tvara DevOps Interview Challenge**  
Backend: **Node.js (Express)**  
CI/CD: **GitHub Actions** (Auto-Merge Workflow)

---

## 👤 Author

- **Name:** Kanakaprasad (KP)  
- **Repo:** `devops-challenge`  
- **Stack:** Node.js, Express, GitHub Actions  

---

## 📌 Project Overview

This repository implements both tasks from the Tvara DevOps challenge:

### ✅ **Task A — Auto-Merge Workflow (CI)**  
A GitHub Actions workflow that automatically merges the `dev` branch → `main` whenever new commits are pushed to `dev`.

Key features:

- Triggers on: `push` to `dev`  
- Creates a temporary branch from `origin/main`  
- Attempts to merge `origin/dev` → `tmp-merge`  
- If merge succeeds → pushes `tmp-merge:main`  
- If merge fails → workflow stops safely without modifying `main`

This ensures **safe, conflict-free automation**.

---

### ✅ **Task B — Gemini 2.0 Flash API Integration (Backend)**

A minimal backend demonstrating:

- `POST /ask-gemini`  
  - **Sync mode:** Waits for Google Gemini response  
  - **Async mode:** Returns a `jobId` immediately; user can poll for status  
- `GET /ask-gemini/status/:id` — Poll job results  
- `GET /health` — Simple health check

Supports loading state simulation through async mode.  
Uses environment variables → no secret leakage.

---

## 📂 Repo Structure

```bash
devops-challenge/
├─ .github/
│  └─ workflows/
│     └─ auto-merge.yml        # Auto-merge workflow (dev → main)
├─ server/
│  ├─ index.js                 # Express server & /ask-gemini endpoints
│  ├─ package.json
│  └─ .env.example             # Example env file
├─ .gitignore
└─ README.md
