import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ProjectModal from '../components/ProjectModal';

const AVATAR_COLORS = ['#4F6DF5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
const getColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const AvatarGroup = ({ members = [], max = 3 }) => (
  <div style={{ display: 'flex' }}>
    {(members || []).slice(0, max).map((m, i) => (
      <div key={i} title={m?.name}
        style={{
          width: 26, height: 26, borderRadius: '50%', border: '2px solid white',
          background: getColor(m?.name), display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white',
          marginLeft: i === 0 ? 0 : -6, zIndex: max - i, flexShrink: 0,
        }}>
        {m?.name?.[0]?.toUpperCase()}
      </div>
    ))}
    {members.length > max && (
      <div style={{
        width: 26, height: 26, borderRadius: '50%', border: '2px solid white',
        background: '#9CA3AF', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', marginLeft: -6,
      }}>+{members.length - max}</div>
    )}
  </div>
);

const ActionMenu = ({ onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)}
        style={{ background: 'none', border: '1px solid var(--border)', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, color: 'var(--text-muted)', fontSize: 12 }}
        className="hover:bg-gray-100">
        ...
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: '110%', background: 'white',
            border: '1px solid var(--border)', borderRadius: 8, padding: 6,
            boxShadow: 'var(--shadow-md)', zIndex: 10, minWidth: 130,
          }}>
            <button onClick={() => { onEdit(); setOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}
              className="hover:bg-gray-50">
              Edit Project
            </button>
            <button onClick={() => { onDelete(); setOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--danger)' }}
              className="hover:bg-red-50">
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const ProjectsPage = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      console.log('projects loaded:', data.projects.length);
      setProjects(data.projects);
    } catch (err) {
      console.log('failed to load projects');
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p._id !== id));
      toast.success('Project deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="slide-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} projects total</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditProject(null); setShowModal(true); }}>
            + New Project
          </button>
        )}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-bar" style={{ maxWidth: 280 }}>
            <input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14 }}>No projects found</p>
            {isAdmin && (
              <button className="btn btn-primary" style={{ marginTop: 16 }}
                onClick={() => setShowModal(true)}>
                + Create first project
              </button>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Members</th>
                <th>Tasks</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const pct = p.taskCount > 0 ? Math.round(p.completedCount / p.taskCount * 100) : 0;
                const statusBadge = {
                  active: 'badge-active', 'on-hold': 'badge-on-hold',
                  completed: 'badge-completed', archived: 'badge-todo'
                };
                return (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${p.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${p.color}30` }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color || 'var(--primary)' }} />
                        </div>
                        <div>
                          <Link to={`/projects/${p._id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: 13.5 }}>
                            {p.name}
                          </Link>
                          {p.description && (
                            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }} className="truncate" style={{ maxWidth: 200 }}>
                              {p.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <AvatarGroup members={[p.owner, ...(p.members || [])]} max={3} />
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{p.taskCount || 0}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> tasks</span>
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar-wrap" style={{ flex: 1 }}>
                          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: p.color || 'var(--primary)' }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 30 }}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge[p.status] || 'badge-todo'}`} style={{ textTransform: 'capitalize' }}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <Link to={`/projects/${p._id}`}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--primary)', textDecoration: 'none', padding: '4px 8px', borderRadius: 6, fontWeight: 500 }}
                          className="hover:bg-blue-50">
                          Open
                        </Link>
                        {isAdmin && (
                          <ActionMenu
                            onEdit={() => { setEditProject(p); setShowModal(true); }}
                            onDelete={() => handleDelete(p._id)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <ProjectModal project={editProject} onClose={() => { setShowModal(false); setEditProject(null); }}
          onSaved={() => { setShowModal(false); setEditProject(null); fetchProjects(); }} />
      )}
    </div>
  );
};

export default ProjectsPage;
