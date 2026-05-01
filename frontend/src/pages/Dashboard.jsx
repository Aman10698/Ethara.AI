import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = ['#4F6DF5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
const getAvatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const StatCard = ({ label, value, color, bg }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
        <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
      </div>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: color }} />
      </div>
    </div>
  </div>
);

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, completed: 0, overdue: 0 });
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      let [statsRes, projRes, taskRes] = await Promise.all([
        api.get('/tasks/stats'),
        api.get('/projects'),
        api.get('/tasks'),
      ]);

      console.log('dashboard data loaded');

      setStats(statsRes.data.stats);
      setProjects(projRes.data.projects);
      setTasks(taskRes.data.tasks);
    } catch (err) {
      console.log('error loading dashboard:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // re-fetch every time the user navigates to the dashboard
  useEffect(() => {
    fetchAll();
  }, [location.key]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  // TODO: show overdue tasks in a separate section
  const donutData = [
    { name: 'To Do', value: stats.todo, color: '#6B7280' },
    { name: 'In Progress', value: stats.inProgress, color: '#3B82F6' },
    { name: 'Completed', value: stats.completed, color: '#22C55E' },
    { name: 'Overdue', value: stats.overdue, color: '#EF4444' },
  ].filter(d => d.value > 0);

  const upcomingTasks = tasks
    .filter(t => t.deadline && t.status !== 'completed')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  const recentProjects = projects.slice(0, 4);
  const totalProjects = projects.length;

  const deadlineLabel = (d) => {
    const date = new Date(d);
    if (isToday(date)) return { label: 'Today', color: '#EF4444' };
    if (isTomorrow(date)) return { label: 'Tomorrow', color: '#F59E0B' };
    if (isPast(date)) return { label: 'Overdue', color: '#EF4444' };
    return { label: format(date, 'MMM d'), color: '#6B7280' };
  };

  const priorityColors = { low: '#22C55E', medium: '#F59E0B', high: '#EF4444', critical: '#7C3AED' };

  return (
    <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]}! Here's what's happening.</p>
        </div>
        <button
          onClick={fetchAll}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12.5, color: 'var(--text-secondary)', fontFamily: 'Inter, sans-serif', fontWeight: 500, marginTop: 4 }}
          title="Refresh dashboard"
        >
          ↻ Refresh
        </button>
      </div>

      {/* stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="Total Projects" value={totalProjects} color="#4F6DF5" bg="#EEF1FF" />
        <StatCard label="Total Tasks" value={stats.total} color="#10B981" bg="#DCFCE7" />
        <StatCard label="In Progress" value={stats.inProgress} color="#3B82F6" bg="#DBEAFE" />
        <StatCard label="Completed" value={stats.completed} color="#22C55E" bg="#DCFCE7" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* tasks overview chart */}
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Tasks Overview</h3>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 140, height: 140, flexShrink: 0 }}>
              {donutData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={38} outerRadius={62}
                      paddingAngle={2} dataKey="value" labelLine={false} label={renderCustomLabel}>
                      {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} tasks`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 90, height: 90, borderRadius: '50%', border: '12px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No data</span>
                  </div>
                </div>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'To Do', value: stats.todo, pct: stats.total ? Math.round(stats.todo / stats.total * 100) : 0, color: '#6B7280' },
                { label: 'In Progress', value: stats.inProgress, pct: stats.total ? Math.round(stats.inProgress / stats.total * 100) : 0, color: '#3B82F6' },
                { label: 'Completed', value: stats.completed, pct: stats.total ? Math.round(stats.completed / stats.total * 100) : 0, color: '#22C55E' },
                { label: 'Overdue', value: stats.overdue, pct: stats.total ? Math.round(stats.overdue / stats.total * 100) : 0, color: '#EF4444' },
              ].map(({ label, value, pct, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="dot" style={{ background: color }} />
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color }}>{value}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 36, textAlign: 'right' }}>({pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* upcoming deadlines */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Upcoming Deadlines</h3>
            <Link to="/tasks" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
              View all
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcomingTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No upcoming deadlines
              </p>
            ) : upcomingTasks.map(t => {
              const dl = deadlineLabel(t.deadline);
              return (
                <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }} className="truncate">{t.title}</p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{t.project?.name}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="badge" style={{ background: `${priorityColors[t.priority]}15`, color: priorityColors[t.priority], fontSize: 10.5 }}>
                      {t.priority?.charAt(0).toUpperCase() + t.priority?.slice(1)}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: dl.color, background: `${dl.color}12`, padding: '2px 8px', borderRadius: 20 }}>
                      {dl.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* recent projects */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15 }}>Recent Projects</h3>
          <Link to="/projects" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
            View all
          </Link>
        </div>
        {recentProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 13 }}>No projects yet</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(recentProjects.length, 4)}, 1fr)`, gap: 14 }}>
            {recentProjects.map(p => {
              const pct = p.taskCount > 0 ? Math.round(p.completedCount / p.taskCount * 100) : 0;
              return (
                <Link key={p._id} to={`/projects/${p._id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s', background: 'var(--bg-base)' }}
                    className="hover:shadow-md">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || 'var(--primary)', flexShrink: 0 }} />
                      <p style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }} className="truncate">{p.name}</p>
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 10 }}>
                      {p.taskCount || 0} task{p.taskCount !== 1 ? 's' : ''}
                    </p>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: p.color || 'var(--primary)' }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
