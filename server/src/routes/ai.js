const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const { decrypt } = require('../utils/encryption');

// SDKs
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

router.use(protect);

// Rate limiter: Max 30 requests per hour per user
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { success: false, message: 'Rate limit reached. Try again in an hour.' },
  keyGenerator: (req) => req.user._id.toString()
});

// Helper to get decrypted key with environment variables fallback
const getKey = (user, model) => {
  if (model === 'claude') {
    return (user.aiConfig && user.aiConfig.anthropicKey) 
      ? decrypt(user.aiConfig.anthropicKey) 
      : (process.env.ANTHROPIC_API_KEY || null);
  }
  if (model === 'chatgpt') {
    return (user.aiConfig && user.aiConfig.openAiKey) 
      ? decrypt(user.aiConfig.openAiKey) 
      : (process.env.OPENAI_API_KEY || null);
  }
  if (model === 'gemini') {
    return (user.aiConfig && user.aiConfig.geminiKey) 
      ? decrypt(user.aiConfig.geminiKey) 
      : (process.env.GEMINI_API_KEY || null);
  }
  return null;
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/ai/test
// ────────────────────────────────────────────────────────────────────────────
router.get('/test', async (req, res) => {
  try {
    const key = getKey(req.user, 'gemini');
    if (!key) {
      return res.status(400).json({ success: false, message: 'Gemini API key not configured.' });
    }

    const genAI = new GoogleGenerativeAI(key);
    const m = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    await m.generateContent('Say hello');

    res.status(200).json({ success: true, message: 'Connected successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid API key or service unavailable.' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/ai/ask & /api/ai/conversation
// ────────────────────────────────────────────────────────────────────────────
router.post(['/ask', '/conversation'], aiLimiter, async (req, res) => {
  try {
    const { question, noteContext, sectionContext, noteTitle, noteCategory, history, useNoteContext = true } = req.body;
    
    const key = getKey(req.user, 'gemini');
    if (!key) {
      return res.status(400).json({ success: false, message: 'Gemini API key not configured.' });
    }

    let systemPrompt = '';
    
    if (useNoteContext) {
      systemPrompt = `You are a smart study assistant helping a computer science student prepare for campus placements. The student is currently studying ${noteCategory || 'a subject'} and is reading a note titled '${noteTitle || 'Untitled'}'.
   
Their current section content is:
---
${sectionContext || 'No section content'}
---
   
Their full note content for extra context is:
---
${noteContext || 'No note content'}
---
   
Answer the student's question clearly and concisely.
- If the question is about the note content, answer using the note as reference.
- If the question is general (not in the note), answer from your knowledge.
- Format your answer in clean Markdown: use **bold** for key terms, use bullet points for lists, use numbered steps for processes, use code blocks (\`\`\`language) for code.
- Keep answers focused and exam-relevant. Do not add unnecessary fluff.`;
    } else {
      systemPrompt = `You are a smart study assistant helping a computer science student prepare for campus placements (DSA, OS, DBMS, SQL, CNS, System Design).
Answer the student's question clearly, accurately, and in exam-relevant style. Format your answer in clean Markdown: use **bold** for key terms, bullet points for lists, numbered steps for processes, and code blocks for code. Keep answers concise and to the point.`;
    }

    const genAI = new GoogleGenerativeAI(key);
    const m = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: systemPrompt });
    
    // Gemini expects history in { role: 'user' | 'model', parts: [{ text }] }
    let formattedHistory = [];
    if (history && history.length > 0) {
      formattedHistory = history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      }));
    }

    const chat = m.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(question);
    const answer = result.response.text();

    res.status(200).json({
      success: true,
      answer,
      model: 'gemini'
    });
  } catch (err) {
    console.error('AI Proxy Error:', err);
    res.status(502).json({ success: false, message: 'AI service unavailable: ' + (err.message || 'Unknown error') });
  }
});

module.exports = router;
