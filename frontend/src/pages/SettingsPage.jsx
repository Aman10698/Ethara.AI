
// TODO: build out settings page with profile edit and notification prefs
const SettingsPage = () => {
  return (
    <div className="slide-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your workspace preferences</p>
        </div>
      </div>

      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Settings Coming Soon</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Workspace and account settings will be available here.</p>
      </div>
    </div>
  );
};

export default SettingsPage;
