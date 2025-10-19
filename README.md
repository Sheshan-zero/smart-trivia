Smart-Trivia

A full-stack quiz platform where students can take quizzes, track results, and admins can create modules, quizzes, questions, and manage users.

✨ Features

Public landing page with marketing content

Auth flows: password login, OTP login, refresh token

Student area: dashboard, available quizzes, quiz player with timer, results

Admin area: dashboard, manage modules/quizzes/questions, manage users

Admin protections: JWT + role checks on /admin/* routes

Seeding: one-shot script creates modules/quizzes/questions

🧱 Tech Stack

Frontend: React + Vite, React Router

Styling: CSS modules in src/styles

Backend: Node.js, Express, Mongoose

DB: MongoDB (Atlas or local)

Auth: JWT (access + refresh cookie)

⚙️ Environment Variables

Create server/.env:

# Server
PORT=5000
CLIENT_URL=http://localhost:5173

# Mongo
MONGO_URI=<your-mongodb-connection-string>

# JWT
JWT_ACCESS_SECRET=replace-with-strong-secret
JWT_REFRESH_SECRET=replace-with-strong-secret

# Mail (if using real SMTP; otherwise the OTP route will no-op gracefully)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass


Create client/.env (Vite uses VITE_ prefix):

VITE_API_BASE=http://localhost:5000

🚀 Running Locally
1) Install deps
# backend
cd server
npm install

# frontend
cd ../client
npm install

2) Start backend
cd server
npm run dev     # or: node index.js


Server prints: API running at http://localhost:5000

3) Start frontend
cd client
npm run dev


Vite prints a URL (default http://localhost:5173).

Open that URL in your browser.

🧪 Seed Sample Data

We included a script to quickly populate 4 modules, 5 quizzes per module, and 7 questions per quiz.

cd server
npm run seed


Re-running the seed is safe—it won’t duplicate modules/quizzes and will top quizzes up to 7 questions.

🔐 Admin Access (important)

Admin routes require a JWT with an admin role. Ensure your user has role: "admin" or isAdmin: true (depending on your User schema).

Quick dev helper (two options):

Make yourself admin via DB (Atlas):
Find your user document and set role: "admin" (or isAdmin: true) and save.

(Optional Dev Route) If you created a /dev/make-admin helper earlier, call it from browser console:

fetch("http://localhost:5000/dev/make-admin", {
  method: "POST",
  headers: { Authorization: "Bearer " + localStorage.getItem("accessToken") }
}).then(r=>r.json()).then(console.log);


If you still see 403 Admin only, your access token might have the old role embedded. Refresh it:

// 1) Call refresh to get a new access token
fetch("http://localhost:5000/auth/refresh", { method: "POST", credentials: "include" })
  .then(r => r.json())
  .then(({ accessToken }) => localStorage.setItem("accessToken", accessToken));


Then reload the app.

🧭 Frontend Routes (high level)

/ → Landing page

/user/login → Login page (email/password or OTP)

/dashboard → Student dashboard (protected)

/available → Student available quizzes (protected)

/results → Student results (protected)

/play/:quizId → Quiz Player (protected)

/result/:attemptId → Result page (protected)

/admin/* → Admin area (protected + admin)

🔌 API Highlights

POST /auth/login-password → { accessToken } (+ refresh cookie)

POST /auth/refresh → { accessToken }

GET /auth/me (authRequired)

GET /admin/modules / POST /admin/modules / PATCH /admin/modules/:id

GET /admin/quizzes/:moduleId / POST /admin/quizzes / PATCH /admin/quiz/:id

GET /admin/questions/:quizId / POST /admin/questions / PATCH /admin/question/:id

GET /admin/users / PATCH /admin/users/:id / DELETE /admin/users/:id / POST /admin/users/invite

All /admin/* routes require Authorization: Bearer <accessToken> and admin role.

🧹 NPM Scripts

Server (server/package.json):

{
  "scripts": {
    "dev": "nodemon index.js",
    "start": "node index.js",
    "seed": "node scripts/seed.js"
  }
}


Client (client/package.json):

{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 5173"
  }
}

🩺 Troubleshooting

403 Admin only
Ensure your user is admin in DB, then refresh the access token via /auth/refresh, or sign out/in.

401 Invalid/expired token
Your access token expired. Call /auth/refresh (with refresh cookie attached) or log in again.

CORS errors
Verify CLIENT_URL in server/.env matches the Vite URL (usually http://localhost:5173).

Modules/Quizzes/Questions not visible
Confirm you’re logged in and admin, and that the seed ran successfully (check Mongo collections).

☁️ Deployment Checklist

Set strong JWT_ACCESS_SECRET and JWT_REFRESH_SECRET

Set production CLIENT_URL and enable HTTPS

Configure a production MongoDB URI

Set secure cookies in production (NODE_ENV=production)

Build client (npm run build) and serve from CDN or static host

Point client to backend via VITE_API_BASE
