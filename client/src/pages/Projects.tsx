import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  Project,
} from '../api/projects';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      const data = await listProjects();
      setProjects(data);
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const project = await createProject(createName, createDesc || undefined);
      setProjects((prev) => [project, ...prev]);
      setCreateName('');
      setCreateDesc('');
      setShowCreate(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setCreateError(err.response?.data?.error ?? 'Failed to create project');
      } else {
        setCreateError('An unexpected error occurred');
      }
    } finally {
      setCreating(false);
    }
  }

  function startEdit(project: Project) {
    setEditingId(project.id);
    setEditName(project.name);
    setEditDesc(project.description ?? '');
    setEditError('');
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditError('');
    setSaving(true);
    try {
      const updated = await updateProject(editingId, editName, editDesc || undefined);
      setProjects((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      setEditingId(null);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setEditError(err.response?.data?.error ?? 'Failed to update project');
      } else {
        setEditError('An unexpected error occurred');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert('Failed to delete project');
    }
  }

  if (loading) return <div className="page">Loading…</div>;
  if (error) return <div className="page"><p className="error-msg">{error}</p></div>;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0, flex: 1 }}>Projects</h1>
        <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>New Project</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label htmlFor="create-name">Name</label>
              <input
                id="create-name"
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                maxLength={200}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="create-desc">Description (optional)</label>
              <textarea
                id="create-desc"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                rows={2}
              />
            </div>
            {createError && <p className="error-msg">{createError}</p>}
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="card">
          <p style={{ color: '#6b7280' }}>No projects yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  {editingId === project.id ? (
                    <td colSpan={3}>
                      <form onSubmit={handleEdit} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          maxLength={200}
                          required
                          style={{ flex: '1 1 160px' }}
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Description"
                          style={{ flex: '2 1 200px' }}
                        />
                        {editError && <p className="error-msg" style={{ width: '100%' }}>{editError}</p>}
                        <div className="actions">
                          <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td>
                        <Link to={`/projects/${project.id}`} style={{ color: '#2563eb', fontWeight: 500 }}>
                          {project.name}
                        </Link>
                      </td>
                      <td style={{ color: '#6b7280' }}>{project.description ?? '—'}</td>
                      <td>
                        <div className="actions">
                          <Link to={`/projects/${project.id}`} className="btn-primary" style={{ textDecoration: 'none', fontSize: 13 }}>
                            Open
                          </Link>
                          {project.owner_id === user?.id && (
                            <>
                              <button className="btn-secondary" onClick={() => startEdit(project)}>
                                Edit
                              </button>
                              <button className="btn-danger" onClick={() => handleDelete(project.id)}>
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
