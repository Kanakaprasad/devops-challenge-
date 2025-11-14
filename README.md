# Devops-challenge

**Tvara DevOps Interview Challenge** — Node.js backend + GitHub Actions auto-merge workflow.

- **Repo name:** `devops-challenge`  
- **Author:** Kanakaprasad (KP)  
- **Stack:** Node.js (Express), GitHub Actions CI

---

## Project overview

This repository demonstrates:

- **Task A — Auto-merge workflow (CI):** a GitHub Actions workflow that automatically attempts to merge `dev` → `main` whenever commits are pushed to `dev`. The action creates a temporary branch from `origin/main`, merges `origin/dev` into it, and pushes the merged branch back to `main` if no conflicts exist. If conflicts occur, the job fails and manual resolution is required (safe-by-default).
- **Task B — Gemini 2.0 Flash integration (API):** a minimal Express backend that forwards prompts to the Google Gemini `gemini-2.0-flash:generateContent` endpoint and returns the generated content. Supports synchronous (waits for response) and asynchronous (job id + polling) modes.

This repo is intentionally minimal and production-aware (no secrets committed, `.env.example` provided).

---

## Repo structure

