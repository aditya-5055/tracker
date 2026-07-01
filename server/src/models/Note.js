const mongoose = require('mongoose');

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  'DSA', 'OS', 'DBMS', 'SQL', 'CNS',
  'SystemDesign', 'InterviewPrep', 'Project', 'General',
];

// ─── Schema ───────────────────────────────────────────────────────────────────
const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      default: 'Untitled Note',
    },
    content: {
      type: String,
      default: '',
    },
    tabs: {
      type: [{
        id: { type: String, required: true },
        title: { type: String, default: 'Untitled Tab' },
        content: { type: String, default: '' },
        parentId: { type: String, default: null },
        order: { type: Number, default: 0 }
      }],
      default: []
    },
    category: {
      type: String,
      enum: { values: CATEGORIES, message: 'Invalid category' },
      default: 'General',
    },
    tags: {
      type: [String],
      default: [],
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    lastEditedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Pre-save Hook ────────────────────────────────────────────────────────────
noteSchema.pre('save', function (next) {
  // If content is modified, calculate wordCount
  if (this.isModified('content')) {
    // Basic word count logic: strip HTML tags and split by whitespace
    const textContent = this.content ? this.content.replace(/<[^>]*>?/gm, '').trim() : '';
    this.wordCount = textContent ? textContent.split(/\s+/).length : 0;
    this.lastEditedAt = Date.now();
  }
  next();
});

// ─── Compound index for fast queries ──────────────────────────────────────────
noteSchema.index({ userId: 1, lastEditedAt: -1 });

// ─── Text index for full-text search ──────────────────────────────────────────
noteSchema.index({ title: 'text', content: 'text' });

// ─── Export ───────────────────────────────────────────────────────────────────
module.exports = mongoose.model('Note', noteSchema);
module.exports.CATEGORIES = CATEGORIES;
