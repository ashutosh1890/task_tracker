import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const STATUS_OPTIONS = ['todo', 'inprogress', 'done'];
const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', assignedTo: '' });
  const [taskError, setTaskError] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({ email: '', role: 'member' });
  const [memberError, setMemberError] = useState('');
  const [submittingMember, setSubmittingMember] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchAll = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/api/projects/${id}`),
        api.get(`/api/tasks/project/${id}`)
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleCreateTask = async e => {
    e.preventDefault();
    setTaskError('');
    setSubmittingTask(true);
    try {
      await api.post('/api/tasks', { ...taskForm, project: id });
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', assignedTo: '' });
      fetchAll();
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteTask = async taskId => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleAddMember = async e => {
    e.preventDefault();
    setMemberError('');
    setSubmittingMember(true);
    try {
      await api.post(`/api/projects/${id}/members`, memberForm);
      setShowMemberModal(false);
      setMemberForm({ email: '', role: 'member' });
      fetchAll();
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleRemoveMember = async memberId => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/api/projects/${id}/members/${memberId}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/api/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const isOverdue = task =>
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const priorityClass = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };

  if (loading) return <><Navbar /><div className="page-loading">Loading...</div></>;
  if (error) return <><Navbar /><div className="page-container"><div className="alert alert-error">{error}</div></div></>;

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    inprogress: tasks.filter(t => t.status === 'inprogress'),
    done: tasks.filter(t => t.status === 'done')
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="section-header">
          <div>
            <h1>{project.name}</h1>
            {project.description && <p className="text-muted">{project.description}</p>}
          </div>
          <div className="btn-group">
            {isAdmin && (
              <>
                <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
                  + Add Task
                </button>
                <button className="btn btn-outline" onClick={() => setShowMemberModal(true)}>
                  + Add Member
                </button>
                <button className="btn btn-danger" onClick={handleDeleteProject}>
                  Delete Project
                </button>
              </>
            )}
          </div>
        </div>

        {/* Members */}
        <div className="members-section">
          <h3>Team Members ({project.members?.length || 0})</h3>
          <div className="members-list">
            {project.members?.map(m => (
              <div key={m.user._id} className="member-chip">
                <span>{m.user.name}</span>
                <span className="role-badge">{m.role}</span>
                {isAdmin && m.user._id !== user.id && (
                  <button
                    className="member-remove"
                    onClick={() => handleRemoveMember(m.user._id)}
                    title="Remove member"
                  >✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Task Board */}
        <div className="board">
          {STATUS_OPTIONS.map(status => (
            <div key={status} className="board-column">
              <div className={`board-column-header board-${status}`}>
                {STATUS_LABELS[status]} ({tasksByStatus[status].length})
              </div>
              <div className="board-column-body">
                {tasksByStatus[status].length === 0 ? (
                  <div className="board-empty">No tasks</div>
                ) : (
                  tasksByStatus[status].map(task => (
                    <div key={task._id} className={`task-card ${isOverdue(task) ? 'task-overdue' : ''}`}>
                      <div className="task-card-header">
                        <span className="task-title">{task.title}</span>
                        <span className={`badge ${priorityClass[task.priority]}`}>{task.priority}</span>
                      </div>
                      {task.description && <p className="task-desc">{task.description}</p>}
                      <div className="task-meta">
                        {task.assignedTo && (
                          <span className="task-assignee">👤 {task.assignedTo.name}</span>
                        )}
                        {task.dueDate && (
                          <span className={isOverdue(task) ? 'overdue-text' : 'due-date'}>
                            📅 {new Date(task.dueDate).toLocaleDateString()}
                            {isOverdue(task) && ' — Overdue'}
                          </span>
                        )}
                      </div>
                      <div className="task-actions">
                        <select
                          value={task.status}
                          onChange={e => handleStatusChange(task._id, e.target.value)}
                          className="status-select"
                          disabled={!isAdmin && task.assignedTo?._id !== user.id}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                        {isAdmin && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteTask(task._id)}
                          >Delete</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Task</h3>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            {taskError && <div className="alert alert-error">{taskError}</div>}
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  placeholder="Task details..."
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date (optional)</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Assign To (User ID, optional)</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  >
                    <option value="">— Unassigned —</option>
                    {project.members?.map(m => (
                      <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submittingTask}>
                  {submittingTask ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Member</h3>
              <button className="modal-close" onClick={() => setShowMemberModal(false)}>✕</button>
            </div>
            {memberError && <div className="alert alert-error">{memberError}</div>}
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>User Email</label>
                <input
                  type="email"
                  placeholder="member@example.com"
                  value={memberForm.email}
                  onChange={e => setMemberForm({ ...memberForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Project Role</label>
                <select
                  value={memberForm.role}
                  onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submittingMember}>
                  {submittingMember ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
