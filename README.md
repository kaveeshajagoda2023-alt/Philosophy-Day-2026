# 🏛️ Philosophy Day 2026 – Interactive Online Quiz Platform

> **"Think. Question. Discover."**  
> *Annual Symposium & Inter-Collegiate Quiz Challenge hosted by the Philosophy Club.*

---

## 🌟 Overview

A modern, responsive, university-grade interactive online quiz platform designed for the **Philosophy Day 2026** celebration. 

### Key Participant Experience
- **Zero Barrier Access**: Participants **do not** register, provide emails, or create passwords.
- **Instant Entry**: Participants simply click the public link (shared on WhatsApp, Facebook, campus boards), enter their **First Name** and **Surname**, and immediately enter the timed challenge.
- **Dynamic 20-Second Countdown**: Each of the 10 philosophical questions is governed by a 20-second countdown timer that automatically advances.
- **Real-Time Leaderboard**: Public live rankings sorted by highest score (out of 100 points), with shortest total completion time as the tiebreaker.
- **Private Organiser Portal**: Secure dashboard protected by organiser credentials with aggregate statistics, participant response tables, question activation/deactivation, and CSV export.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18, Vite 5, JavaScript | Fast, single-page application (SPA) with mobile-first design |
| **Styling** | Tailwind CSS 3, Lucide Icons | Custom purple/pink/amber gradient identity, glassmorphism |
| **Backend & DB** | Supabase, PostgreSQL | Relational schema with stored procedures (RPCs) and RLS |
| **Security** | Row Level Security (RLS) | Backend score calculation; client **never** receives correct answers |
| **Hosting** | Vercel (Frontend), Supabase (DB) | Global CDN edge routing and high availability |

---

## 🗄️ Database Architecture & Security

The platform utilizes a hardened PostgreSQL schema inside Supabase with stored procedures (`SECURITY DEFINER`) to guarantee that participants cannot tamper with scores or inspect answers in network requests.

### Database Tables:
1. `participants`: Records participant first and last names.
2. `questions`: Holds question text, options (A, B, C, D), private `correct_answer`, time limit, and category.
3. `quiz_sessions`: Manages server-enforced session tokens and expiry limits.
4. `participant_answers`: Individual answer records validated against the database.
5. `quiz_results`: Authoritative score (out of 100), breakdown of correct/incorrect/unanswered questions, and total completion time.
6. `quiz_settings`: Configurable event parameters (attempt policy, time limit, question count).

### Security Highlights:
- **Answers Protected**: The `questions` table has RLS restricting direct table `SELECT` to authenticated admins. Public queries access the `get_active_quiz_questions()` RPC which strictly omits `correct_answer`.
- **Backend Scoring**: Scores are calculated on the PostgreSQL server via the `submit_quiz_answers` RPC. Client submissions with custom scores are rejected.
- **Anti-Tampering**: Session tokens expire automatically, and duplicate submissions for the same session or participant are blocked.

---

## 🚀 Setup & Installation Instructions

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm or pnpm

### 2. Clone and Install Dependencies
```bash
cd philosophy-day-2026
npm install
```

### 3. Configure Supabase (Production)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Paste the contents of `supabase/migrations/20260101000000_create_philosophy_quiz_schema.sql` and click **Run**.
   - This automatically creates all tables, indexes, RLS policies, secure RPC functions, and seeds the 10 initial philosophy questions.
4. Go to **Project Settings** -> **API** and copy:
   - **Project URL**
   - **anon / public key**
5. Create a file named `.env` in the root folder:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
6. **Create Organiser Login**:
   - Go to **Authentication** -> **Users** in the Supabase Dashboard.
   - Click **Add User** -> **Create User**.
   - Enter your organiser email (e.g. `admin@philosophyday.edu`) and a strong password.
   - Organisers can now sign in at the **Organiser Login** portal.

> **Note on Local Simulation Mode:**  
> If no Supabase credentials are configured in `.env`, the application automatically activates **Interactive Simulation Mode**. All quiz timers, scoring algorithms, leaderboard podiums, and the organiser dashboard work locally in the browser for instant evaluation and testing!

---

## 💻 Running Locally

### Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🌐 Deploying to Vercel

### Method 1: Deploy with Vercel CLI
```bash
npm i -g vercel
vercel
```

### Method 2: Deploy via GitHub & Vercel Web Dashboard
1. Push this project to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: Philosophy Day 2026 Quiz Platform"
   git branch -M main
   git remote add origin https://github.com/your-username/philosophy-day-2026.git
   git push -u origin main
   ```
2. In [Vercel](https://vercel.com):
   - Click **Add New Project** and import the `philosophy-day-2026` repository.
   - In **Environment Variables**, add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Click **Deploy**.
3. Your quiz platform will be live at a public URL (e.g. `https://philosophy-day-2026.vercel.app`).

---

## 📚 Sample Philosophy Questions Included

1. **Socrates** – The Apology: *"The unexamined life is not worth living."*
2. **Plato** – The Allegory of the Cave: Shadows as sensory deception vs. intelligible Forms.
3. **Aristotle** – Nicomachean Ethics: The Doctrine of the Mean (Golden Mean).
4. **René Descartes** – Methodological Doubt: *"Cogito, ergo sum."*
5. **Immanuel Kant** – Deontology: The universal law formulation of the Categorical Imperative.
6. **Jean-Paul Sartre** – Existentialism: *"Existence precedes essence."*
7. **Utilitarianism** – Bentham & Mill: Greatest Happiness Principle.
8. **Philosophical Logic** – Fallacies: *Argumentum ad hominem*.
9. **Epistemology** – Tripartite definition of knowledge: *Justified True Belief (JTB)*.
10. **Eastern & Buddhist Philosophy** – Metaphysics: *Pratītyasamutpāda* and *Anatta*.

---

## 🛡️ License

Created for the Philosophy Club • Annual Philosophy Day 2026 Celebration.
Open-source under the MIT License.
