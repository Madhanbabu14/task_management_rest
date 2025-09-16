import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || '*' }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

  socket.on('joinProject', (projectId) => {
    socket.join(`project_${projectId}`);
  });

  socket.on('leaveProject', (projectId) => {
    socket.leave(`project_${projectId}`);
  });

  socket.on('taskUpdated', (data) => {
    io.emit('taskUpdated', data);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
  });
});

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/task_management');

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));