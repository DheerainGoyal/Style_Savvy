import express from 'express';
import {
  createGarment,
  getAllGarments,
  updateGarment,
  deleteGarment,
  syncClosetJson,
} from '../controllers/closetController.js';

const router = express.Router();

// Local JSON sync/backup route (must come BEFORE /:id so "json" isn't treated as an ID)
router.get('/json', syncClosetJson);
router.post('/json', syncClosetJson);

// MongoDB CRUD routes
router.get('/', getAllGarments);
router.post('/', createGarment);
router.patch('/:id', updateGarment);
router.delete('/:id', deleteGarment);

export default router;