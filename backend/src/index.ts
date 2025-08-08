import express, { Express } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import http from 'http';
import { connectDB } from './config/db';
import { clerkMiddleware } from '@clerk/express';

import authRoutes from './routes/auth';
import postsRoutes from './routes/posts';
import usersRoutes from './routes/users';
import followsRoutes from './routes/follows';
import messagesRoutes from './routes/messages';
import notificationsRoutes from './routes/notifications';
import searchRoutes from './routes/search';
import analyticsRoutes from './routes/analytics';

import { uploadMedia, uploadMediaHandler } from './services/media';
import { initializeSocket } from './socket';
import logger from './config/logger';
import 'dotenv/config';

const app: Express = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// MongoDB Connection
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(clerkMiddleware()); // Add Clerk middleware globally
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/follows', followsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);

// Media Upload Route
app.post('/api/media/upload', uploadMedia, uploadMediaHandler);

// Initialize Socket.IO
initializeSocket(io);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));