# ConsistencyOS — Placement Prep Tracker

A full-stack consistency tracker designed for placement preparation. Track daily tasks across DSA, OS, DBMS, System Design, and more — with heatmaps, streak tracking, analytics charts, and motivational tools to keep you on track.

---

## Tech Stack

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| Frontend   | React 18 + Vite, Tailwind CSS 3, Framer Motion, Recharts, Axios  |
| Backend    | Node.js, Express.js, Mongoose (MongoDB)                           |
| Auth       | JWT (httpOnly cookies), bcryptjs                                  |
| Icons      | react-icons (Remix Icon set)                                      |
| Toasts     | react-hot-toast                                                   |

---

## Features

- **Day View** — Vertical timeline with drag-to-add tasks, status tracking, and category color coding.
- **Week View** — 7-column grid with completion rings, streak indicators, and quick-edit popovers.
- **Month View** — GitHub-style contribution calendar with real completion data.
- **Year View** — 365-day heatmap with hover tooltips and click-to-navigate.
- **Dashboard** — Greeting with streak counters, today's progress ring, 8-week trend line chart, and category mastery bar chart.
- **Analytics** — Category distribution pie chart, completion trends, and streak stats.
- **Motivation** — Rotating quote banner, "Remember Your Why" goal statement, "Comparison Reset" reframe card.
- **Settings** — Edit personal goal, set default day-view time range.
- **Responsive** — Full mobile support with a bottom navigation bar.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd tracker
```

### 2. Configure environment variables

Create a `.env` file in the `server/` directory:

```env
# server/.env
MONGO_URI=mongodb://localhost:27017/consistency-tracker
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

> **Important:** Change `JWT_SECRET` to a strong random string in production.

### 3. Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 4. Run the app

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

The Vite dev server automatically proxies `/api` requests to the Express backend on port 5000.

---

## Project Structure

```
tracker/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── api/             # Axios API helpers
│   │   ├── components/      # Reusable UI components
│   │   │   ├── day/         # Day View components
│   │   │   ├── layout/      # AppLayout, Sidebar, Navbar, BottomNav
│   │   │   └── week/        # Week View components
│   │   ├── constants/       # Shared constants (categories, timeline)
│   │   ├── context/         # AuthContext (React context)
│   │   └── pages/           # Route-level page components
│   └── tailwind.config.js
├── server/                  # Express backend
│   ├── src/
│   │   ├── config/          # Database connection
│   │   ├── middleware/       # Auth middleware (JWT)
│   │   ├── models/          # Mongoose models (User, Task)
│   │   └── routes/          # API route handlers
│   └── server.js
└── README.md
```

---

## API Endpoints

| Method | Endpoint              | Description                                |
| ------ | --------------------- | ------------------------------------------ |
| POST   | `/api/auth/signup`    | Register a new user                        |
| POST   | `/api/auth/login`     | Login and receive httpOnly JWT cookie       |
| POST   | `/api/auth/logout`    | Clear the auth cookie                      |
| GET    | `/api/auth/me`        | Get current user profile                   |
| PATCH  | `/api/auth/me`        | Update profile (personalGoal)              |
| POST   | `/api/tasks`          | Create a task                              |
| GET    | `/api/tasks`          | Get tasks (by date, month, year, or range) |
| GET    | `/api/tasks/dashboard`| Aggregated dashboard stats                 |
| PATCH  | `/api/tasks/:id`      | Update a task                              |
| DELETE | `/api/tasks/:id`      | Delete a task                              |

---

## License

MIT
