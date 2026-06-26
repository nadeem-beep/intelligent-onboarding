import express from 'express';
import { all, get } from '../db.js';

const router = express.Router();

const isAiEnabled = () => !!process.env.ANTHROPIC_API_KEY;

// GET AI status
router.get('/', (req, res) => {
  res.json({ aiEnabled: isAiEnabled() });
});

// POST generate welcome message (requires API key)
router.post('/welcome-message', async (req, res) => {
  try {
    if (!isAiEnabled()) {
      return res.status(503).json({ error: 'AI features are disabled' });
    }

    const { name, role, department, managerName } = req.body;

    if (!name || !role || !department) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Generate a warm, professional welcome message (3 sentences max) for a new hire:
Name: ${name}
Role: ${role}
Department: ${department}
Manager: ${managerName || 'Not specified'}

Keep it friendly and encouraging, focused on their excitement to join.`
        }
      ]
    });

    const welcomeMessage = message.content[0].type === 'text' ? message.content[0].text : '';
    res.json({ welcomeMessage });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'Failed to generate welcome message' });
  }
});

// POST summarize task progress
router.post('/task-summary', async (req, res) => {
  try {
    if (!isAiEnabled()) {
      return res.status(503).json({ error: 'AI features are disabled' });
    }

    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'Missing employeeId' });
    }

    const employee = await get('SELECT * FROM employees WHERE id = ?', [employeeId]);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const tasks = await all(`
      SELECT * FROM employee_tasks WHERE employee_id = ? ORDER BY category, status
    `, [employeeId]);

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');

    const summaryData = `
Employee: ${employee.name}
Role: ${employee.role}
Department: ${employee.department}
Days on board: ${Math.floor((Date.now() - new Date(employee.joining_date).getTime()) / (1000 * 60 * 60 * 24))}

Completed tasks (${completedTasks.length}):
${completedTasks.map(t => `- ${t.title} (${t.category})`).join('\n')}

In Progress (${inProgressTasks.length}):
${inProgressTasks.map(t => `- ${t.title}`).join('\n')}

Pending (${pendingTasks.length}):
${pendingTasks.map(t => `- ${t.title}`).join('\n')}
`;

    const { Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Summarize this employee's onboarding progress in a friendly, encouraging way (2-3 sentences):

${summaryData}`
        }
      ]
    });

    const summary = message.content[0].type === 'text' ? message.content[0].text : '';
    res.json({ summary });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

export default router;
