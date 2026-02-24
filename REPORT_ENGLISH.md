Title: Adaptive Chinese Learning Platform — Project Report

Author: (Your Name)
Date: February 19, 2026

---

Abstract

This project implements an adaptive Chinese vocabulary learning platform combining a web/mobile frontend (Ionic + React) and a backend API (NestJS) with a PostgreSQL database accessed via Prisma. The system implements a spaced-repetition scheduler derived from SM-2, supports HSK-graded vocabulary, user progress tracking, social/friend features, and gamified elements. This report documents goals, methods (including mathematical models), architecture, implementation details, evaluation plan, results, and conclusions so it can be submitted as a complete project description.

---

1. Project Scope and Structure

1.1 Goal

- Build an information system for efficient Chinese vocabulary acquisition that adaptively schedules reviews using a proven SRS algorithm and provides an engaging UI to maximize retention and user engagement.

1.2 Tasks

- Import HSK word dataset and design database schema.
- Implement SM-2-like SRS scheduling and persist per-user card state.
- Build authentication, user progress tracking, and social features (friends, daily words, streaks).
- Build frontend review UI with animations and interactive elements.
- Evaluate system behavior and compare to baseline fixed-interval scheduling.

1.3 Methods

- Software engineering: NestJS backend, Prisma ORM, PostgreSQL, Ionic + React frontend.
- Algorithm: SM-2-style spaced repetition with parameters stored per `UserWord`.
- Data: HSK-graded vocabulary dataset seeded via `backend/prisma/seed.ts`.

Files & evidence

- Backend entry: `backend/package.json`, source: `backend/src`.
- DB schema: `backend/prisma/schema.prisma` (models: `User`, `Word`, `UserWord`, `UserProgress`, `Friendship`, `DailyWord`).

---

2. Literature Review and Justification

A compact critical review justifying design choices (expand with citations in final thesis):

- SM-2 and spaced repetition research show increased long-term retention compared to massed practice; modern studies confirm benefits across vocabulary learning contexts.
- Adaptive scheduling that adjusts ease factor and intervals yields better personalization than static schedules.
- Gamification and mobile accessibility increase engagement, which correlates with higher practice frequency and thus better outcomes.

(Recommendation: include at least 20 peer-reviewed sources in the final version; a placeholder reference list is provided in Section 11.)

---

3. Mathematical and Algorithmic Details

3.1 SRS (SM-2 derived) algorithm

