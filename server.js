import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

import userRoutes from './routes/userRoutes.js';       // Member 1
import closetRoutes from './routes/closetRoutes.js';   // Member 2
import tryonRoutes from './routes/tryonRoutes.js';     // Member 3 (You)
import notesRoutes from './routes/notesRoutes.js';     // Member 4
import profileRoutes from './routes/profileRoutes.js'; // Member 5

dotenv.config();
connectDB();

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static('public'));

app.use('/api/users', userRoutes);
app.use('/api/closet', closetRoutes);
app.use('/api/looks', tryonRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/profile', profileRoutes);

app.listen(process.env.PORT || 3000, () => console.log('StyleSavvy running on http://localhost:3000'));