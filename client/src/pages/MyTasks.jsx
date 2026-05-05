import { useState, useEffect } from 'react';
import { dashboardAPI } from '../api';
import { CheckCircle, Circle, Clock, AlertTriangle } from 'lucide-react';
import './MyTasks.css';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dashboardAPI.get()
      .then((res) => setTasks(res.data.data.myTasks || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  if (loading) {
    return (
      <div className="my-tasks-page">
        <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 24 }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 8 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="my-tasks-page">
      <div className="page-header">
        <div>
          <h1>My Tasks</h1>
          <p className="text-secondary">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="task-tabs animate-fadeInUp">
        {[
          { value: 'all', label: 'All' },
          { value: 'TODO', label: 'To Do' },
          { value: 'IN_PROGRESS', label: 'In Progress' },
          { value: 'DONE', label: 'Done' },
        ].map((tab) => (
          <button
            key={tab.value}
            className={`tab-btn ${filter === tab.value ? 'active' : ''}`}
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className="tab-count">
                {tasks.filter((t) => t.status === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filtered.length > 0 ? (
        <div className="my-full-task-list stagger-children">
          {filtered.map((task) => (
            <div key={task.id} className={`my-full-task card task-priority-${task.priority}`}>
              <div className="my-task-left">
                {task.status === 'DONE'
                  ? <CheckCircle size={20} className="text-green" />
                  : task.status === 'IN_PROGRESS'
                    ? <Clock size={20} className="text-amber" />
                    : <Circle size={20} className="text-muted-icon" />
                }
                <div className="my-task-info">
                  <span className={`my-task-title ${task.status === 'DONE' ? 'task-done' : ''}`}>
                    {task.title}
                  </span>
                  <span className="text-muted">{task.project?.name}</span>
                </div>
              </div>
              <div className="my-task-right">
                <span className={`badge badge-${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className={`text-muted ${isOverdue(task) ? 'text-overdue' : ''}`}>
                    {task.status !== 'DONE' && isOverdue(task) && <AlertTriangle size={12} />}
                    {formatDate(task.dueDate)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state animate-fadeInUp">
          <CheckCircle size={40} className="empty-icon" />
          <h3>No tasks here</h3>
          <p className="text-secondary">
            {filter === 'all' ? 'No tasks assigned to you yet' : `No ${filter.replace('_', ' ').toLowerCase()} tasks`}
          </p>
        </div>
      )}
    </div>
  );
}

function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function getPriorityColor(p) { return p === 'HIGH' ? 'red' : p === 'MEDIUM' ? 'amber' : 'green'; }
function isOverdue(t) { return t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date(); }
