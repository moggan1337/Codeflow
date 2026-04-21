import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

interface ProjectSettingsProps {}

export const ProjectSettings: React.FC<ProjectSettingsProps> = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [project, setProject] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [members, setMembers] = useState<any[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('editor');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchMembers();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
        setName(data.project.name);
        setDescription(data.project.description || '');
        setVisibility(data.project.visibility);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, visibility }),
      });

      if (response.ok) {
        alert('Settings saved successfully');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
      });

      if (response.ok) {
        setNewMemberEmail('');
        fetchMembers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add member');
      }
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMembers(members.filter(m => m.id !== userId));
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const deleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Project Settings</h1>
        </header>
        <main className="dashboard-content">
          <div className="empty-state">
            <div className="spinner" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/project/${projectId}`)}>
            ← Back to Editor
          </button>
          <h1>Project Settings</h1>
        </div>
      </header>

      <main className="dashboard-content">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>General</h2>
            <div className="auth-card">
              <form onSubmit={saveSettings}>
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Project description"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Visibility</label>
                  <select
                    className="form-input"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                  >
                    <option value="private">Private</option>
                    <option value="team">Team</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Team Members</h2>
            <div className="auth-card">
              <div style={{ marginBottom: '1.5rem' }}>
                {members.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0',
                      borderBottom: '1px solid var(--color-border-light)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        className="comment-avatar"
                        style={{ background: member.avatar_url ? `url(${member.avatar_url})` : 'var(--color-primary)' }}
                      >
                        {!member.avatar_url && member.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{member.username}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {member.role}
                      </span>
                      {member.id !== project?.owner_id && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => removeMember(member.id)}
                          style={{ color: 'var(--color-error)' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={addMember} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="email"
                  className="form-input"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="member@example.com"
                  required
                  style={{ flex: 1 }}
                />
                <select
                  className="form-input"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  style={{ width: '120px' }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn btn-primary">
                  Add
                </button>
              </form>
            </div>
          </section>

          <section>
            <h2 style={{ marginBottom: '1rem', color: 'var(--color-error)' }}>Danger Zone</h2>
            <div
              className="auth-card"
              style={{ borderColor: 'var(--color-error)', background: 'rgba(239, 68, 68, 0.05)' }}
            >
              <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                Once you delete a project, there is no going back. Please be certain.
              </p>
              <button className="btn" style={{ background: 'var(--color-error)', color: 'white' }} onClick={deleteProject}>
                Delete Project
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
