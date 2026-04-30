import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listProjects, listMembers, addMember, removeMember, findUserByEmail, Project, Member } from '../api/projects';
import { listTasks, createTask, updateTaskStatus, Task, TaskStatus } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import TaskStatusBadge from '../components/TaskStatusBadge';
import axios from 'axios';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    loadAll(id);
  }, [id]);

  async function loadAll(projectId: string) {
    try {
      setLoading(true);
      const [allProjects, memberList, taskList] = await Promise.all([
        listProjects(),
        listMembers(projectId),
        listTasks(projectId),
      ]);
      const found = allProjects.find((p) => p.id === projectId);
      if (!found) {
        setError('Project not found');
        return;
      }
      setProject(found);
      setMembers(memberList);
      setTasks(taskList);
    } catch {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="page">Loading…</div>;
  if (error) return <div className="page"><p className="error-msg">{error}</p></div>;
  if (!project) return null;

  // Computed after data is loaded — check owner_id AND membership role
  const isAdmin = project.owner_id === user?.id ||
    members.some((m) => m.user_id === user?.id && m.role === 'admin');

  return (
    <div className="page">
      <button
        className="btn-secondary"
        style={{ marginBottom: 16, fontSize: 13 }}
        onClick={() => navigate('/projects')}
      >
        ← Back to Projects
      </button>

      <h1 className="page-title">{project.name}</h1>
      {project.description && (
        <p style={{ color: '#6b7280', marginBottom: 24 }}>{project.description}</p>
      )}

      <MembersSection
        projectId={project.id}
        members={members}
        setMembers={setMembers}
        isAdmin={isAdmin}
      />

      <TasksSection
        projectId={project.id}
        tasks={tasks}
        setTasks={setTasks}
        members={members}
        isAdmin={isAdmin}
        currentUserId={user?.id ?? ''}
      />
    </div>
  );
}

// ─── Members Section ────────────────────────────────────────────────────────

interface MembersSectionProps {
  projectId: string;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  isAdmin: boolean;
}

function MembersSection({ projectId, members, setMembers, isAdmin }: MembersSectionProps) {
  const [addEmail, setAddEmail] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAddError('');
    setAdding(true);
    try {
      // Look up user by email first
      const foundUser = await findUserByEmail(addEmail.trim().toLowerCase());
      // Then add them to the project
      const membership = await addMember(projectId, foundUser.id);
      // Merge the user info into the membership for display
      setMembers((prev) => [...prev, { ...membership, name: foundUser.name, email: foundUser.email }]);
      setAddEmail('');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setAddError(err.response?.data?.error ?? 'Failed to add member');
      } else {
        setAddError('An unexpected error occurred');
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await removeMember(projectId, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch {
      alert('Failed to remove member');
    }
  }

  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Members</h2>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.user_id}>
                <td>{m.name}</td>
                <td style={{ color: '#6b7280' }}>{m.email}</td>
                <td>
                  <span className={`badge ${m.role === 'admin' ? 'badge-in_progress' : 'badge-todo'}`}>
                    {m.role}
                  </span>
                </td>
                {isAdmin && (
                  <td>
                    {m.role !== 'admin' && (
                      <button className="btn-danger" onClick={() => handleRemove(m.user_id)}>
                        Remove
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {isAdmin && (
          <form onSubmit={handleAdd} style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <input
              type="email"
              placeholder="Member's email address"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" disabled={adding}>
              {adding ? 'Adding…' : 'Add Member'}
            </button>
          </form>
        )}
        {addError && <p className="error-msg" style={{ marginTop: 8 }}>{addError}</p>}
      </div>
    </section>
  );
}

// ─── Tasks Section ───────────────────────────────────────────────────────────

interface TasksSectionProps {
  projectId: string;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  members: Member[];
  isAdmin: boolean;
  currentUserId: string;
}

function TasksSection({ projectId, tasks, setTasks, members, isAdmin, currentUserId }: TasksSectionProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const task = await createTask(projectId, {
        title: title.trim(),
        description: description || undefined,
        due_date: dueDate || undefined,
        assignee_id: assigneeId || undefined,
      });
      setTasks((prev) => [task, ...prev]);
      setTitle('');
      setDescription('');
      setDueDate('');
      setAssigneeId('');
      setShowCreate(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setCreateError(err.response?.data?.error ?? 'Failed to create task');
      } else {
        setCreateError('An unexpected error occurred');
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(task: Task, newStatus: TaskStatus) {
    try {
      const updated = await updateTaskStatus(projectId, task.id, newStatus);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch {
      alert('Failed to update task status');
    }
  }

  function canUpdateStatus(task: Task): boolean {
    if (isAdmin) return true;
    return task.assignee_id === currentUserId;
  }

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, flex: 1 }}>Tasks</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Cancel' : '+ New Task'}
          </button>
        )}
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label htmlFor="task-title">Title</label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={500}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="task-desc">Description (optional)</label>
              <textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="task-due">Due date (optional)</label>
                <input
                  id="task-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="task-assignee">Assignee (optional)</label>
                <select
                  id="task-assignee"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {createError && <p className="error-msg">{createError}</p>}
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create Task'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {tasks.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No tasks yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Assignee</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const assignee = members.find((m) => m.user_id === task.assignee_id);
                return (
                  <tr key={task.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{task.title}</div>
                      {task.description && (
                        <div style={{ color: '#6b7280', fontSize: 12 }}>{task.description}</div>
                      )}
                    </td>
                    <td style={{ color: '#6b7280' }}>{assignee?.name ?? '—'}</td>
                    <td style={{ color: '#6b7280' }}>{task.due_date ?? '—'}</td>
                    <td>
                      {canUpdateStatus(task) ? (
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                          style={{ width: 'auto' }}
                          aria-label={`Status for ${task.title}`}
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      ) : (
                        <TaskStatusBadge status={task.status} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
