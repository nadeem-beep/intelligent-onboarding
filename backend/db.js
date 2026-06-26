import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'onboarding.db');

const db = new sqlite3.Database(dbPath);

// Promisify database operations
export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

export const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const exec = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Initialize schema
export const initDb = async () => {
  await exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      role TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS template_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      due_day INTEGER NOT NULL,
      is_required INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      role TEXT NOT NULL,
      template_id INTEGER REFERENCES templates(id),
      joining_date DATE NOT NULL,
      status TEXT DEFAULT 'active',
      manager_name TEXT,
      avatar_color TEXT DEFAULT '#6366f1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      template_task_id INTEGER NOT NULL REFERENCES template_tasks(id),
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      due_date DATE,
      status TEXT DEFAULT 'pending',
      completed_at DATETIME,
      notes TEXT
    );
  `);

  // Seed data
  const checkTemplate = await get('SELECT COUNT(*) as count FROM templates');
  if (checkTemplate.count === 0) {
    // Templates
    const engTemplate = await run(`
      INSERT INTO templates (name, department, role, description)
      VALUES (?, ?, ?, ?)
    `, ['Engineering Onboarding', 'Engineering', 'Software Engineer', 'Standard onboarding for engineers']);

    const salesTemplate = await run(`
      INSERT INTO templates (name, department, role, description)
      VALUES (?, ?, ?, ?)
    `, ['Sales Onboarding', 'Sales', 'Sales Executive', 'Standard onboarding for sales team']);

    const opsTemplate = await run(`
      INSERT INTO templates (name, department, role, description)
      VALUES (?, ?, ?, ?)
    `, ['Operations Onboarding', 'Operations', 'Operations Manager', 'Standard onboarding for operations']);

    const engId = engTemplate.lastID;
    const salesId = salesTemplate.lastID;
    const opsId = opsTemplate.lastID;

    // Engineering tasks
    const engTasks = [
      { title: 'Laptop & Equipment Setup', category: 'IT Setup', due_day: 1 },
      { title: 'GitHub & Dev Tools Access', category: 'IT Setup', due_day: 1 },
      { title: 'Sign Employment Agreement', category: 'HR Compliance', due_day: 1 },
      { title: 'Complete Tax Forms', category: 'HR Compliance', due_day: 3 },
      { title: 'Intro to Engineering Culture', category: 'Training', due_day: 2 },
      { title: 'Codebase Walkthrough', category: 'Training', due_day: 3 },
      { title: 'Meet Team Members', category: 'Meet the Team', due_day: 2 },
      { title: 'Learn Architecture & Design Patterns', category: 'Product Knowledge', due_day: 7 },
      { title: 'Complete First Code Review', category: 'Training', due_day: 14 },
      { title: 'Deploy First Feature', category: 'Product Knowledge', due_day: 30 }
    ];

    for (const task of engTasks) {
      await run(`
        INSERT INTO template_tasks (template_id, title, description, category, due_day, is_required, sort_order)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `, [engId, task.title, '', task.category, task.due_day, engTasks.indexOf(task)]);
    }

    // Sales tasks
    const salesTasks = [
      { title: 'Office Setup & Access', category: 'IT Setup', due_day: 1 },
      { title: 'Phone & CRM Access', category: 'IT Setup', due_day: 1 },
      { title: 'Sign Employment Agreement', category: 'HR Compliance', due_day: 1 },
      { title: 'Complete Compliance Training', category: 'HR Compliance', due_day: 5 },
      { title: 'Sales Process & Tools Training', category: 'Training', due_day: 2 },
      { title: 'Product Knowledge Deep Dive', category: 'Product Knowledge', due_day: 7 },
      { title: 'Meet Sales Team', category: 'Meet the Team', due_day: 1 },
      { title: 'First Sales Call Observed', category: 'Training', due_day: 5 },
      { title: 'Independent Sales Call', category: 'Training', due_day: 14 },
      { title: 'First Deal Closed', category: 'Product Knowledge', due_day: 30 }
    ];

    for (const task of salesTasks) {
      await run(`
        INSERT INTO template_tasks (template_id, title, description, category, due_day, is_required, sort_order)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `, [salesId, task.title, '', task.category, task.due_day, salesTasks.indexOf(task)]);
    }

    // Operations tasks
    const opsTasks = [
      { title: 'Office Setup', category: 'IT Setup', due_day: 1 },
      { title: 'Systems Access & Permissions', category: 'IT Setup', due_day: 2 },
      { title: 'Sign Employment Agreement', category: 'HR Compliance', due_day: 1 },
      { title: 'Policies & Procedures Training', category: 'HR Compliance', due_day: 3 },
      { title: 'Operations Workflow Training', category: 'Training', due_day: 3 },
      { title: 'Key Process Overview', category: 'Product Knowledge', due_day: 7 },
      { title: 'Meet Department Team', category: 'Meet the Team', due_day: 1 },
      { title: 'Shadow Team Members', category: 'Training', due_day: 5 },
      { title: 'Lead First Process', category: 'Training', due_day: 21 },
      { title: 'Performance Review Check-in', category: 'Training', due_day: 30 }
    ];

    for (const task of opsTasks) {
      await run(`
        INSERT INTO template_tasks (template_id, title, description, category, due_day, is_required, sort_order)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `, [opsId, task.title, '', task.category, task.due_day, opsTasks.indexOf(task)]);
    }

    // Employees with varied progress
    const today = new Date();
    const daysAgo = (days) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const employees = [
      { name: 'Alice Johnson', email: 'alice@example.com', department: 'Engineering', role: 'Software Engineer', template_id: engId, joining_date: daysAgo(60), manager_name: 'Bob Smith', avatar_color: '#6366f1' },
      { name: 'Bob Chen', email: 'bob@example.com', department: 'Engineering', role: 'Senior Engineer', template_id: engId, joining_date: daysAgo(45), manager_name: 'Bob Smith', avatar_color: '#8b5cf6' },
      { name: 'Carol Davis', email: 'carol@example.com', department: 'Sales', role: 'Sales Executive', template_id: salesId, joining_date: daysAgo(30), manager_name: 'David Wilson', avatar_color: '#ec4899' },
      { name: 'David Lee', email: 'david@example.com', department: 'Operations', role: 'Operations Manager', template_id: opsId, joining_date: daysAgo(15), manager_name: 'Eve Johnson', avatar_color: '#f59e0b' },
      { name: 'Eve Martinez', email: 'eve@example.com', department: 'Engineering', role: 'Junior Engineer', template_id: engId, joining_date: daysAgo(10), manager_name: 'Bob Smith', avatar_color: '#14b8a6' },
      { name: 'Frank Wang', email: 'frank@example.com', department: 'Sales', role: 'Sales Manager', template_id: salesId, joining_date: daysAgo(5), manager_name: 'David Wilson', avatar_color: '#06b6d4' },
      { name: 'Grace Kim', email: 'grace@example.com', department: 'Operations', role: 'Operations Analyst', template_id: opsId, joining_date: daysAgo(2), manager_name: 'Eve Johnson', avatar_color: '#84cc16' },
      { name: 'Henry Park', email: 'henry@example.com', department: 'Engineering', role: 'DevOps Engineer', template_id: engId, joining_date: daysAgo(0), manager_name: 'Bob Smith', avatar_color: '#f43f5e' }
    ];

    for (const emp of employees) {
      const result = await run(`
        INSERT INTO employees (name, email, department, role, template_id, joining_date, status, manager_name, avatar_color)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
      `, [emp.name, emp.email, emp.department, emp.role, emp.template_id, emp.joining_date, emp.manager_name, emp.avatar_color]);

      const employeeId = result.lastID;

      // Auto-assign template tasks
      if (emp.template_id) {
        const tasks = await all('SELECT * FROM template_tasks WHERE template_id = ?', [emp.template_id]);
        const joiningDate = new Date(emp.joining_date);

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

        // Simulate progress
        const daysSinceJoining = Math.floor((today - joiningDate) / (1000 * 60 * 60 * 24));
        const completionRatio = Math.min(daysSinceJoining / 60, 1);
        const tasksToComplete = Math.floor(tasks.length * completionRatio);

        if (tasksToComplete > 0) {
          const employeeTasks = await all('SELECT * FROM employee_tasks WHERE employee_id = ? ORDER BY due_date ASC', [employeeId]);
          for (let i = 0; i < Math.min(tasksToComplete, employeeTasks.length); i++) {
            const completedDate = new Date(joiningDate);
            completedDate.setDate(completedDate.getDate() + Math.random() * daysSinceJoining);

            await run(`
              UPDATE employee_tasks SET status = 'completed', completed_at = ? WHERE id = ?
            `, [completedDate.toISOString(), employeeTasks[i].id]);
          }
        }
      }
    }
  }
};

export default db;
