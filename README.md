# Intelligent Onboarding System

A full-stack web application for managing employee onboarding workflows, tracking progress, and analyzing onboarding health.

## Features

- **HR Admin Features**
  - Create and manage onboarding templates with customizable tasks
  - Add employees and auto-assign onboarding templates
  - Track employee progress in real-time
  - View detailed analytics and completion metrics

- **New Hire Portal**
  - Self-service task completion at `/portal/:employeeId`
  - Progress tracking with interactive checklist
  - Task notes and status updates
  - Celebration confetti on 100% completion

- **Analytics Dashboard**
  - KPI overview (total employees, active onboarding, avg completion, overdue tasks)
  - Task completion timeline (30-day view)
  - Department-wise completion rates
  - Task category performance (radar chart)
  - Onboarding funnel visualization
  - Employee progress table with detailed metrics

- **Optional AI Features** (with Anthropic API key)
  - Generate personalized welcome messages for new hires
  - AI-powered progress summaries

## Quick Start

### 1. Clone and Install

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure Environment (Optional)

```bash
cp .env.example .env
# Edit .env and add ANTHROPIC_API_KEY if you want AI features
```

### 3. Start Backend

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:3001`

### 4. Start Frontend (in new terminal)

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

### 5. Open Application

Visit `http://localhost:5173`

## Project Structure

```
intelligent-onboarding/
├── backend/
│   ├── db.js                    # SQLite database setup & seed
│   ├── server.js                # Express app entry
│   ├── routes/
│   │   ├── templates.js         # Template CRUD
│   │   ├── employees.js         # Employee CRUD
│   │   ├── tasks.js             # Task updates
│   │   ├── analytics.js         # Analytics endpoints
│   │   └── ai.js                # AI features (optional)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   │   └── client.js        # Axios config
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Employees.jsx
│   │   │   ├── EmployeeDetail.jsx
│   │   │   ├── Templates.jsx
│   │   │   ├── TemplateBuilder.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── HirePortal.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── ProgressRing.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   └── Modal.jsx
│   │   ├── index.css
│   │   └── ...
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── .env.example
└── README.md
```

## Database

The app uses SQLite with `better-sqlite3` for zero-config data storage. The database is automatically created and seeded on first run at `backend/onboarding.db`.

### Tables

- **templates** - Onboarding template definitions
- **template_tasks** - Tasks within templates
- **employees** - New hire records
- **employee_tasks** - Per-employee task assignments

## API Endpoints

### Templates
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create template
- `GET /api/templates/:id` - Get template with tasks
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/:id/tasks` - Add task
- `PUT /api/templates/:id/tasks/:taskId` - Update task
- `DELETE /api/templates/:id/tasks/:taskId` - Delete task

### Employees
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Tasks
- `GET /api/tasks/employee/:employeeId` - Get employee tasks
- `PATCH /api/tasks/employee/:employeeId/task/:taskId` - Update task status/notes

### Analytics
- `GET /api/analytics/overview` - KPI summary
- `GET /api/analytics/completion` - Department completion rates
- `GET /api/analytics/timeline` - Task completions over time
- `GET /api/analytics/employees` - Employee progress table
- `GET /api/analytics/categories` - Category completion rates

### AI (Optional)
- `GET /api/ai` - Check if AI is enabled
- `POST /api/ai/welcome-message` - Generate welcome message
- `POST /api/ai/task-summary` - Generate progress summary

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | SQLite via `better-sqlite3` |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP Client | Axios |
| Routing | React Router v6 |
| AI (Optional) | Anthropic SDK |

## Design System

**Colors:**
- Primary: `#6366f1` (Indigo)
- Success: `#22c55e` (Green)
- Warning: `#f59e0b` (Amber)
- Danger: `#ef4444` (Red)
- Background: `#f8fafc` (Slate-50)

**Components:**
- Cards with rounded corners and subtle shadows
- Progress rings with animated SVG strokes
- Expandable task cards with inline editing
- Responsive grid layouts
- Dark/light status badges

## Development

### Backend Development
```bash
cd backend
npm run dev  # Runs with nodemon
```

### Frontend Development
```bash
cd frontend
npm run dev  # Runs Vite dev server
```

### Build Frontend for Production
```bash
cd frontend
npm run build
```

## No External Dependencies

This application requires:
- Node.js 16+
- npm or yarn

No Docker, no additional services, no complex setup. Just `npm install` and `npm run dev`.

## Troubleshooting

**Port already in use:**
- Change `PORT` in backend or Vite port in frontend config
- Or kill the process using the port

**Database locked:**
- Close all instances of the app
- Delete `backend/onboarding.db` to reset

**API calls failing:**
- Ensure backend is running on `http://localhost:3001`
- Check Vite proxy config in `frontend/vite.config.js`

## License

Built for Ekfrazo Technologies - AI & Data Engineering Consultancy
