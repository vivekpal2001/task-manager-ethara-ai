import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import {
  ArrowLeft,
  Plus,
  Users,
  UserPlus,
  Trash2,
  Edit3,
  CheckCircle,
  Circle,
  Clock,
  Filter,
} from 'lucide-react';
import './ProjectDetail.css';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [taskStats, setTaskStats] = useState({});
  const [loading, setLoading] = useState(true);

  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState(null);

  const isAdmin = project?.ownerId === user?.id ||
    members.some(m => m.userId === user?.id && m.role === 'ADMIN');

  const fetchData = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        projectAPI.getOne(projectId),
        taskAPI.getAll(projectId, statusFilter ? { status: statusFilter } : {}),
      ]);
      setProject(projRes.data.data.project);
      setTaskStats(projRes.data.data.taskStats);
      setTasks(taskRes.data.data.tasks);
      setMembers(projRes.data.data.project.members || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 || err.response?.status === 404) {
        navigate('/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [projectId, statusFilter]);

  // ── Task Handlers ────────────────────────────────────────
  const handleCreateTask = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = {
      title: form.get('title'),
      description: form.get('description') || undefined,
      priority: form.get('priority'),
      status: form.get('status') || 'TODO',
    };
    const assigneeId = form.get('assigneeId');
    if (assigneeId) data.assigneeId = assigneeId;
    const dueDate = form.get('dueDate');
    if (dueDate) data.dueDate = new Date(dueDate).toISOString();

    try {
      await taskAPI.create(projectId, data);
      setShowAddTask(false);
      setToast({ message: 'Task created!', type: 'success' });
      fetchData();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to create task', type: 'error' });
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = {};
    const title = form.get('title');
    const description = form.get('description');
    const priority = form.get('priority');
    const status = form.get('status');
    const assigneeId = form.get('assigneeId');
    const dueDate = form.get('dueDate');

    if (title) data.title = title;
    if (description !== null) data.description = description;
    if (priority) data.priority = priority;
    if (status) data.status = status;
    if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
    if (dueDate) data.dueDate = new Date(dueDate).toISOString();

    try {
      await taskAPI.update(projectId, editingTask.id, data);
      setEditingTask(null);
      setToast({ message: 'Task updated!', type: 'success' });
      fetchData();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update', type: 'error' });
    }
  };

  const handleStatusToggle = async (task) => {
    const nextStatus = task.status === 'TODO' ? 'IN_PROGRESS'
      : task.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
    try {
      await taskAPI.update(projectId, task.id, { status: nextStatus });
      fetchData();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Cannot update', type: 'error' });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(projectId, taskId);
      setToast({ message: 'Task deleted', type: 'success' });
      fetchData();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete', type: 'error' });
    }
  };

  // ── Member Handlers ──────────────────────────────────────
  const handleAddMember = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      await projectAPI.addMember(projectId, {
        email: form.get('email'),
        role: form.get('role') || 'MEMBER',
      });
      setShowAddMember(false);
      setToast({ message: 'Member added!', type: 'success' });
      fetchData();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to add member', type: 'error' });
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await projectAPI.removeMember(projectId, userId);
      setToast({ message: 'Member removed', type: 'success' });
      fetchData();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to remove', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="project-detail">
        <div className="skeleton" style={{ height: 40, width: 300, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
      </div>
    );
  }

  if (!project) return null;

  const totalTasks = (taskStats.TODO || 0) + (taskStats.IN_PROGRESS || 0) + (taskStats.DONE || 0);

  return (
    <div className="project-detail">
      {/* Header */}
      <div className="detail-header animate-fadeInUp">
        <div className="detail-back">
          <button className="btn btn-ghost" onClick={() => navigate('/projects')}>
            <ArrowLeft size={18} /> Projects
          </button>
        </div>
        <div className="detail-title-row">
          <div>
            <h1>{project.name}</h1>
            {project.description && <p className="text-secondary">{project.description}</p>}
          </div>
          <div className="detail-actions">
            {isAdmin && (
              <>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}>
                  <UserPlus size={16} /> Add Member
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddTask(true)}>
                  <Plus size={16} /> Add Task
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mini Progress */}
      <div className="detail-stats animate-fadeInUp" style={{ animationDelay: '100ms' }}>
        <div className="mini-progress">
          <div className="mini-progress-bar">
            {totalTasks > 0 && (
              <>
                <div className="progress-segment progress-done" style={{ width: `${((taskStats.DONE || 0) / totalTasks) * 100}%` }} />
                <div className="progress-segment progress-in-progress" style={{ width: `${((taskStats.IN_PROGRESS || 0) / totalTasks) * 100}%` }} />
              </>
            )}
          </div>
          <span className="mini-progress-text">
            {taskStats.DONE || 0}/{totalTasks} done
          </span>
        </div>

        <div className="detail-members-preview">
          <Users size={14} />
          <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="detail-content">
        {/* Tasks Column */}
        <div className="tasks-column animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          <div className="tasks-header">
            <h3>Tasks ({tasks.length})</h3>
            <div className="filter-bar">
              <Filter size={14} />
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>

          {tasks.length > 0 ? (
            <div className="task-list stagger-children">
              {tasks.map((task) => (
                <div key={task.id} className={`task-card card task-priority-${task.priority}`}>
                  <div className="task-card-top">
                    <button
                      className="task-status-btn"
                      onClick={() => handleStatusToggle(task)}
                      title="Cycle status"
                    >
                      {task.status === 'DONE'
                        ? <CheckCircle size={20} className="text-green" />
                        : task.status === 'IN_PROGRESS'
                          ? <Clock size={20} className="text-amber" />
                          : <Circle size={20} className="text-muted-icon" />
                      }
                    </button>
                    <div className="task-card-info">
                      <span className={`task-title ${task.status === 'DONE' ? 'task-done' : ''}`}>
                        {task.title}
                      </span>
                      {task.description && (
                        <span className="task-description truncate">{task.description}</span>
                      )}
                    </div>
                    <div className="task-card-actions">
                      {(isAdmin || task.assigneeId === user?.id) && (
                        <button className="btn-icon btn-ghost" onClick={() => setEditingTask(task)}>
                          <Edit3 size={14} />
                        </button>
                      )}
                      {isAdmin && (
                        <button className="btn-icon btn-ghost" onClick={() => handleDeleteTask(task.id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="task-card-bottom">
                    <div className="task-tags">
                      <span className={`badge badge-${getStatusColor(task.status)}`}>
                        {formatStatus(task.status)}
                      </span>
                      <span className={`badge badge-${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="task-card-meta">
                      {task.assignee && (
                        <span className="task-assignee">
                          <span className="mini-avatar">{task.assignee.name.charAt(0)}</span>
                          {task.assignee.name.split(' ')[0]}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={`text-muted ${isOverdue(task) ? 'text-overdue' : ''}`}>
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <CheckCircle size={36} className="empty-icon" />
              <p>No tasks yet</p>
              {isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddTask(true)} style={{ marginTop: 12 }}>
                  <Plus size={16} /> Add first task
                </button>
              )}
            </div>
          )}
        </div>

        {/* Members Sidebar */}
        <div className="members-column animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          <h3>Team ({members.length})</h3>
          <div className="members-list">
            {/* Owner */}
            <div className="member-item">
              <div className="member-avatar owner-avatar">{project.owner?.name?.charAt(0)}</div>
              <div className="member-info">
                <span className="member-name">{project.owner?.name}</span>
                <span className="badge badge-purple">Owner</span>
              </div>
            </div>
            {/* Members */}
            {members
              .filter(m => m.userId !== project.ownerId)
              .map((m) => (
                <div key={m.id} className="member-item">
                  <div className="member-avatar">{m.user?.name?.charAt(0)}</div>
                  <div className="member-info">
                    <span className="member-name">{m.user?.name}</span>
                    <span className={`badge badge-${m.role === 'ADMIN' ? 'purple' : 'gray'}`}>
                      {m.role}
                    </span>
                  </div>
                  {isAdmin && m.userId !== user?.id && (
                    <button
                      className="btn-icon btn-ghost"
                      onClick={() => handleRemoveMember(m.userId)}
                      title="Remove member"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={showAddTask} onClose={() => setShowAddTask(false)} title="New Task" size="md">
        <form onSubmit={handleCreateTask} className="modal-form">
          <div className="input-group">
            <label className="input-label">Title *</label>
            <input name="title" className="input-field" placeholder="e.g. Design homepage layout" required />
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea name="description" className="input-field" rows={3} placeholder="Optional details..." />
          </div>
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">Priority</label>
              <select name="priority" className="input-field">
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Status</label>
              <select name="status" className="input-field">
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">Assign To</label>
              <select name="assigneeId" className="input-field">
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Due Date</label>
              <input name="dueDate" type="date" className="input-field" />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddTask(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Task</button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task" size="md">
        {editingTask && (
          <form onSubmit={handleUpdateTask} className="modal-form">
            <div className="input-group">
              <label className="input-label">Title</label>
              <input name="title" className="input-field" defaultValue={editingTask.title} />
            </div>
            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea name="description" className="input-field" rows={3} defaultValue={editingTask.description || ''} />
            </div>
            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Priority</label>
                <select name="priority" className="input-field" defaultValue={editingTask.priority}>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Status</label>
                <select name="status" className="input-field" defaultValue={editingTask.status}>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Assign To</label>
                <select name="assigneeId" className="input-field" defaultValue={editingTask.assigneeId || ''}>
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Due Date</label>
                <input name="dueDate" type="date" className="input-field"
                  defaultValue={editingTask.dueDate ? editingTask.dueDate.slice(0, 10) : ''} />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingTask(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Team Member" size="sm">
        <form onSubmit={handleAddMember} className="modal-form">
          <div className="input-group">
            <label className="input-label">Email *</label>
            <input name="email" type="email" className="input-field" placeholder="teammate@example.com" required />
          </div>
          <div className="input-group">
            <label className="input-label">Role</label>
            <select name="role" className="input-field">
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddMember(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Member</button>
          </div>
        </form>
      </Modal>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function formatStatus(s) { return s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function getStatusColor(s) { return s === 'DONE' ? 'green' : s === 'IN_PROGRESS' ? 'amber' : 'gray'; }
function getPriorityColor(p) { return p === 'HIGH' ? 'red' : p === 'MEDIUM' ? 'amber' : 'green'; }
function isOverdue(t) { return t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date(); }
