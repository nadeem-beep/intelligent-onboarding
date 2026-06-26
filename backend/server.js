import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import templatesRoute from './routes/templates.js';
import employeesRoute from './routes/employees.js';
import tasksRoute from './routes/tasks.js';
import analyticsRoute from './routes/analytics.js';
import aiRoute from './routes/ai.js';
import chatRoute from './routes/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/templates', templatesRoute);
app.use('/api/employees', employeesRoute);
app.use('/api/tasks', tasksRoute);
app.use('/api/analytics', analyticsRoute);
app.use('/api/ai', aiRoute);
app.use('/api/chat', chatRoute);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', aiEnabled: !!process.env.ANTHROPIC_API_KEY });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('Initializing database...');
    await initDb();
    console.log('Database initialized');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`AI features: ${process.env.ANTHROPIC_API_KEY ? 'enabled' : 'disabled'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
