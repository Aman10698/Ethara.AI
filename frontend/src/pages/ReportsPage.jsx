
// reports page - will add charts later
const ReportsPage = () => {
  return (
    <div className="slide-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Analytics and insights for your workspace</p>
        </div>
      </div>

      {/* placeholder for reports - TODO: add actual charts */}
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Reports Coming Soon</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Task analytics and team performance charts will be added here.</p>
      </div>
    </div>
  );
};

export default ReportsPage;
