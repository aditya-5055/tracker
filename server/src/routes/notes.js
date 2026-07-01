const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const multer = require('multer');
const path = require('path');
const puppeteer = require('puppeteer');
const { protect } = require('../middleware/auth');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// All note routes require authentication
router.use(protect);

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/notes — Create a blank note
// ══════════════════════════════════════════════════════════════════════════════
router.post('/', async (req, res, next) => {
  try {
    const note = await Note.create({
      userId: req.user._id,
      title: 'Untitled Note',
    });
    res.status(201).json({ success: true, note });
  } catch (err) {
    next(err);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/notes/upload-image — Upload an image for the editor
// ══════════════════════════════════════════════════════════════════════════════
router.post('/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }
  
  // Construct URL for the uploaded file
  const protocol = req.protocol;
  const host = req.get('host');
  const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  
  res.status(200).json({ success: true, url: imageUrl });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/notes — Get all notes with filtering and searching
// ══════════════════════════════════════════════════════════════════════════════
router.get('/', async (req, res, next) => {
  try {
    const { category, tag, tags, search, pinned, sort, limit } = req.query;
    const query = { userId: req.user._id };

    if (category) query.category = category;
    
    // Support single tag (legacy) or multiple tags (union)
    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    } else if (tag) {
      query.tags = tag;
    }
    
    if (pinned === 'true') query.isPinned = true;

    if (search) {
      // Use MongoDB text search for better performance
      query.$text = { $search: search };
    }

    // Determine sort logic
    let sortObj = { lastEditedAt: -1 }; // default
    if (sort === 'oldest') sortObj = { lastEditedAt: 1 };
    else if (sort === 'az') sortObj = { title: 1 };
    else if (sort === 'za') sortObj = { title: -1 };
    else if (sort === 'words') sortObj = { wordCount: -1 };

    // If text searching, sort by textScore if no explicit sort was requested
    if (search && (!sort || sort === 'newest')) {
      sortObj = { score: { $meta: "textScore" } };
    }

    let notesQuery = Note.find(query);
    
    if (search) {
      notesQuery = notesQuery.select({ score: { $meta: "textScore" } });
    }
    
    notesQuery = notesQuery.sort(sortObj);
    
    if (limit) {
      notesQuery = notesQuery.limit(parseInt(limit, 10));
    }
    
    const notes = await notesQuery;
    res.status(200).json({ success: true, notes });
  } catch (err) {
    next(err);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/notes/tags — Get all unique tags used by the user
// ══════════════════════════════════════════════════════════════════════════════
router.get('/tags', async (req, res, next) => {
  try {
    const tags = await Note.aggregate([
      { $match: { userId: req.user._id } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags" } },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({ success: true, tags: tags.map(t => t._id) });
  } catch (err) {
    next(err);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/notes/stats — Get aggregation stats per category
// ══════════════════════════════════════════════════════════════════════════════
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Note.aggregate([
      { $match: { userId: req.user._id } },
      { 
        $group: { 
          _id: "$category", 
          count: { $sum: 1 },
          totalWords: { $sum: "$wordCount" },
          lastUpdated: { $max: "$lastEditedAt" }
        } 
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({ success: true, stats });
  } catch (err) {
    next(err);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/notes/:id — Get a single note by ID
// ══════════════════════════════════════════════════════════════════════════════
router.get('/:id', async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }
    res.status(200).json({ success: true, note });
  } catch (err) {
    next(err);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/notes/:id/export — Export note as HTML document
// ══════════════════════════════════════════════════════════════════════════════
router.get('/:id/export', async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    let contentHtml = '';
    if (note.tabs && note.tabs.length > 0) {
      note.tabs.sort((a,b) => a.order - b.order).forEach(tab => {
        contentHtml += `<h2>${tab.title}</h2><div class="tab-content">${tab.content}</div><hr style="margin:40px 0;border:0;border-top:1px solid #eee;" />`;
      });
    } else {
      contentHtml = note.content || '<p><em>Empty note</em></p>';
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${note.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f9f9f9;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 2px solid #eee;
      padding-bottom: 0.5rem;
      margin-bottom: 2rem;
    }
    .content {
      background: #fff;
      padding: 2.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #121212;
        color: #e0e0e0;
      }
      h1 {
        color: #ffffff;
        border-bottom-color: #333;
      }
      .content {
        background: #1e1e1e;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
      }
      a {
        color: #4da6ff;
      }
    }
  </style>
</head>
<body>
  <h1>${note.title}</h1>
  <div class="content">
    ${contentHtml}
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html"`);
    res.status(200).send(html);
  } catch (err) {
    next(err);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/notes/:id/export/pdf — Export note as PDF using Puppeteer
// ══════════════════════════════════════════════════════════════════════════════
router.post('/:id/export/pdf', async (req, res, next) => {
  let browser = null;
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    let contentHtml = '';
    if (note.tabs && note.tabs.length > 0) {
      note.tabs.sort((a,b) => a.order - b.order).forEach(tab => {
        contentHtml += `<h2>${tab.title}</h2><div class="tab-content">${tab.content}</div><hr style="margin:40px 0;border:0;border-top:1px solid #eee;" />`;
      });
    } else {
      contentHtml = note.content || '<p><em>Empty note</em></p>';
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${note.title}</title>
  <style>
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 16px;
      line-height: 1.7;
      color: #000;
      background-color: #fff;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px;
    }
    h1 { font-size: 28px; margin-top: 0; margin-bottom: 8px; color: #111; }
    h2 { font-size: 22px; margin-top: 24px; margin-bottom: 12px; color: #222; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    h3 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333; }
    .meta { font-size: 14px; color: #666; margin-bottom: 32px; border-bottom: 2px solid #eee; padding-bottom: 16px; }
    
    /* Code styling */
    code { font-family: monospace; background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
    pre { background: #1e1e2e; color: #fff; padding: 16px; border-radius: 8px; font-size: 14px; overflow-wrap: break-word; white-space: pre-wrap; page-break-inside: avoid; }
    pre code { background: transparent; padding: 0; color: inherit; }
    
    /* Tables */
    table { width: 100%; border-collapse: collapse; margin: 16px 0; page-break-inside: avoid; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f9f9f9; font-weight: 600; }
    
    /* Blockquote */
    blockquote { border-left: 4px solid #6366f1; padding-left: 16px; color: #555; font-style: italic; margin: 16px 0; background: #fafafa; padding: 12px 16px; border-radius: 0 4px 4px 0; }
    
    /* Lists */
    ul, ol { padding-left: 24px; margin: 16px 0; }
    li { margin-bottom: 8px; }
    
    /* Collapsible Sections (Force Expanded for PDF) */
    details { display: block !important; margin: 16px 0; border-left: 3px solid #6366f1; padding: 8px 16px; background: #fcfcfc; border-radius: 4px; }
    summary { font-weight: 600; margin-bottom: 8px; }
    summary::marker, summary::-webkit-details-marker { display: none; content: ""; }
    summary::before { display: none; } /* Hide TipTap arrow */
    
    /* Hide Anchor Links */
    .heading-anchor { display: none !important; }
  </style>
</head>
<body>
  <h1>${note.title}</h1>
  <div class="meta">
    Category: <strong>${note.category || 'General'}</strong> &nbsp;|&nbsp; 
    Last Edited: ${new Date(note.lastEditedAt || Date.now()).toLocaleString()}
  </div>
  <div class="content">
    ${contentHtml}
  </div>
</body>
</html>`;

    // Note for Deployment:
    // Puppeteer works out of the box locally. 
    // On Linux servers (Railway, Render, VPS), you must use '--no-sandbox' and '--disable-setuid-sandbox' args.
    // On free-tier platforms, a custom buildpack (e.g. puppeteer-buildpack) or Docker setup may be required.
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    // Use domcontentloaded (much faster than networkidle0 since HTML is self-contained)
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '40px', bottom: '40px', left: '40px', right: '40px' },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:10px;color:#999;width:100%;text-align:center;">${note.title}</div>`,
      footerTemplate: '<div style="font-size:10px;color:#999;width:100%;text-align:center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${(note.title || 'note').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`);
    res.status(200).send(pdfBuffer);
    
  } catch (err) {
    console.error('PDF Export Error:', err);
    next(err);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/notes/:id — Update a note
// ══════════════════════════════════════════════════════════════════════════════
router.patch('/:id', async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    const allowed = ['title', 'content', 'tabs', 'category', 'tags', 'isPinned'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        note[key] = req.body[key];
      }
    }

    await note.save();
    res.status(200).json({ success: true, note });
  } catch (err) {
    next(err);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/notes/:id — Permanently delete a note
// ══════════════════════════════════════════════════════════════════════════════
router.delete('/:id', async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }
    res.status(200).json({ success: true, message: 'Note deleted.', noteId: note._id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
