import express from 'express';
import { all, get, run } from '../db.js';

const router = express.Router();

const isAiEnabled = () => !!process.env.ANTHROPIC_API_KEY;

// POST chat message
router.post('/message', async (req, res) => {
  try {
    if (!isAiEnabled()) {
      return res.status(503).json({ error: 'AI features are disabled' });
    }

    const { employeeId, message, conversationHistory = [] } = req.body;

    if (!message || !employeeId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get employee context
    const employee = await get('SELECT * FROM employees WHERE id = ?', [employeeId]);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Get employee tasks for context
    const tasks = await all(`
      SELECT * FROM employee_tasks WHERE employee_id = ? ORDER BY status, due_date
    `, [employeeId]);

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

    const employeeContext = `
Employee Name: ${employee.name}
Role: ${employee.role}
Department: ${employee.department}
Joining Date: ${employee.joining_date}
Manager: ${employee.manager_name}

Onboarding Progress:
- Completed Tasks: ${completedTasks}/${tasks.length}
- In Progress: ${inProgressTasks}
- Pending: ${pendingTasks}

Pending Tasks:
${tasks.filter(t => t.status === 'pending').map(t => `- ${t.title} (Due: ${t.due_date})`).join('\n') || 'None'}
    `;

    // Build conversation history - only last 3 messages for context
    const recentMessages = conversationHistory.slice(-3);
    const messages = [
      ...recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const { Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `You are a helpful onboarding assistant. Help ${employee.name} (${employee.role}) with their onboarding questions. Be brief and helpful.`,
      messages
    });

    const assistantMessage = response.content[0]?.text || 'I did not receive a proper response. Please try again.';

    res.json({ message: assistantMessage });
  } catch (error) {
    console.error('Chat Error:', error.message, error.code);
    res.status(500).json({ error: 'Chat service temporarily unavailable. Please try again.' });
  }
});

// POST get adaptive recommendations
router.post('/recommendations', async (req, res) => {
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
      SELECT * FROM employee_tasks WHERE employee_id = ? ORDER BY due_date
    `, [employeeId]);

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');

    // Calculate progress metrics
    const totalTasks = tasks.length;
    const completionRate = (completedTasks.length / totalTasks) * 100;
    const daysSinceJoining = Math.floor((new Date() - new Date(employee.joining_date)) / (1000 * 60 * 60 * 24));
    const taskCompletionRate = completedTasks.length / daysSinceJoining;

    // Identify learning areas
    const categoryCompletionByCategory = {};
    tasks.forEach(task => {
      if (!categoryCompletionByCategory[task.category]) {
        categoryCompletionByCategory[task.category] = { total: 0, completed: 0 };
      }
      categoryCompletionByCategory[task.category].total++;
      if (task.status === 'completed') {
        categoryCompletionByCategory[task.category].completed++;
      }
    });

    const taskSummary = `
Employee: ${employee.name}
Role: ${employee.role}
Department: ${employee.department}
Days Since Joining: ${daysSinceJoining}

Progress Metrics:
- Overall Completion: ${completionRate.toFixed(1)}%
- Tasks Completed: ${completedTasks.length}/${totalTasks}
- Daily Completion Rate: ${taskCompletionRate.toFixed(2)} tasks/day

Category Breakdown:
${Object.entries(categoryCompletionByCategory).map(([cat, data]) => {
  const pct = (data.completed / data.total) * 100;
  return `- ${cat}: ${data.completed}/${data.total} (${pct.toFixed(0)}%)`;
}).join('\n')}

Pending Priority Tasks:
${pendingTasks.slice(0, 5).map(t => `- ${t.title} (Due: ${t.due_date})`).join('\n')}
    `;

    const { Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `Based on this employee's onboarding progress, provide personalized adaptive learning recommendations to help them succeed:

${taskSummary}

Provide recommendations in JSON format:
{
  "focus_areas": ["area1", "area2"],
  "suggested_tasks": ["task1", "task2"],
  "learning_pace": "slow|normal|fast",
  "estimated_completion_date": "YYYY-MM-DD",
  "key_insights": "2-3 sentence summary"
}`
        }
      ]
    });

    let recommendations;
    try {
      const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Could not parse recommendations' };
    } catch (e) {
      recommendations = {
        focus_areas: ['Complete pending tasks', 'Build foundational knowledge'],
        suggested_tasks: pendingTasks.slice(0, 3).map(t => t.title),
        learning_pace: 'normal',
        key_insights: 'Keep progressing at current pace'
      };
    }

    res.json(recommendations);
  } catch (error) {
    console.error('Recommendations Error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

export default router;
