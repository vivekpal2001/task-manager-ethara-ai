import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="skeleton" style={{ height: 100, borderRadius: 20, marginBottom: 28 }} />
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 18 }} />
          ))}
        </div>
        <div className="dashboard-grid" style={{ marginTop: 28 }}>
          <div className="skeleton" style={{ height: 200, borderRadius: 18 }} />
          <div className="skeleton" style={{ height: 200, borderRadius: 18 }} />
        </div>
      </div>
    );
  }

  const stats = data?.stats || { TODO: 0, IN_PROGRESS: 0, DONE: 0, total: 0 };
  const completionRate = stats.total > 0 ? Math.round((stats.DONE / stats.total) * 100) : 0;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="dashboard">
      {/* ── Greeting Card ─────────────────────────────────── */}
      <div className="dashboard-greeting animate-fadeInUp">
        <div className="greeting-card">
          <div className="greeting-text">
            <h1>Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
            <p>Here's what's happening across your projects</p>
          </div>
          <div className="greeting-date">
            <Calendar size={16} />
            {today}
          </div>
        </div>
      </div>

      {/* ── Stats Cards ───────────────────────────────────── */}
      <div className="stats-grid stagger-children">
        <div className="stat-card stat-card-purple">
          <div className="stat-icon stat-icon-purple">
            <FolderKanban size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data?.projectCount || 0}</span>
            <span className="stat-label">Projects</span>
          </div>
        </div>

        <div className="stat-card stat-card-amber">
          <div className="stat-icon stat-icon-amber">
            <CheckSquare size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-icon stat-icon-green">
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{completionRate}%</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        <div className="stat-card stat-card-red">
          <div className="stat-icon stat-icon-red">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data?.overdueCount || 0}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>
      </div>

      {/* ── Progress + Overdue Grid ───────────────────────── */}
      <div className="dashboard-grid">
        {/* Progress Breakdown */}
        <div className="section-card animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          <div className="section-header">
            <h3>
              <span className="section-header-icon purple"><BarChart3 size={15} /></span>
              Task Breakdown
            </h3>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {stats.total} total
            </span>
          </div>

          <div className="progress-bar-wrapper">
            <div className="progress-bar">
              {stats.total > 0 && (
                <>
                  <div className="progress-segment progress-done"
                    style={{ width: `${(stats.DONE / stats.total) * 100}%` }} />
                  <div className="progress-segment progress-in-progress"
                    style={{ width: `${(stats.IN_PROGRESS / stats.total) * 100}%` }} />
                  <div className="progress-segment progress-todo"
                    style={{ width: `${(stats.TODO / stats.total) * 100}%` }} />
                </>
              )}
            </div>
          </div>

          <div className="progress-legend">
            <span className="legend-item">
              <span className="legend-dot done" />
              Done <span className="legend-value">{stats.DONE}</span>
            </span>
            <span className="legend-item">
              <span className="legend-dot in-progress" />
              In Progress <span className="legend-value">{stats.IN_PROGRESS}</span>
            </span>
            <span className="legend-item">
              <span className="legend-dot todo" />
              To Do <span className="legend-value">{stats.TODO}</span>
            </span>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="section-card animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          <div className="section-header">
            <h3>
              <span className="section-header-icon red"><AlertTriangle size={15} /></span>
              Overdue
            </h3>
            <span className="badge badge-red" style={{ fontSize: 11 }}>
              {data?.overdueCount || 0}
            </span>
          </div>

          {data?.overdueTasks?.length > 0 ? (
            <div className="task-list-items">
              {data.overdueTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="task-list-item overdue">
                  <div className="task-item-left">
                    <span className={`priority-dot priority-${task.priority}`} />
                    <span className="task-item-title">{task.title}</span>
                  </div>
                  <div className="task-item-right">
                    <span className="task-due overdue-text">
                      <Clock size={12} />
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <CheckCircle size={32} className="empty-icon" />
              <p>No overdue tasks — great job! 🎉</p>
            </div>
          )}
        </div>
      </div>

      {/* ── My Tasks ──────────────────────────────────────── */}
      <div className="my-tasks-section animate-fadeInUp" style={{ animationDelay: '400ms' }}>
        <div className="section-card">
          <div className="section-header">
            <h3>
              <span className="section-header-icon green"><CheckSquare size={15} /></span>
              My Tasks
            </h3>
            <Link to="/my-tasks" className="view-all-link">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {data?.myTasks?.length > 0 ? (
            <div className="task-list-items stagger-children">
              {data.myTasks.slice(0, 6).map((task) => (
                <div key={task.id} className="task-list-item">
                  <div className="task-item-left">
                    {task.status === 'DONE'
                      ? <CheckCircle size={18} className="text-green" />
                      : task.status === 'IN_PROGRESS'
                        ? <Clock size={18} className="text-amber" />
                        : <Circle size={18} className="text-muted-icon" />
                    }
                    <span className={`task-item-title ${task.status === 'DONE' ? 'task-done-title' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                  <div className="task-item-right">
                    <span className={`badge badge-${getStatusColor(task.status)}`}>
                      {formatStatus(task.status)}
                    </span>
                    <span className="task-project-tag">{task.project?.name}</span>
                    {task.dueDate && (
                      <span className={`task-due ${isOverdue(task) ? 'overdue-text' : ''}`}>
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <CheckSquare size={36} className="empty-icon" />
              <h3>No tasks assigned yet</h3>
              <p>Tasks assigned to you will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatStatus(status) {
  return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusColor(status) {
  if (status === 'DONE') return 'green';
  if (status === 'IN_PROGRESS') return 'amber';
  return 'gray';
}

function isOverdue(t) {
  return t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date();
}
