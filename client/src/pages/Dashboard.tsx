import { useState, useEffect } from 'react';
import { getDashboard, DashboardData, TaskStatusCounts } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import TaskStatusBadge from '../components/TaskStatusBadge';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page">Loading…</div>;
  if (error) return <div className="page"><p className="error-msg">{error}</p></div>;
  if (!data) return null;

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Welcome back, {user?.name}</p>

      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>My Tasks by Status</h2>
      <StatusCountCards counts={data.task_counts} />

      {data.admin_project_counts && (
        <>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '28px 0 12px' }}>
            All Tasks in My Projects
          </h2>
          <StatusCountCards counts={data.admin_project_counts} />
        </>
      )}

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '28px 0 12px' }}>Overdue Tasks</h2>
      {data.overdue_tasks.length === 0 ? (
        <div className="card">
          <p style={{ color: '#6b7280' }}>No overdue tasks.</p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.overdue_tasks.map((task) => (
                <tr key={task.id}>
                  <td style={{ fontWeight: 500 }}>{task.title}</td>
                  <td style={{ color: '#dc2626' }}>{task.due_date}</td>
                  <td>
                    <TaskStatusBadge status={task.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusCountCards({ counts }: { counts: TaskStatusCounts }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 8 }}>
      <CountCard label="To Do" value={counts.todo} color="#6b7280" />
      <CountCard label="In Progress" value={counts.in_progress} color="#2563eb" />
      <CountCard label="Done" value={counts.done} color="#16a34a" />
    </div>
  );
}

function CountCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{label}</div>
    </div>
  );
}
