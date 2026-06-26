import express from 'express';
import { run, all, get } from '../db.js';

const router = express.Router();

// GET all employees with completion % and status
router.get('/', async (req, res) => {
  try {
    const { department, status } = req.query;

    let query = `
      SELECT
        e.id, e.name, e.email, e.department, e.role, e.joining_date, e.status, e.manager_name, e.avatar_color,
        ROUND(
          COALESCE(
            SUM(CASE WHEN et.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(et.id), 0), 0
          ),
          1
        ) as completion_percentage,
        COUNT(et.id) as total_tasks,
        SUM(CASE WHEN et.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM employees e
      LEFT JOIN employee_tasks et ON e.id = et.employee_id
    `;

    const conditions = [];
    if (department) conditions.push(`e.department = '${department}'`);
    if (status) conditions.push(`e.status = '${status}'`);

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY e.id ORDER BY e.created_at DESC';

    const employees = await all(query);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create employee and auto-assign template tasks
router.post('/', async (req, res) => {
  try {
    const { name, email, department, role, template_id, joining_date, manager_name, avatar_color } = req.body;

    if (!name || !email || !department || !role || !joining_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await run(`
      INSERT INTO employees (name, email, department, role, template_id, joining_date, status, manager_name, avatar_color)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `, [name, email, department, role, template_id || null, joining_date, manager_name || '', avatar_color || '#6366f1']);

    const employeeId = result.lastID;

    // Auto-assign template tasks if template_id provided
    if (template_id) {
      const tasks = await all('SELECT * FROM template_tasks WHERE template_id = ?', [template_id]);
      const joiningDate = new Date(joining_date);

      for (const task of tasks) {
        const dueDate = new Date(joiningDate);
        dueDate.setDate(dueDate.getDate() + task.due_day);

        await run(`
          INSERT INTO employee_tasks (employee_id, template_task_id, title, description, category, due_date, status)
          VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `, [
          employeeId,
          task.id,
          task.title,
          task.description,
          task.category,
          dueDate.toISOString().split('T')[0]
        ]);
      }
    }

    res.status(201).json({ id: employeeId });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET employee with all tasks grouped by category
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await get('SELECT * FROM employees WHERE id = ?', [id]);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const tasks = await all(`
      SELECT * FROM employee_tasks WHERE employee_id = ? ORDER BY category, due_date ASC
    `, [id]);

    // Group by category
    const tasksByCategory = {};
    tasks.forEach(task => {
      if (!tasksByCategory[task.category]) {
        tasksByCategory[task.category] = [];
      }
      tasksByCategory[task.category].push(task);
    });

    // Calculate metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      ...employee,
      completionPercentage,
      totalTasks,
      completedTasks,
      tasksByCategory,
      tasks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update employee details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, role, manager_name, avatar_color, status } = req.body;

    const employee = await get('SELECT * FROM employees WHERE id = ?', [id]);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await run(`
      UPDATE employees
      SET name = ?, email = ?, department = ?, role = ?, manager_name = ?, avatar_color = ?, status = ?
      WHERE id = ?
    `, [
      name || employee.name,
      email || employee.email,
      department || employee.department,
      role || employee.role,
      manager_name || employee.manager_name,
      avatar_color || employee.avatar_color,
      status || employee.status,
      id
    ]);

    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await get('SELECT * FROM employees WHERE id = ?', [id]);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await run('DELETE FROM employees WHERE id = ?', [id]);
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
