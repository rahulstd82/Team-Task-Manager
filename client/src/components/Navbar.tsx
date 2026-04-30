import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav>
      <span className="nav-brand">Team Task Manager</span>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/projects">Projects</Link>
      <span style={{ color: '#94a3b8', fontSize: 13 }}>{user?.name}</span>
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
}
