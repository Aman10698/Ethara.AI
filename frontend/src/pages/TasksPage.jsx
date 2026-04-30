import { useEffect, useState } from 'react';

import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';

const TasksPage = () => {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [view, setView] = useState('board');
  const [filters, setFilters] = useState({ search: '', priority: '', status: '' });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.status) params.append('status', filters.status);

      const { data } = await api.get(`/tasks?${params}`);
      console.log('tasks loaded:', data.tasks.length);
      setTasks(data.tasks);
    } catch (err) {
      console.log('error loading tasks:', err.message);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [filters.priority, filters.status]);
  useEffect(() => {
    const t = setTimeout(fetchTasks, 380);
    return () => clearTimeout(t);
  }, [filters.search]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleSaved = () => { setShowModal(false); setEditTask(null); fetchTasks(); };

  const stats = {
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
  };

  const PRIORITY_COLORS = { low: '#16A34A', medium: '#D97706', high: '#DC2626', critical: '#7C3AED' };

  return (
    <div className="slide-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Manage and track all tasks across projects</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }}>
              + New Task
            </button>
          )}
          <button className="btn btn-outline">
            Filter
          </button>
        </div>
      </div>

      {/* Board / List toggle + filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* View toggle */}
        <div style={{ display: 'flex', background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 2 }}>
          <button onClick={() => setView('board')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
              background: view === 'board' ? 'var(--primary)' : 'transparent',
              color: view === 'board' ? 'white' : 'var(--text-secondary)' }}>
            Board
          </button>
          <button onClick={() => setView('list')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
              background: view === 'list' ? 'var(--primary)' : 'transparent',
              color: view === 'list' ? 'white' : 'var(--text-secondary)' }}>
            List
          </button>
        </div>

        {/* Search */}
        <div className="search-bar" style={{ maxWidth: 260 }}>
          <input placeholder="Search tasks..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
        </div>

        {/* Priority filter */}
        <select className="form-input" style={{ width: 140 }}
          value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        {/* Status filter */}
        <select className="form-input" style={{ width: 140 }}
          value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>

        {(filters.search || filters.priority || filters.status) && (
          <button className="btn btn-outline btn-sm"
            onClick={() => setFilters({ search: '', priority: '', status: '' })}>
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <div className="spinner" style={{ width: 36, height: 36 }} />
        </div>
      ) : view === 'board' ? (
        <KanbanBoard
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onEditTask={t => { setEditTask(t); setShowModal(true); }}
          onDeleteTask={handleDelete}
          isAdmin={isAdmin}
          onAddTask={() => { setEditTask(null); setShowModal(true); }}
        />
      ) : (
        /* List view */
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No tasks found</td></tr>
              ) : tasks.map(t => (
                <tr key={t._id} style={{ cursor: 'pointer' }}>
                  <td>
                    <p style={{ fontWeight: 600, fontSize: 13.5 }}>{t.title}</p>
                    {t.description && <p className="truncate" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, maxWidth: 240 }}>{t.description}</p>}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{t.project?.name || '—'}</td>
                  <td>
                    {t.assignedTo
                      ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
                            {t.assignedTo.name?.[0]}
                          </div>
                          <span style={{ fontSize: 13 }}>{t.assignedTo.name}</span>
                        </div>
                      : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Unassigned</span>
                    }
                  </td>
                  <td>
                    <span className="badge" style={{ background: `${PRIORITY_COLORS[t.priority]}18`, color: PRIORITY_COLORS[t.priority], textTransform: 'capitalize' }}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${t.status}`} style={{ textTransform: 'capitalize' }}>
                      {t.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {t.deadline ? new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <TaskModal task={editTask} onClose={() => { setShowModal(false); setEditTask(null); }} onSaved={handleSaved} />
      )}
    </div>
  );
};

export default TasksPage;
