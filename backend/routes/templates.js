import express from 'express';
import { run, all, get } from '../db.js';

const router = express.Router();

// GET all templates with task count
router.get('/', async (req, res) => {
  try {
    const templates = await all(`
      SELECT
        t.id, t.name, t.department, t.role, t.description, t.created_at,
        COUNT(DISTINCT tt.id) as task_count,
        COUNT(DISTINCT e.id) as employee_count
      FROM templates t
      LEFT JOIN template_tasks tt ON t.id = tt.template_id
      LEFT JOIN employees e ON t.id = e.template_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create template
router.post('/', async (req, res) => {
  try {
    const { name, department, role, description } = req.body;

    if (!name || !department || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await run(`
      INSERT INTO templates (name, department, role, description)
      VALUES (?, ?, ?, ?)
    `, [name, department, role, description || '']);

    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET template with all tasks
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await get('SELECT * FROM templates WHERE id = ?', [id]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const tasks = await all(`
      SELECT * FROM template_tasks WHERE template_id = ? ORDER BY sort_order ASC
    `, [id]);

    res.json({ ...template, tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, role, description } = req.body;

    const template = await get('SELECT * FROM templates WHERE id = ?', [id]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await run(`
      UPDATE templates SET name = ?, department = ?, role = ?, description = ?
      WHERE id = ?
    `, [name, department, role, description || '', id]);

    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await get('SELECT * FROM templates WHERE id = ?', [id]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await run('DELETE FROM templates WHERE id = ?', [id]);
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add task to template
router.post('/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, due_day, is_required } = req.body;

    const template = await get('SELECT * FROM templates WHERE id = ?', [id]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (!title || !category || due_day === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await run(`
      INSERT INTO template_tasks (template_id, title, description, category, due_day, is_required)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, title, description || '', category, due_day, is_required !== false ? 1 : 0]);

    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update task
router.put('/:id/tasks/:taskId', async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { title, description, category, due_day, is_required } = req.body;

    const task = await get('SELECT * FROM template_tasks WHERE id = ? AND template_id = ?', [taskId, id]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await run(`
      UPDATE template_tasks
      SET title = ?, description = ?, category = ?, due_day = ?, is_required = ?
      WHERE id = ?
    `, [title, description || '', category, due_day, is_required !== false ? 1 : 0, taskId]);

    res.json({ id: taskId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE task
router.delete('/:id/tasks/:taskId', async (req, res) => {
  try {
    const { id, taskId } = req.params;

    const task = await get('SELECT * FROM template_tasks WHERE id = ? AND template_id = ?', [taskId, id]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await run('DELETE FROM template_tasks WHERE id = ?', [taskId]);
    res.json({ id: taskId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
