import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">TaskTracker</Link>
      </div>
      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/projects">Projects</Link>
        <span className="navbar-user">
          {user?.name} <span className="role-badge">{user?.role}</span>
        </span>
        <button onClick={handleLogout} className="btn btn-sm btn-outline">Logout</button>
      </div>
    </nav>
  );
}
