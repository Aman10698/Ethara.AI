import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const TaskModal = ({ task, projectId, projectMembers, onClose, onSaved }) => {
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState(projectMembers || []);

  const [form, setForm] = useState({
    title: task ? task.title : '',
    description: task ? task.description : '',
    status: task ? task.status : 'todo',
    priority: task ? task.priority : 'medium',
    deadline: task && task.deadline ? task.deadline.split('T')[0] : '',
    project: task && task.project ? task.project._id : (projectId || ''),
    assignedTo: task && task.assignedTo ? task.assignedTo._id : '',
    tags: task && task.tags ? task.tags.join(', ') : '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      api.get('/projects')
        .then((res) => {
          setProjects(res.data.projects);
        })
        .catch((err) => {
          console.log('failed to load projects:', err.message);
        });
    }
  }, []);

  useEffect(() => {
    if (!projectId && form.project) {
      api.get('/projects/' + form.project)
        .then((res) => {
          let allMembers = [res.data.project.owner, ...res.data.project.members];
          setMembers(allMembers);
        })
        .catch((err) => {
          console.log('failed to load project members:', err.message);
        });
    }
  }, [form.project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let tagsArray = form.tags.split(',').map((t) => t.trim()).filter((t) => t !== '');

      let payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        deadline: form.deadline,
        project: form.project,
        assignedTo: form.assignedTo || null,
        tags: tagsArray,
      };

      if (task) {
        await api.put('/tasks/' + task._id, payload);
        toast.success('Task updated!');
      } else {
        await api.post('/tasks', payload);
        toast.success('Task created!');
      }

      onSaved();
    } catch (err) {
      console.log('save task error:', err.message);
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 580 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: 6, fontSize: 18, lineHeight: 1 }}>
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input className="form-input" placeholder="Enter task title"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} placeholder="Enter task description"
              style={{ resize: 'none' }}
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {!projectId && (
            <div className="form-group">
              <label className="form-label">Project *</label>
              <select className="form-input" value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })} required>
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select className="form-input" value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Select member</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" placeholder="e.g. design, backend, urgent"
              value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
