<div align="center">

<img src="frontend/public/logo.png" alt="PRAGATI Logo" width="180"/>

# PRAGATI
### Campus Placement Intelligence System
**Empowering Your Placement Journey**

[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.10-3776ab?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Java](https://img.shields.io/badge/Java-17-ed8b00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-47a248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.1-4479a1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

> **A full-stack campus placement preparation platform** powered by NLP-based AI, adaptive learning algorithms, and real-time analytics — built for engineering colleges.

*Mini Project · Dept. of Computer Science (AI & ML) · KIT's College of Engineering, Kolhapur · *

</div>

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [SkillPath AI Pipeline](#-skillpath-ai-pipeline)
4. [Architecture](#-architecture)
5. [User Roles](#-user-roles)
6. [Quick Start](#-quick-start)
7. [Environment Variables](#️-environment-variables)
8. [AI Provider Setup](#-ai-provider-setup-groq--gemini)
9. [Project Structure](#-project-structure)
10. [ML Models](#-ml-models)
11. [API Reference](#-api-reference)

---

## 🌟 Overview

PRAGATI replaces the fragmented experience of juggling LeetCode, random aptitude apps, WhatsApp note-sharing, and YouTube mock interviews — everything lives in one system, personalised to each student's current skill level.

Its centrepiece is **SkillPath AI**: a 5-stage NLP pipeline that compares a student's resume against a job description, scores ATS readiness section-by-section, classifies skill gaps by importance, and builds a dependency-aware phased learning pathway using a NetworkX graph.

On top of the core AI pipeline, **Interview Prep** (powered by Groq llama-3.1-8b-instant → Gemini fallback) generates personalised technical questions, mock interviews with real-time voice feedback, and topic deep-dives tailored to each student's specific gaps.

---

## ✨ Key Features

### 🎓 For Students

| Feature | Description |
|---------|-------------|
| 🧠 **SkillPath AI** | Resume + JD → ATS score with breakdown · Skill gaps by importance (Critical / Important / Nice-to-have) · Phased learning pathway with curated free course links |
| 🎤 **AI Interview Prep** | Full guide · Interactive mock interview with voice input · Topic deep-dive — all powered by Groq + Gemini |
| 🏢 **Company Readiness** | Live match score per company from JD skill matching + ATS + branch eligibility — every company gets a different score |
| 📈 **ATS History** | Sparkline chart tracking score growth across all analyses |
| 🏆 **Batch Rank** | Anonymous percentile: "Top X% of your dept & year" |
| 🗓️ **Placement Calendar** | Upcoming drives with urgency colour-coding |
| 💻 **Daily Practice** | Adaptive LeetCode problems by skill tier · Shuffle to easier if stuck · Voice-enabled approach notes |
| 🎯 **Aptitude Prep** | Topic-per-session (Quant, Logical, Verbal, Technical, DI) · Timer enforcement · Full history with explanations |
| 📚 **Smart Notes** | Faculty notes (auto-published) + Student notes (needs approval) with Google Drive link support |
| 💬 **Discussions** | Forum + AI Chat powered by Groq/Gemini · Opportunities: Unstop, Devfolio, Internshala |

### 👨‍🏫 For Faculty

| Feature | Description |
|---------|-------------|
| 📊 **Dept Placement Index** | Year-wise readiness breakdown for their department |
| 🏢 **Company Readiness** | Their own match scores with per-company JD breakdown |
| 🧠 **AI Weak Topic Detector** | Skills most students in their batch are missing (correctly capped at 100%) |
| 🚨 **Student Risk Alerts** | Flags students with no resume, low ATS, zero streak |
| ✅ **Note Review** | Approve or reject student-submitted notes directly |
| 📋 **Intelligent Announcements** | Filter students by ATS score, year, or department |

### ⚙️ For Admin (HOD)

| Feature | Description |
|---------|-------------|
| 📈 **Placement Readiness Index** | Dept leaderboard + formula explanation (ATS 40% + Resume 30% + Skill Level 30%) |
| 🏢 **Company Demand Analyzer** | What companies demand vs what students have — shows the gap |
| 👥 **User Management** | **Separated**: Students (with Year + Dept filter, shows Level/ATS) · Faculty (no Level/ATS, shows join date) · Admins |
| ✅ **Note Approval** | Approve or reject student notes |
| 🎯 **Bulk Aptitude Upload** | JSON array batch upload for questions |

---

## 🧠 SkillPath AI Pipeline

```
Resume PDF ──► Text Extraction ──► Skill Extraction (spaCy NLP + TF-IDF)
               (PDFBox/POI)                │
                                           ▼
JD Text/PDF ────────────────► Required Skill Extraction
                                           │
                               Skill Gap Computation
                   gap_score = level_delta × 2.5 × importance_weight
                   importance: critical=1.0 · important=0.75 · nice-to-have=0.45
                                           │
                   Dependency Graph (NetworkX) → Topological Sort
                                           │
                               Phased Learning Pathway
                       (prerequisites before advanced modules)
```

**Outputs:** ATS Score (section breakdown) · Skill Gaps (Critical/Important/Nice-to-have) · Matched Skills · Phased Learning Pathway · Eligibility Score

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                          Docker Compose                            │
│                                                                    │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────────┐     │
│  │  React 18   │──►│  Node.js 18  │──►│  Python FastAPI      │     │
│  │  Frontend   │   │  Express API │   │  ML Service (NLP)    │     │
│  │  :3000      │   │  :5000       │   │  :8000               │     │
│  └─────────────┘   └───────┬──────┘   └──────────────────────┘     │
│                            │                                       │
│                    ┌───────┼───────┐  ┌──────────────────────┐     │
│                    │               │  │  Java Spring Boot    │     │
│               ┌────▼────┐   ┌──────▼─┐│  Resume Parser       │     │
│               │MongoDB 6│   │MySQL 8 ││  PDFBox + POI + JDBC │     │
│               │ :27017  │   │ :3307  ││  :8080               │     │
│               └─────────┘   └────────┘└──────────────────────┘     │
│                                                                    │
│  External: Cloudinary (files) · Groq API · Gemini API              │
└────────────────────────────────────────────────────────────────────┘
```

| Service | Technology | Role |
|---------|-----------|------|
| Frontend | React 18, React Router v6, react-dropzone | Role-specific SPA dashboards |
| Backend | Node.js 18, Express, Mongoose, JWT, Multer | REST API gateway + business logic |
| ML Service | Python 3.10, FastAPI, spaCy 3.7, scikit-learn 1.3, NetworkX | SkillPath AI engine |
| Resume Parser | Java 17, Spring Boot 3.2, PDFBox 3.0, POI 5.2, **MySQL JDBC** | PDF/DOCX extraction + JDBC persistence |
| Database | MongoDB 6.0 + MySQL 8.1 | App data (Mongo) + parser logs (MySQL) |
| AI (Interview) | **Groq** llama-3.1-8b-instant (primary) → **Gemini** 2.0 Flash (fallback) | Interview prep, AI chat |
| Storage | Cloudinary | Resumes and notes |

---

## 🎭 User Roles

### 🎓 Student
1. Sign up → upload resume → AI assigns skill tier (Beginner / Intermediate / Expert)
2. Daily coding problem matched to your level · Shuffle to easier if stuck
3. Run SkillPath AI → ATS score, skill gaps, phased learning pathway
4. Use Interview Prep → voice-enabled mock interview with live Groq/Gemini feedback
5. Browse company prep guides, practice aptitude by topic, discuss doubts with faculty or AI

### 👨‍🏫 Faculty
- Upload notes (file or Google Drive link) — published instantly
- View student records by year · Monitor weak topics · Flag at-risk students
- Approve/reject student notes · Send targeted announcements

### ⚙️ Admin (HOD)
- Full cohort view: Students (separate table, year + dept filter) + Faculty (separate table, no Level/ATS shown)
- Approve notes · Add companies · Bulk upload aptitude questions
- Placement Readiness Index with dept leaderboard and formula explanation

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Docker + Compose)
- [Git](https://git-scm.com/)

### 1. Clone & Configure

```bash
git clone <your-repo-url>
cd PRAGATI
cp .env.example .env
# Open .env and fill in all values
```

### 2. Start All Services

```bash
docker compose up --build
```

First run takes 3–5 minutes. Wait for:
```
✅ MongoDB connected
🚀 PRAGATI Backend running on port 5000
```

### 3. Seed Database (first time)

```bash
# New terminal while containers are running
docker compose exec backend npm run seed
```

### 4. Open the App

**[http://localhost:3000](http://localhost:3000)**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@pragati.edu` | `Admin@123` |
| Faculty | `faculty@pragati.edu` | `Faculty@123` |
| Student | `student@pragati.edu` | `Student@123` |

### 5. Rebuild After Code Changes

```bash
docker compose down
docker compose up --build --force-recreate
```

---

## ⚙️ Environment Variables

```env
# ── MongoDB ────────────────────────────────────────────────────────
MONGO_USER=pragati
MONGO_PASS=your_secure_password

# ── MySQL (JDBC for Java resume-parser) ───────────────────────────
MYSQL_ROOT_PASSWORD=root_secret
MYSQL_USER=pragati_java
MYSQL_PASS=pragati_java_secret

# ── JWT (generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))") ──
JWT_SECRET=<64-char-hex>
JWT_REFRESH_SECRET=<different-64-char-hex>

# ── Cloudinary ─────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# ── AI (at least one key strongly recommended) ─────────────────────
GROQ_API_KEY=gsk_your_groq_key      # Primary — fast and free
GEMINI_API_KEY=AIza_your_gemini_key # Fallback — free 15 req/min
```

---

## 🤖 AI Provider Setup — Groq + Gemini

PRAGATI uses **Groq as primary** and **Gemini as fallback**. Both are free. All features work with mock data if neither key is set — but real AI responses are much better.

### Groq Setup (Recommended — Primary)
1. Go to **[console.groq.com](https://console.groq.com)**
2. Sign up → **API Keys** → **Create API Key**
3. Copy key → paste as `GROQ_API_KEY=gsk_...` in `.env`
4. **Free tier:** 14,400 requests/day · ~300 tokens/sec (very fast)
5. Model used: `llama-3.1-8b-instant`

### Gemini Setup (Fallback)
1. Go to **[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**
2. Sign in → **Create API Key**
3. Copy key → paste as `GEMINI_API_KEY=AIza...` in `.env`
4. **Free tier:** 15 req/min · 1M tokens/day

### Check AI Status
```
GET http://localhost:5000/api/skillpath/ai-status
```
Returns: `{ groq: { configured, working }, gemini: { configured, working }, activeProvider }` — tells you exactly which provider is active.

---

## 🗂️ Project Structure

```
PRAGATI/
│
├── frontend/                          # React 18 SPA
│   ├── public/
│   │   └── logo.png
│   └── src/
│       ├── context/
│       │   └── AuthContext.js         # JWT auth + login error handling
│       ├── pages/
│       │   ├── LoginPage.js           # Login with styled error messages
│       │   ├── DashboardLayout.js     # Sidebar + role-based nav
│       │   ├── NotesPage.js           # Notes with filter dropdowns
│       │   ├── InterviewPrepPage.js   # 3-mode interview prep + voice input
│       │   └── ...                    # Companies, Aptitude, Practice, etc.
│       └── components/
│           └── skillpath/
│               ├── SkillPathModule.js # Upload + Results (3 tabs)
│               ├── SkillGapPanel.js   # Gap visualisation
│               ├── PathwayView.js     # Phased learning pathway
│               ├── AtsGauge.js        # ATS score gauge chart
│               ├── EligibilityBadge.js
│               └── UploadSection.js
│
├── backend/                           # Node.js + Express
│   └── src/
│       ├── routes/
│       │   ├── auth.routes.js         # Login, register, refresh token
│       │   ├── skillpath.routes.js    # SkillPath AI + Gemini Interview Prep
│       │   ├── note.routes.js         # Notes CRUD + filter metadata
│       │   ├── company.routes.js      # Company profiles + prep guides
│       │   ├── aptitude.routes.js     # Quiz questions + submission
│       │   ├── discussion.routes.js   # Threaded discussions
│       │   ├── practice.routes.js     # Daily coding problems
│       │   └── admin.routes.js        # Admin cohort management
│       ├── models/
│       │   ├── User.model.js
│       │   ├── Note.model.js
│       │   ├── Company.model.js
│       │   ├── AptitudeQuestion.model.js
│       │   ├── Discussion.model.js
│       │   └── index.js               # SkillpathResult schema
│       ├── middleware/
│       │   └── auth.middleware.js     # JWT verify + role guard
│       └── utils/
│           └── seeder.js             # Demo data seeder
│
├── ml-service/                        # Python FastAPI — AI engine
│   └── app/
│       ├── main.py                   # FastAPI app + /analyze endpoint
│       └── services/
│           ├── skill_extractor.py    # spaCy NLP + TF-IDF skill extraction
│           ├── ats_scorer.py         # Section-wise ATS scoring
│           ├── gap_analyzer.py       # Gap scoring with importance weights
│           └── pathway_engine.py     # NetworkX dependency graph + phasing
│
├── resume-parser/                     # Java 17 Spring Boot
│   └── src/main/java/
│       └── com/pragati/parser/
│           ├── PdfExtractor.java     # Apache PDFBox text extraction
│           └── DocxExtractor.java    # Apache POI DOCX extraction
│
├── datasets/
│   ├── train_all_models.py           # Retrain all 5 ML models
│   ├── placement_data.csv
│   └── *.pkl                         # Trained model files
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🤖 ML Models

| Model | Algorithm | Purpose |
|-------|-----------|---------|
| `placement_model.pkl` | Logistic Regression (AUC 0.885) | Placement probability |
| `role_classifier.pkl` | LinearSVC + TF-IDF | Job role from resume |
| `gap_score_model.pkl` | Gradient Boosting | Skill gap scoring |
| `eligibility_model.pkl` | Gradient Boosting | Company eligibility |
| `aptitude_difficulty_model.pkl` | LinearSVC | Auto-classify question difficulty |

> **All models trained with:** `numpy==1.26.4 scikit-learn==1.3.2 joblib==1.3.2`

**Retrain:**
```bash
cd datasets
pip install pandas numpy==1.26.4 scikit-learn==1.3.2 joblib openpyxl
python3 train_all_models.py
```

---

## 📡 API Reference

All endpoints require: `Authorization: Bearer <access_token>` (except `/api/auth/*`)

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register (accepts optional resume file) |
| `POST` | `/api/auth/login` | Login → `accessToken` + `refreshToken` |
| `POST` | `/api/auth/refresh` | Exchange refresh token |
| `GET`  | `/api/auth/me` | Current user profile |

### SkillPath AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/skillpath/analyze` | Resume + JD → full AI analysis |
| `GET`  | `/api/skillpath/latest` | Most recent result |
| `GET`  | `/api/skillpath/history` | Last 20 results |
| `POST` | `/api/skillpath/interview-prep` | Generate interview guide (Groq→Gemini) |
| `POST` | `/api/skillpath/interview-feedback` | Live feedback on mock answer |
| `POST` | `/api/skillpath/ai-chat` | General AI placement assistant |
| `POST` | `/api/skillpath/deep-dive` | Topic-specific coaching |
| `GET`  | `/api/skillpath/ai-status` | Check which AI provider is active |

### Analytics
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET`  | `/api/analytics/dashboard` | Student | Personal stats |
| `GET`  | `/api/analytics/batch-percentile` | Any | Safe batch rank (no 403) |
| `GET`  | `/api/analytics/company-readiness` | Any | Per-company match scores |
| `GET`  | `/api/analytics/faculty` | Faculty | Faculty dashboard stats |
| `GET`  | `/api/analytics/weak-topics` | Faculty/Admin | Batch skill gaps (capped 100%) |
| `GET`  | `/api/analytics/at-risk` | Faculty/Admin | At-risk student flags |
| `GET`  | `/api/analytics/dept-placement-index` | Faculty/Admin | Dept readiness index |
| `GET`  | `/api/analytics/cohort` | Admin/Faculty | Full cohort |
| `GET`  | `/api/analytics/placement-index` | Admin | System-wide readiness |
| `GET`  | `/api/analytics/company-demand` | Admin | Demand vs supply gap |

---

## 🔒 Security

- JWT access tokens: 15 min · Refresh tokens: 7 days
- bcrypt password hashing: 12 salt rounds
- **Rate limit:** 500 req/15min general · 30 req/15min for login (prevents brute-force)
- **Fixed:** Axios interceptor no longer retries on 403 — only retries on 401 (was causing login lockout)
- Role-based access control on every API route
- All files via Cloudinary — no server local storage
- `.env` gitignored



---

<div align="center">
  <br/>
  <strong>Built with ❤️ for engineering placement success</strong><br/>
  <em>KIT's College of Engineering, Kolhapur · Dept. CSE (AI & ML) · 2026–27</em>
</div>
