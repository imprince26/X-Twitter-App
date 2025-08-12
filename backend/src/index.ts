import express, { Express } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import http from 'http';
import { connectDB } from './config/db';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoute';
import postsRoutes from './routes/postRoute';
import usersRoutes from './routes/userRoute';
// import followsRoutes from './routes/follows';
// import messagesRoutes from './routes/messages';
// import notificationsRoutes from './routes/notifications';
// import searchRoutes from './routes/search';
// import analyticsRoutes from './routes/analytics';
import { uploadMediaHandler,uploadSingleMedia } from './services/media';
import { initializeSocket } from './socket';
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
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/user', usersRoutes);
// app.use('/api/follows', followsRoutes);
// app.use('/api/messages', messagesRoutes);
// app.use('/api/notifications', notificationsRoutes);
// app.use('/api/search', searchRoutes);
// app.use('/api/analytics', analyticsRoutes);

// Media Upload Route
// app.post('/api/media/upload',uploadSingleMedia, uploadMediaHandler);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize Socket.IO
initializeSocket(io);

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => 
  console.log(`Server is running on port ${PORT}`)
);