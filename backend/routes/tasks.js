import express from 'express';
import { run, all, get } from '../db.js';

const router = express.Router();

// GET all tasks for employee grouped by category
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;

    const tasks = await all(`
      SELECT * FROM employee_tasks WHERE employee_id = ? ORDER BY category, due_date ASC
    `, [employeeId]);

    if (tasks.length === 0) {
      // Check if employee exists
      const employee = await get('SELECT id FROM employees WHERE id = ?', [employeeId]);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
    }

    // Group by category
    const tasksByCategory = {};
    tasks.forEach(task => {
      if (!tasksByCategory[task.category]) {
        tasksByCategory[task.category] = [];
      }
      tasksByCategory[task.category].push(task);
    });

    res.json({ tasks, tasksByCategory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update task status and notes
router.patch('/employee/:employeeId/task/:taskId', async (req, res) => {
  try {
    const { employeeId, taskId } = req.params;
    const { status, notes } = req.body;

    const task = await get(`
      SELECT * FROM employee_tasks WHERE id = ? AND employee_id = ?
    `, [taskId, employeeId]);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const completedAt = status === 'completed' ? new Date().toISOString() : null;

    await run(`
      UPDATE employee_tasks SET status = ?, notes = ?, completed_at = ? WHERE id = ?
    `, [status, notes || '', completedAt, taskId]);

    res.json({ id: taskId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