- Stored per-card fields (in `UserWord`): `easeFactor` (EF), `repetitions` (r), `interval` (I), `nextReviewDate`.
- After a review with quality q (0-5), update rules:

  - if q < 3: set `repetitions` = 0; `interval` = 1 (day); keep EF unchanged or slightly decreased.
  - else:
    - `repetitions` += 1
    - if `repetitions` == 1: `interval` = 1
    - else if `repetitions` == 2: `interval` = 6
    - else: `interval` = round(`interval` * `easeFactor`)
    - update `easeFactor`: EF = max(1.3, EF + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  - `nextReviewDate` = now + `interval` days

- These equations mirror SM-2 behavior with safety clamp EF >= 1.3. Implementation keeps all timestamps in UTC.

3.2 Complexity and indexing

- Query for due cards: index on `UserWord.nextReviewDate`. In `prisma/schema.prisma` the index `@@index([userId, nextReviewDate])` supports efficient retrieval of due cards.

3.3 Evaluation metrics

- Retention rate at 1 week, 1 month.
- Average interval growth per card.
- Reviews per word and time-to-target (words learned per week).
- Engagement metrics: daily active users, streaks (in `UserProgress`).

---

4. System Architecture and Design

4.1 High-level architecture

- Client: Ionic + React app built via Vite in `frontend/` with optional Capacitor packaging for Android.
- Server: NestJS application in `backend/` exposing REST endpoints and JWT/OAuth authentication.
- Database: PostgreSQL accessed via Prisma client; migrations and seed script located in `backend/prisma`.
- Optional cloud deployment: containerized Node.js app plus managed Postgres.

4.2 Components

- Authentication: local accounts plus Google OAuth (`passport-google-oauth20`) and JWT-based sessions.
- SRS Engine: service that computes `nextReviewDate` and updates `UserWord` after each review.
- Progress service: computes streaks, HSK-level progress, and target words per user (`UserProgress`).
- Social features: `Friendship` model supports friend relationships and related endpoints.

4.3 Security & Ops

- Password hashing with `bcrypt`.
- Environment-based configuration using `@nestjs/config`.
- Prisma migrations and seed script: `backend/prisma/seed.ts` and `npm run seed` (in `backend`).

---

5. Implementation Details

5.1 Backend

- Stack: NestJS, TypeScript, Prisma, PostgreSQL.
- Notable dependencies: `@nestjs/jwt`, `passport-jwt`, `bcrypt`, `@prisma/client`.
- Key files:
  - `backend/src/` contains controllers and services for auth, users, srs, words, and friends.
  - `backend/prisma/schema.prisma` defines models and indices.
  - `backend/package.json` scripts: `start:dev`, `seed`, `test:e2e`.

5.2 Frontend

- Stack: Ionic + React, Vite.
- Libraries: `hanzi-writer` for stroke animations, `three`/`pixi.js` for visuals, `axios` for API calls.
- Structure: `frontend/src/pages` (study flow), `frontend/src/components` (review card, progress), `frontend/src/services` (API wrappers).

5.3 Data

- HSK dataset and seed: `backend/prisma/seed.ts` loads words into `Word` table with `hskLevel`.
- `UserWord` stores per-user SRS state and SM-2 fields.

---

6. Evaluation & Results

6.1 What has been implemented

- Full SRS data model and scheduler.
- API endpoints for taking reviews, updating card quality, and fetching due cards.
- Frontend review flow with animations and progress views.
- Social features and progress tracking (streaks, targets by HSK level).

6.2 Suggested evaluation

- Run a small pilot (N=10-30 users) for 2–4 weeks to collect retention and engagement metrics.
- Run simulations by replaying synthetic user responses to estimate long-term interval evolution.

6.3 Example (placeholder) results to fill with actual numbers

- Retention after 1 week: 78% (vs. 55% for fixed-interval baseline)
- Average reviews per word per week: 0.9
- Mean interval growth factor after 30 days: 1.6x

(Replace placeholders with measured values if you run a pilot.)

---

7. Conclusions and Contributions

- The platform ties a proven SRS algorithm with a modern cross-platform UI and a scalable backend.
- Contributions: full pipeline from HSK dataset ingestion → SRS engine → interactive frontend with social and gamified layers; DB schema optimized for due-card queries.
- Limitations & future work: integrate personalized ML-based scheduling, richer analytics, larger user studies, and offline sync for mobile.

---

8. How to Run (developer notes)

Backend (from `c:\Users\nurke\chinese-app\backend`):

```powershell
npm install
npm run seed
npm run start:dev
```

Frontend (from `c:\Users\nurke\chinese-app\frontend`):

```powershell
npm install
npm run dev
```

Build Android with Capacitor (optional): see `frontend/android` and `package.json` scripts.

---

9. Files to attach when submitting to a web model / converting to PDF

- This report (current file): `REPORT_ENGLISH.md`.
- `backend/prisma/schema.prisma` (DB schema snapshot).
- `backend/prisma/seed.ts` (data seed script).
- A short README with build steps (can use `README_FIXED.md` or `FINAL_SETUP.md`).
- Optional: screenshots of UI (`frontend/public` or exported images), and a CSV export of sample usage metrics.

---

10. Suggested Presentation Outline (slides)

- Slide 1: Title, author, date, short abstract.
- Slide 2: Problem statement and goals.
- Slide 3: Literature justification (key references).
- Slide 4: SRS math and example update.
- Slide 5: System architecture diagram.
- Slide 6: DB schema excerpt (show `UserWord` fields).
- Slide 7: Demo screenshots and study flow.
- Slide 8: Results (graphs) and comparison to baseline.
- Slide 9: Contributions, limitations, future work.
- Slide 10: Thanks / questions.

---

11. Reference List (recommended — add DOIs where needed)

1. P. Wozniak, "The SM-2 Algorithm", SuperMemo documentation (classic algorithm source).
2. Cepeda, N. J., et al., "Spacing effects in learning: A temporal ridgeline of optimal retention", Psychological Science, 2008.
3. Dunlosky, J., et al., "Improving Students’ Learning With Effective Learning Techniques: Promising Directions From Cognitive and Educational Psychology", Psychological Science in the Public Interest, 2013.
4. Karpicke, J. D., & Roediger, H. L., "The critical importance of retrieval for learning", Science, 2008.
5. Articles on spaced repetition and language learning (survey recent 2018–2024 papers to reach 20 refs).
6. Studies on gamification in education and mobile learning (include meta-analyses up to 2024).

(Please let me know if you want me to compile a 20-item bibliography with full citations and DOIs — I can draft that next.)

---

Appendix A — Key schema excerpt

See `backend/prisma/schema.prisma` for full details; key `UserWord` fields used for SRS:

```prisma
model UserWord {
  id            String   @id @default(uuid())
  userId        String
  wordId        String
  easeFactor    Float    @default(2.5)
  interval      Int      @default(0)
  repetitions   Int      @default(0)
  nextReviewDate DateTime @default(now())
  // ...
}
```

Appendix B — Notes for converting to PDF

- Recommended: open `REPORT_ENGLISH.md` and convert to PDF using Pandoc or VS Code Markdown PDF extension.
- Pandoc command (from project root):

```powershell
pandoc REPORT_ENGLISH.md -o REPORT_ENGLISH.pdf --from markdown --pdf-engine=xelatex
```

(If you prefer I can produce the PDF for you; tell me if you want that and whether to include screenshots.)

---

Contact / Next steps

- Tell me if you want: (A) a finished PDF I generate here, (B) a slide deck, (C) a full bibliography with DOIs, (D) insertion of measured pilot results (you can upload CSV), or (E) Word/LaTeX formatted thesis.


