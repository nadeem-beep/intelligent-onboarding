import express from 'express';
import { all, get } from '../db.js';

const router = express.Router();

// GET analytics overview
router.get('/overview', async (req, res) => {
  try {
    const totalEmployees = (await get('SELECT COUNT(*) as count FROM employees WHERE status = "active"')).count;

    const completedThisMonth = (await get(`
      SELECT COUNT(DISTINCT e.id) as count FROM employees e
      WHERE e.status = 'active' AND datetime(e.created_at) >= datetime('now', '-30 days')
    `)).count;

    const avgRes = await get(`
      SELECT ROUND(AVG(completion), 1) as avg_rate FROM (
        SELECT
          ROUND(
            COALESCE(
              SUM(CASE WHEN et.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(et.id), 0), 0
            )
          ) as completion
        FROM employees e
        LEFT JOIN employee_tasks et ON e.id = et.employee_id
        WHERE e.status = 'active'
        GROUP BY e.id
      )
    `);
    const avgCompletionRate = avgRes.avg_rate || 0;

    const overdueTasks = (await get(`
      SELECT COUNT(*) as count FROM employee_tasks
      WHERE status IN ('pending', 'in_progress') AND due_date < date('now')
    `)).count;

    const avgDaysRes = await get(`
      SELECT ROUND(AVG(days_to_complete), 1) as avg_days FROM (
        SELECT
          ROUND((julianday(et.completed_at) - julianday(e.joining_date))) as days_to_complete
        FROM employee_tasks et
        JOIN employees e ON et.employee_id = e.id
        WHERE et.status = 'completed' AND et.completed_at IS NOT NULL
      )
    `);
    const avgDaysToComplete = avgDaysRes.avg_days || 0;

    const activeOnboarding = (await get(`
      SELECT COUNT(DISTINCT e.id) as count FROM employees e
      LEFT JOIN employee_tasks et ON e.id = et.employee_id
      WHERE e.status = 'active'
        AND EXISTS (SELECT 1 FROM employee_tasks WHERE employee_id = e.id AND status != 'completed')
    `)).count;

    res.json({
      totalEmployees,
      activeOnboarding,
      completedThisMonth,
      avgCompletionRate,
      overdueTasks,
      avgDaysToComplete
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET completion rate by department
router.get('/completion', async (req, res) => {
  try {
    const data = await all(`
      SELECT
        e.department,
        COUNT(e.id) as employee_count,
        ROUND(
          COALESCE(
            SUM(CASE WHEN et.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(et.id), 0), 0
          ),
          1
        ) as completion_percentage
      FROM employees e
      LEFT JOIN employee_tasks et ON e.id = et.employee_id
      WHERE e.status = 'active'
      GROUP BY e.department
      ORDER BY completion_percentage DESC
    `);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET task completions timeline (last 30 days)
router.get('/timeline', async (req, res) => {
  try {
    const data = await all(`
      WITH RECURSIVE dates(date) AS (
        SELECT date('now', '-29 days')
        UNION ALL
        SELECT date(date, '+1 day') FROM dates WHERE date < date('now')
      )
      SELECT
        dates.date,
        COUNT(et.id) as tasks_completed
      FROM dates
      LEFT JOIN employee_tasks et ON date(et.completed_at) = dates.date
      GROUP BY dates.date
      ORDER BY dates.date ASC
    `);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET employee progress table
router.get('/employees', async (req, res) => {
  try {
    const data = await all(`
      SELECT
        e.id, e.name, e.department, e.role, e.joining_date, e.status,
        ROUND(
          COALESCE(
            SUM(CASE WHEN et.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(et.id), 0), 0
          ),
          1
        ) as completion_percentage,
        ROUND(CAST(JULIANDAY('now') - JULIANDAY(e.joining_date) AS INTEGER)) as days_since_joining,
        COUNT(et.id) as total_tasks,
        SUM(CASE WHEN et.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM employees e
      LEFT JOIN employee_tasks et ON e.id = et.employee_id
      WHERE e.status = 'active'
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET completion rate per task category
router.get('/categories', async (req, res) => {
  try {
    const data = await all(`
      SELECT
        category,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        ROUND(
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
          1
        ) as completion_percentage
      FROM employee_tasks
      GROUP BY category
      ORDER BY completion_percentage DESC
    `);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
