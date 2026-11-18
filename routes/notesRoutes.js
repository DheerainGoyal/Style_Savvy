import express from 'express';
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  syncNotesJson,
  getAllFeedback,
  createFeedback,
  deleteFeedback,
  getChatHistory,
  createChatMessage,
  clearChatHistory,
  getRefinements,
  updateRefinements,
} from '../controllers/notesController.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', module: 'Stylist Notes' }));

// 1. Specific sub-resources (MUST come before /:id)
// JSON backup/sync
router.get('/json', syncNotesJson);
router.post('/json', syncNotesJson);

// Feedback CRUD
router.get('/feedback', getAllFeedback);
router.post('/feedback', createFeedback);
router.delete('/feedback/:id', deleteFeedback);

// Chat CRUD
router.get('/chat', getChatHistory);
router.post('/chat', createChatMessage);
router.delete('/chat', clearChatHistory);

// Refinements CRUD
router.get('/refinements', getRefinements);
router.put('/refinements', updateRefinements);

// 2. Stylist Notes CRUD
router.get('/', getAllNotes);
router.post('/', createNote);
router.get('/:id', getNoteById);
router.patch('/:id', updateNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
