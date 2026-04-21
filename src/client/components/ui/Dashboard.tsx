import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

interface Project {
  id: string;
  name: string;
  description?: string;
  visibility: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const navigate = useNavigate();

  const { user, token, logout } = useAuthStore();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects([data.project, ...projects]);
        setShowModal(false);
        setNewProjectName('');
        setNewProjectDesc('');
        navigate(`/project/${data.project.id}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {user?.username}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(true)}>
            New Project
          </button>
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {isLoading ? (
          <div className="empty-state">
            <div className="spinner" />
            <h3>Loading projects...</h3>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            <h3>No projects yet</h3>
            <p>Create your first project to start collaborating</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <Link key={project.id} to={`/project/${project.id}`} style={{ textDecoration: 'none' }}>
                <div className="project-card">
                  <h3>{project.name}</h3>
                  <p>{project.description || 'No description'}</p>
                  <div className="project-meta">
                    <span>{project.visibility}</span>
                    <span>•</span>
                    <span>Updated {formatDate(project.updatedAt)}</span>
                    {project.memberCount !== undefined && project.memberCount > 0 && (
                      <>
                        <span>•</span>
                        <span>{project.memberCount} member{project.memberCount !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Project</h2>
            <form onSubmit={createProject}>
              <div className="form-group">
                <label className="form-label" htmlFor="projectName">Project Name</label>
                <input
                  type="text"
                  id="projectName"
                  className="form-input"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="projectDesc">Description (optional)</label>
                <input
                  type="text"
                  id="projectDesc"
                  className="form-input"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="A brief description of your project"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
