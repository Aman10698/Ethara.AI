import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';
import KanbanBoard from '../components/KanbanBoard';
import ProjectModal from '../components/ProjectModal';

const AVATAR_COLORS = ['#4F6DF5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const getColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showMemberPanel, setShowMemberPanel] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  const fetchData = async () => {
    try {
      // fetch project and tasks at the same time
      let projRes = await api.get('/projects/' + id);
      let taskRes = await api.get('/tasks/project/' + id);

      setProject(projRes.data.project);
      setTasks(taskRes.data.tasks);

      console.log('project loaded:', projRes.data.project.name);
      console.log('tasks loaded:', taskRes.data.tasks.length);
    } catch (err) {
      console.log('error loading project:', err.message);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (isAdmin) {
      api.get('/users?role=member').then(({ data }) => setAllUsers(data.users)).catch(() => {});
    }
  }, [id]);

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    try {
      const { data } = await api.post(`/projects/${id}/members`, { userId: selectedUserId });
      setProject(data.project);
      setSelectedUserId('');
      toast.success('Member added');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const { data } = await api.delete(`/projects/${id}/members/${userId}`);
      setProject(data.project);
      toast.success('Member removed');
    } catch { toast.error('Failed to remove'); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
    } catch { toast.error('Failed to update'); }
  };

  const handleTaskDelete = async (taskId) => {
    if (!confirm('Delete task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch { toast.error('Failed'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  if (!project) return <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Project not found</div>;

  const pct = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0;
  const nonMembers = allUsers.filter(u => !project.members.some(m => m._id === u._id) && project.owner._id !== u._id);

  return (
    <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
        <Link to="/projects" style={{ textDecoration: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
          className="hover:text-blue-500">
          &laquo; Projects
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{project.name}</span>
      </div>

      {/* Project header */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: `${project.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${project.color}30`, flexShrink: 0 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: project.color }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{project.name}</h1>
              {project.description && <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{project.description}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {isAdmin && (
              <>
                <button className="btn btn-outline btn-sm" onClick={() => setShowMemberPanel(!showMemberPanel)}>
                  Members ({project.members.length + 1})
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setShowProjectModal(true)}>
                  Edit
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditTask(null); setShowTaskModal(true); }}>
                  + Add Task
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="progress-bar-wrap" style={{ flex: 1 }}>
            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: project.color }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', width: 40 }}>{pct}%</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tasks.filter(t => t.status === 'completed').length}/{tasks.length} tasks</span>
          {/* Member avatars */}
          <div style={{ display: 'flex' }}>
            {[project.owner, ...project.members].slice(0, 5).map((m, i) => (
              <div key={m._id} title={m.name}
                style={{ width: 26, height: 26, borderRadius: '50%', background: getColor(m.name), border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', marginLeft: i === 0 ? 0 : -6, zIndex: 5 - i }}>
                {m.name[0]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Member panel */}
      {showMemberPanel && isAdmin && (
        <div className="card" style={{ padding: '18px 22px' }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Team Members</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 20, background: 'var(--primary-light)', border: '1px solid #c7d2fe' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white' }}>
                {project.owner.name[0]}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>{project.owner.name}</span>
              <span style={{ fontSize: 10, color: '#818cf8', background: '#e0e7ff', padding: '1px 6px', borderRadius: 10 }}>owner</span>
            </div>
            {project.members.map(m => (
              <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 20, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: getColor(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white' }}>
                  {m.name[0]}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</span>
                <button onClick={() => handleRemoveMember(m._id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 1 }}
                  className="hover:text-red-500">
                  x
                </button>
              </div>
            ))}
          </div>
          {nonMembers.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-input" style={{ flex: 1, maxWidth: 280 }}
                value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                <option value="">Select user to add...</option>
                {nonMembers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleAddMember}>
                Add
              </button>
            </div>
          )}
        </div>
      )}

      {/* Kanban board */}
      <div>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Task Board</h3>
        <KanbanBoard
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onEditTask={t => { setEditTask(t); setShowTaskModal(true); }}
          onDeleteTask={handleTaskDelete}
          isAdmin={isAdmin}
          onAddTask={() => { setEditTask(null); setShowTaskModal(true); }}
        />
      </div>

      {showTaskModal && (
        <TaskModal task={editTask} projectId={id}
          projectMembers={[project.owner, ...project.members]}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSaved={() => { setShowTaskModal(false); setEditTask(null); fetchData(); }} />
      )}
      {showProjectModal && (
        <ProjectModal project={project}
          onClose={() => setShowProjectModal(false)}
          onSaved={() => { setShowProjectModal(false); fetchData(); }} />
      )}
    </div>
  );
};

export default ProjectDetailPage;
