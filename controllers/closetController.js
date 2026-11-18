import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Garment from '../models/Garment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JSON_BACKUP_PATH = path.join(__dirname, '..', 'data', 'closet.json');

// Helper: Fetch human-readable color name from The Color API (free, no key needed)
async function fetchColorName(hex) {
  try {
    const cleanHex = String(hex || '#c9a96e').replace('#', '').trim();
    const response = await fetch(`https://www.thecolorapi.com/id?hex=${cleanHex}`);
    if (!response.ok) return 'Custom Shade';
    const data = await response.json();
    return data?.name?.value || 'Custom Shade';
  } catch (err) {
    console.error('Color API lookup failed:', err.message);
    return 'Custom Shade';
  }
}

// Helper: Write current MongoDB garments into data/closet.json
async function writeBackupFile(garments) {
  await fs.mkdir(path.dirname(JSON_BACKUP_PATH), { recursive: true });
  await fs.writeFile(JSON_BACKUP_PATH, JSON.stringify(garments, null, 2), 'utf-8');
}

// 1. POST /api/closet — Add new garment (with Color API naming)
export const createGarment = async (req, res) => {
  try {
    const name = (req.body.name || req.body.title || '').trim();
    const cat = req.body.cat || req.body.category || 'Tops';
    const kind = (req.body.kind || 'top').toLowerCase();
    const color = req.body.color || req.body.colorHex || '#c9a96e';
    const image = req.body.image || '';

    if (!name) {
      return res.status(400).json({ error: 'Garment name/title is required' });
    }

    const colorName = await fetchColorName(color);

    const garment = await Garment.create({
      name,
      cat,
      kind,
      color,
      colorName,
      image,
    });

    const allGarments = await Garment.find().sort({ createdAt: -1 });
    await writeBackupFile(allGarments);

    res.status(201).json(garment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 2. GET /api/closet — Fetch all wardrobe items (also consumed by tryon.js)
export const getAllGarments = async (req, res) => {
  try {
    const garments = await Garment.find().sort({ createdAt: -1 });
    res.status(200).json(garments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. PATCH /api/closet/:id — Update garment details, favourite, or "Today's Look"
export const updateGarment = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.title && !updates.name) updates.name = updates.title;
    if (updates.category && !updates.cat) updates.cat = updates.category;
    if (updates.colorHex && !updates.color) updates.color = updates.colorHex;

    if (updates.color) {
      updates.colorName = await fetchColorName(updates.color);
    }

    const updated = await Garment.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Garment not found' });
    }

    const allGarments = await Garment.find().sort({ createdAt: -1 });
    await writeBackupFile(allGarments);

    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 4. DELETE /api/closet/:id — Remove garment from closet
export const deleteGarment = async (req, res) => {
  try {
    const deleted = await Garment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Garment not found' });
    }

    const allGarments = await Garment.find().sort({ createdAt: -1 });
    await writeBackupFile(allGarments);

    res.status(200).json({ message: 'Garment deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. GET & POST /api/closet/json — Sync/backup wardrobe items into data/closet.json
export const syncClosetJson = async (req, res) => {
  try {
    const garments = await Garment.find().sort({ createdAt: -1 });
    await writeBackupFile(garments);
    res.status(200).json({
      message: 'Synced wardrobe to data/closet.json',
      count: garments.length,
      items: garments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};