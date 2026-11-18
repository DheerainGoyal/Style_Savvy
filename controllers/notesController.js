import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { Note, Feedback, Chat, Refinement } from '../models/Note.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JSON_BACKUP_PATH = path.join(__dirname, '..', 'data', 'notes.json');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Read JSON backup file
async function readBackupFile() {
  try {
    const raw = await fs.readFile(JSON_BACKUP_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Write current notes into data/notes.json
async function writeBackupFile(notes) {
  try {
    await fs.mkdir(path.dirname(JSON_BACKUP_PATH), { recursive: true });
    await fs.writeFile(JSON_BACKUP_PATH, JSON.stringify(notes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Backup write failed:', err.message);
  }
}

// In-memory fallbacks when MongoDB is offline
let memFeedback = [
  {
    id: 'fb-demo-1',
    rating: 5,
    tryTip: 'yes',
    comment: 'The inverted triangle advice was spot on for my blazer silhouette!',
    lookName: 'Elevated Casual',
    createdAt: new Date().toISOString(),
  },
];

let memChat = [
  {
    id: 'chat-demo-1',
    role: 'ai',
    text: 'Hello! I am your AI Stylist. Ask me anything about tailoring, pairings, color balance, or elevating this look.',
    at: new Date().toISOString(),
  },
];

let memRefinements = { guest: [1] };

/* =========================================================================
   1. STYLIST NOTES CRUD
   ========================================================================= */

// 1. GET /api/notes — Fetch all stylist notes (consumed by notes.js)
export const getAllNotes = async (req, res) => {
  try {
    if (isDbConnected()) {
      const notes = await Note.find().sort({ createdAt: -1 });
      return res.status(200).json(notes);
    }
    const backup = await readBackupFile();
    return res.status(200).json(backup);
  } catch (err) {
    const backup = await readBackupFile();
    res.status(200).json(backup);
  }
};

// 2. GET /api/notes/:id — Fetch single note by ID
export const getNoteById = async (req, res) => {
  try {
    if (isDbConnected()) {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).json({ error: 'Stylist note not found' });
      return res.status(200).json(note);
    }
    const backup = await readBackupFile();
    const note = backup.find((n) => n.id === req.params.id || n._id === req.params.id);
    if (!note) return res.status(404).json({ error: 'Stylist note not found' });
    return res.status(200).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. POST /api/notes — Add / create stylist note
export const createNote = async (req, res) => {
  try {
    const { lookName, lookKicker, lookMeta, score, top, whyItWorks, colors, tip } = req.body;
    if (isDbConnected()) {
      const note = await Note.create({
        lookName: lookName || 'Elevated Casual',
        lookKicker,
        lookMeta,
        score,
        top,
        whyItWorks,
        colors,
        tip,
      });
      const allNotes = await Note.find().sort({ createdAt: -1 });
      await writeBackupFile(allNotes);
      return res.status(201).json(note);
    }
    const backup = await readBackupFile();
    const newNote = {
      id: 'note_' + Date.now().toString(36),
      lookName: lookName || 'Elevated Casual',
      lookKicker: lookKicker || "TODAY'S LOOK",
      lookMeta: lookMeta || '3 items · Zendaya-inspired',
      score: score || 91,
      top: top || { kind: 'blazer', bg: '#efe6d3', color: '#c9a96e' },
      whyItWorks: whyItWorks || backup[0]?.whyItWorks,
      colors: colors || backup[0]?.colors,
      tip: tip || backup[0]?.tip,
      createdAt: new Date().toISOString(),
    };
    backup.unshift(newNote);
    await writeBackupFile(backup);
    return res.status(201).json(newNote);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 4. PATCH / PUT /api/notes/:id — Update stylist note
export const updateNote = async (req, res) => {
  try {
    if (isDbConnected()) {
      const updated = await Note.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updated) return res.status(404).json({ error: 'Stylist note not found' });
      const allNotes = await Note.find().sort({ createdAt: -1 });
      await writeBackupFile(allNotes);
      return res.status(200).json(updated);
    }
    const backup = await readBackupFile();
    const idx = backup.findIndex((n) => n.id === req.params.id || n._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Stylist note not found' });
    backup[idx] = { ...backup[idx], ...req.body, updatedAt: new Date().toISOString() };
    await writeBackupFile(backup);
    return res.status(200).json(backup[idx]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 5. DELETE /api/notes/:id — Delete stylist note
export const deleteNote = async (req, res) => {
  try {
    if (isDbConnected()) {
      const deleted = await Note.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Stylist note not found' });
      const allNotes = await Note.find().sort({ createdAt: -1 });
      await writeBackupFile(allNotes);
      return res.status(200).json({ message: 'Stylist note deleted', id: req.params.id });
    }
    const backup = await readBackupFile();
    const filtered = backup.filter((n) => n.id !== req.params.id && n._id !== req.params.id);
    await writeBackupFile(filtered);
    return res.status(200).json({ message: 'Stylist note deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. GET & POST /api/notes/json — Sync/backup notes into data/notes.json
export const syncNotesJson = async (req, res) => {
  try {
    let items = [];
    if (isDbConnected()) {
      items = await Note.find().sort({ createdAt: -1 });
    } else {
      items = await readBackupFile();
    }
    await writeBackupFile(items);
    res.status(200).json({
      message: 'Synced notes to data/notes.json',
      count: items.length,
      items,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================================================================
   2. FEEDBACK CRUD
   ========================================================================= */

// GET /api/notes/feedback
export const getAllFeedback = async (req, res) => {
  try {
    if (isDbConnected()) {
      const list = await Feedback.find().sort({ createdAt: -1 });
      return res.status(200).json(list);
    }
    return res.status(200).json(memFeedback);
  } catch (err) {
    res.status(200).json(memFeedback);
  }
};

// POST /api/notes/feedback
export const createFeedback = async (req, res) => {
  try {
    const { rating, tryTip, comment, lookId, lookName } = req.body;
    if (isDbConnected()) {
      const entry = await Feedback.create({
        rating,
        tryTip,
        comment: comment || '',
        lookId: lookId || null,
        lookName: lookName || 'Elevated Casual',
      });
      return res.status(201).json(entry);
    }
    const entry = {
      id: 'fb_' + Date.now().toString(36),
      rating: Number(rating),
      tryTip,
      comment: comment || '',
      lookId: lookId || null,
      lookName: lookName || 'Elevated Casual',
      createdAt: new Date().toISOString(),
    };
    memFeedback.unshift(entry);
    return res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/notes/feedback/:id
export const deleteFeedback = async (req, res) => {
  try {
    if (isDbConnected()) {
      const deleted = await Feedback.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Feedback not found' });
      return res.status(200).json({ message: 'Feedback deleted', id: req.params.id });
    }
    memFeedback = memFeedback.filter((f) => f.id !== req.params.id && f._id !== req.params.id);
    return res.status(200).json({ message: 'Feedback deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================================================================
   3. CHAT CRUD
   ========================================================================= */

// GET /api/notes/chat
export const getChatHistory = async (req, res) => {
  try {
    if (isDbConnected()) {
      const messages = await Chat.find().sort({ at: 1 });
      return res.status(200).json(messages);
    }
    return res.status(200).json(memChat);
  } catch (err) {
    res.status(200).json(memChat);
  }
};

// POST /api/notes/chat
export const createChatMessage = async (req, res) => {
  try {
    const { role, text, at } = req.body;
    if (isDbConnected()) {
      const msg = await Chat.create({
        role: role || 'user',
        text,
        at: at ? new Date(at) : new Date(),
      });
      return res.status(201).json(msg);
    }
    const msg = {
      id: 'chat_' + Date.now().toString(36),
      role: role || 'user',
      text,
      at: at || new Date().toISOString(),
    };
    memChat.push(msg);
    return res.status(201).json(msg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/notes/chat
export const clearChatHistory = async (req, res) => {
  try {
    if (isDbConnected()) {
      await Chat.deleteMany({});
      return res.status(200).json({ message: 'Chat history cleared' });
    }
    memChat = [];
    return res.status(200).json({ message: 'Chat history cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================================================================
   4. REFINEMENTS CHECKLIST CRUD
   ========================================================================= */

// GET /api/notes/refinements
export const getRefinements = async (req, res) => {
  try {
    const userId = req.query.userId || 'guest';
    if (isDbConnected()) {
      const state = await Refinement.findOne({ userId });
      return res.status(200).json(state ? state.done : []);
    }
    return res.status(200).json(memRefinements[userId] || []);
  } catch (err) {
    res.status(200).json(memRefinements['guest'] || []);
  }
};

// PUT /api/notes/refinements
export const updateRefinements = async (req, res) => {
  try {
    const userId = req.body.userId || 'guest';
    const done = req.body.done || [];
    if (isDbConnected()) {
      const state = await Refinement.findOneAndUpdate(
        { userId },
        { done, updatedAt: new Date() },
        { new: true, upsert: true }
      );
      return res.status(200).json({ message: 'Refinements updated', done: state.done });
    }
    memRefinements[userId] = done;
    return res.status(200).json({ message: 'Refinements updated', done });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
