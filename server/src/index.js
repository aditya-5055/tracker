require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ─── Routers ──────────────────────────────────────────────────────────────────
const healthRouter = require('./routes/health');
const authRouter   = require('./routes/auth');
const tasksRouter  = require('./routes/tasks');

// ─── App Init ─────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Database ─────────────────────────────────────────────────────────────────
connectDB();

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin:      process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,          // required so cookies are sent cross-origin
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());        // parses req.cookies for the protect middleware

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/auth',   authRouter);
app.use('/api/tasks',  tasksRouter);

// ─── 404 fallback for unmatched /api/* routes ─────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Server  →  http://localhost:${PORT}`);
  console.log(`🔑  Auth    →  http://localhost:${PORT}/api/auth`);
  console.log(`📋  Tasks   →  http://localhost:${PORT}/api/tasks`);
  console.log(`💚  Health  →  http://localhost:${PORT}/api/health`);
});
