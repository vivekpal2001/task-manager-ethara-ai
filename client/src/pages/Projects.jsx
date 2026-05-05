import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import {
  Plus,
  FolderKanban,
  Users,
  CheckSquare,
  Calendar,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import './Projects.css';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const fetchProjects = () => {
    projectAPI.getAll()
      .then((res) => setProjects(res.data.data.projects))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = {
      name: form.get('name'),
      description: form.get('description'),
    };
    const deadline = form.get('deadline');
    if (deadline) data.deadline = new Date(deadline).toISOString();

    try {
      await projectAPI.create(data);
      setShowCreate(false);
      setToast({ message: 'Project created!', type: 'success' });
      fetchProjects();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to create', type: 'error' });
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this project? This will remove all tasks and members.')) return;
    try {
      await projectAPI.delete(id);
      setToast({ message: 'Project deleted', type: 'success' });
      fetchProjects();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="projects-page">
        <div className="page-header">
          <div className="skeleton" style={{ width: 200, height: 32 }} />
        </div>
        <div className="projects-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 180, borderRadius: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="text-secondary">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> New Project
        </button>
      </div>

      {projects.length > 0 ? (
        <div className="projects-grid stagger-children">
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card card"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="project-card-header">
                <div className="project-icon">
                  <FolderKanban size={20} />
                </div>
                <button
                  className="btn-icon btn-ghost"
                  onClick={(e) => handleDelete(project.id, e)}
                  title="Delete project"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 className="project-name">{project.name}</h3>
              {project.description && (
                <p className="project-desc truncate">{project.description}</p>
              )}

              <div className="project-meta">
                <span className="project-stat">
                  <Users size={14} />
                  {project._count?.members || 0}
                </span>
                <span className="project-stat">
                  <CheckSquare size={14} />
                  {project._count?.tasks || 0}
                </span>
                {project.deadline && (
                  <span className="project-stat">
                    <Calendar size={14} />
                    {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state animate-fadeInUp">
          <FolderKanban size={48} className="empty-icon" />
          <h3>No projects yet</h3>
          <p className="text-secondary">Create your first project to start organizing tasks</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: 16 }}>
            <Plus size={18} /> Create Project
          </button>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <form onSubmit={handleCreate} className="modal-form">
          <div className="input-group">
            <label className="input-label">Project Name *</label>
            <input name="name" className="input-field" placeholder="e.g. Marketing Website" required />
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea name="description" className="input-field" rows={3} placeholder="What's this project about?" />
          </div>
          <div className="input-group">
            <label className="input-label">Deadline</label>
            <input name="deadline" type="date" className="input-field" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Project</button>
          </div>
        </form>
      </Modal>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
