import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const COLORS = ['#4F6DF5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#3B82F6'];

const ProjectModal = ({ project, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: project ? project.name : '',
    description: project ? project.description : '',
    status: project ? project.status : 'active',
    deadline: project && project.deadline ? project.deadline.split('T')[0] : '',
    color: project ? project.color : '#4F6DF5',
  });

  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project && project.members) {
      let memberIds = project.members.map((m) => m._id);
      setSelectedMembers(memberIds);
    }
  }, []);

  useEffect(() => {
    api.get('/users?role=member')
      .then((response) => {
        setUsers(response.data.users);
        console.log('members loaded:', response.data.users.length);
      })
      .catch((err) => {
        console.log('error loading users:', err.message);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let payload = {
        name: form.name,
        description: form.description,
        status: form.status,
        deadline: form.deadline,
        color: form.color,
        members: selectedMembers,
      };

      if (project) {
        await api.put('/projects/' + project._id, payload);
        toast.success('Project updated!');
      } else {
        await api.post('/projects', payload);
        toast.success('Project created!');
      }

      onSaved();
    } catch (err) {
      console.log('save project error:', err.message);
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (id) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
              {project ? 'Edit Project' : 'Create New Project'}
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
              {project ? 'Update project details' : 'Fill in the details to create a new project'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: 6, fontSize: 18, lineHeight: 1 }}
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              className="form-input"
              placeholder="Enter project name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Write project description"
              style={{ resize: 'none' }}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select Members</label>
            <div style={{ border: '1.5px solid var(--border)', borderRadius: 8, maxHeight: 140, overflowY: 'auto' }}>
              {users.length === 0 ? (
                <p style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: 13 }}>No users available</p>
              ) : (
                users.map((u) => (
                  <label
                    key={u._id}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(u._id)}
                      onChange={() => toggleMember(u._id)}
                      style={{ accentColor: 'var(--primary)', width: 15, height: 15 }}
                    />
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>
                      {u.name[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{u.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Project Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  style={{
                    width: 26, height: 26, borderRadius: 6, background: c, border: 'none', cursor: 'pointer',
                    outline: form.color === c ? '3px solid ' + c : '3px solid transparent',
                    outlineOffset: 2,
                    transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (project ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
