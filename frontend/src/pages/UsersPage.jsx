import { useEffect, useState } from 'react';

import { toast } from 'react-toastify';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = ['#4F6DF5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const getColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      let response = await api.get('/users');
      let allUsers = response.data.users;
      console.log('users loaded:', allUsers.length);
      setUsers(allUsers);
    } catch (err) {
      console.log('failed to load users:', err.message);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { data } = await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u._id === userId ? data.user : u));
      toast.success('Role updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update role'); }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User removed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="slide-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">Manage your team members and their roles</p>
        </div>
        <button className="btn btn-primary">
          + Invite Member
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Members', value: users.length, color: '#4F6DF5', bg: '#EEF1FF' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#F59E0B', bg: '#FEF3C7' },
          { label: 'Members', value: users.filter(u => u.role === 'member').length, color: '#22C55E', bg: '#DCFCE7' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: color }} />
            </div>
            <div>
              <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-bar" style={{ maxWidth: 280 }}>
            <input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Projects</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No members found</td></tr>
              ) : filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: getColor(u.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>
                          {u.name}
                          {u._id === currentUser?._id && (
                            <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 20, fontWeight: 600 }}>You</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u._id, e.target.value)}
                      disabled={u._id === currentUser?._id}
                      style={{
                        background: u.role === 'admin' ? '#FEF3C7' : '#F3F4F6',
                        color: u.role === 'admin' ? '#D97706' : '#6B7280',
                        border: `1px solid ${u.role === 'admin' ? '#FDE68A' : '#E5E7EB'}`,
                        borderRadius: 20,
                        padding: '3px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: u._id === currentUser?._id ? 'not-allowed' : 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        outline: 'none',
                      }}>
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>—</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {format(new Date(u.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td>
                    {u._id !== currentUser?._id ? (
                      <button onClick={() => handleDelete(u._id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--danger)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                        className="hover:bg-red-50">
                        Remove
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
