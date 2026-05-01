import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          api.get('/api/tasks/stats'),
          api.get('/api/tasks/my')
        ]);
        setStats(statsRes.data);
        setMyTasks(tasksRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isOverdue = task =>
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const statusLabel = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
  const priorityClass = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };

  if (loading) return <><Navbar /><div className="page-loading">Loading...</div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h1>Welcome back, {user?.name} 👋</h1>
        <p className="text-muted">Here's your task overview</p>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
            <div className="stat-card stat-todo">
              <div className="stat-number">{stats.todo}</div>
              <div className="stat-label">To Do</div>
            </div>
            <div className="stat-card stat-inprogress">
              <div className="stat-number">{stats.inprogress}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card stat-done">
              <div className="stat-number">{stats.done}</div>
              <div className="stat-label">Done</div>
            </div>
            <div className="stat-card stat-overdue">
              <div className="stat-number">{stats.overdue}</div>
              <div className="stat-label">Overdue</div>
            </div>
          </div>
        )}

        <div className="section-header">
          <h2>My Assigned Tasks</h2>
        </div>

        {myTasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks assigned to you yet.</p>
            {user?.role === 'admin' && (
              <Link to="/projects" className="btn btn-primary">Go to Projects</Link>
            )}
          </div>
        ) : (
          <div className="task-list">
            {myTasks.map(task => (
              <div key={task._id} className={`task-card ${isOverdue(task) ? 'task-overdue' : ''}`}>
                <div className="task-card-header">
                  <span className="task-title">{task.title}</span>
                  <span className={`badge ${priorityClass[task.priority]}`}>{task.priority}</span>
                </div>
                <div className="task-meta">
                  <span className={`status-pill status-${task.status}`}>
                    {statusLabel[task.status]}
                  </span>
                  {task.project && (
                    <Link to={`/projects/${task.project._id}`} className="task-project-link">
                      📁 {task.project.name}
                    </Link>
                  )}
                  {task.dueDate && (
                    <span className={`due-date ${isOverdue(task) ? 'overdue-text' : ''}`}>
                      📅 {new Date(task.dueDate).toLocaleDateString()}
                      {isOverdue(task) && ' — Overdue'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
