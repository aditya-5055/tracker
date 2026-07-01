const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

// ─── Cookie config ────────────────────────────────────────────────────────────
const COOKIE_NAME    = 'cos_token';          // ConsistencyOS token
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── Helper: set cookie + respond ────────────────────────────────────────────
const sendCookieResponse = (res, statusCode, user) => {
  const token = signToken(user._id);

  res
    .cookie(COOKIE_NAME, token, COOKIE_OPTIONS)
    .status(statusCode)
    .json({
      success: true,
      user: {
        _id:          user._id,
        name:         user.name,
        email:        user.email,
        personalGoal: user.personalGoal,
        createdAt:    user.createdAt,
        aiConfig: {
          defaultModel: user.aiConfig?.defaultModel || process.env.DEFAULT_AI_MODEL || 'claude',
          hasAnthropic: !!user.aiConfig?.anthropicKey || !!process.env.ANTHROPIC_API_KEY,
          hasOpenAi: !!user.aiConfig?.openAiKey || !!process.env.OPENAI_API_KEY,
          hasGemini: !!user.aiConfig?.geminiKey || !!process.env.GEMINI_API_KEY,
        }
      },
    });
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/auth/signup   (also aliased as /register for backwards compat)
// ────────────────────────────────────────────────────────────────────────────
const registerHandler = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // ── Field validation ──────────────────────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // ── Duplicate check ───────────────────────────────────────────────────
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({ name, email, password });
    sendCookieResponse(res, 201, user);
  } catch (err) {
    next(err);
  }
};

router.post('/signup',   registerHandler);
router.post('/register', registerHandler);   // backwards compat

// ────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Explicitly select password (schema has select: false)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    sendCookieResponse(res, 200, user);
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ────────────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res
    .cookie(COOKIE_NAME, '', { ...COOKIE_OPTIONS, maxAge: 0 })
    .status(200)
    .json({ success: true, message: 'Logged out successfully.' });
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected — validates the cookie)
// ────────────────────────────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      _id:          req.user._id,
      name:         req.user.name,
      email:        req.user.email,
      personalGoal: req.user.personalGoal,
      createdAt:    req.user.createdAt,
      aiConfig: {
        defaultModel: req.user.aiConfig?.defaultModel || process.env.DEFAULT_AI_MODEL || 'claude',
        hasAnthropic: !!req.user.aiConfig?.anthropicKey || !!process.env.ANTHROPIC_API_KEY,
        hasOpenAi: !!req.user.aiConfig?.openAiKey || !!process.env.OPENAI_API_KEY,
        hasGemini: !!req.user.aiConfig?.geminiKey || !!process.env.GEMINI_API_KEY,
      }
    },
  });
});

// ────────────────────────────────────────────────────────────────────────────
// PATCH /api/auth/me (update personalGoal, etc.)
// ────────────────────────────────────────────────────────────────────────────
router.patch('/me', protect, async (req, res, next) => {
  try {
    const { personalGoal } = req.body;
    
    // Only updating personalGoal for now
    if (personalGoal !== undefined) {
      req.user.personalGoal = personalGoal;
    }
    
    await req.user.save();
    
    res.status(200).json({
      success: true,
      user: {
        _id:          req.user._id,
        name:         req.user.name,
        email:        req.user.email,
        personalGoal: req.user.personalGoal,
        createdAt:    req.user.createdAt,
        aiConfig: {
          defaultModel: req.user.aiConfig?.defaultModel || process.env.DEFAULT_AI_MODEL || 'claude',
          hasAnthropic: !!req.user.aiConfig?.anthropicKey || !!process.env.ANTHROPIC_API_KEY,
          hasOpenAi: !!req.user.aiConfig?.openAiKey || !!process.env.OPENAI_API_KEY,
          hasGemini: !!req.user.aiConfig?.geminiKey || !!process.env.GEMINI_API_KEY,
        }
      },
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/ai-config (update API keys securely)
// ────────────────────────────────────────────────────────────────────────────
const { encrypt } = require('../utils/encryption');

router.put('/ai-config', protect, async (req, res, next) => {
  try {
    const { defaultModel, anthropicKey, openAiKey, geminiKey } = req.body;
    
    if (!req.user.aiConfig) {
      req.user.aiConfig = {};
    }

    if (defaultModel) req.user.aiConfig.defaultModel = defaultModel;
    
    // Encrypt before saving, but only if they actually sent a new key
    if (anthropicKey !== undefined && anthropicKey !== 'unchanged') {
      req.user.aiConfig.anthropicKey = encrypt(anthropicKey);
    }
    if (openAiKey !== undefined && openAiKey !== 'unchanged') {
      req.user.aiConfig.openAiKey = encrypt(openAiKey);
    }
    if (geminiKey !== undefined && geminiKey !== 'unchanged') {
      req.user.aiConfig.geminiKey = encrypt(geminiKey);
    }

    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'AI Configuration updated securely',
      aiConfig: {
        defaultModel: req.user.aiConfig.defaultModel || process.env.DEFAULT_AI_MODEL || 'claude',
        hasAnthropic: !!req.user.aiConfig.anthropicKey || !!process.env.ANTHROPIC_API_KEY,
        hasOpenAi: !!req.user.aiConfig.openAiKey || !!process.env.OPENAI_API_KEY,
        hasGemini: !!req.user.aiConfig.geminiKey || !!process.env.GEMINI_API_KEY,
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
