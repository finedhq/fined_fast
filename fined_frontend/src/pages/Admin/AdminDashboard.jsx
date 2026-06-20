import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();
  const cards = [
    {
      label: "Add New Course",
      icon: "📚",
      action: null,
    },
    {
      label: "Add New Article",
      icon: "📝",
      action: () => navigate("/admin/articles/add"),
    },
    {
      label: "View All Courses",
      icon: "📖",
      action: null,
    },
    {
      label: "View All Articles",
      icon: "📰",
      action: () => navigate("/admin/articles"),
    },
    {
      label: "Send Newsletter",
      icon: "📝",
      action: () => navigate("/admin/newsletters"),
    },
    {
      label: "Settings (Coming Soon)",
      icon: "⚙",
      action: null,
    },
    { 
      label: "Add Card", 
      icon: "🎬", 
      action: () => navigate("/admin/cards/add") 
    },
  ];

  return (
    <main className="admin-page">
      <div className="admin-top">
        <div className="admin-brand-group">
          <button className="brand-logo" onClick={() => navigate("/")}>FinEd</button>
          <h1>FinEd Admin Panel</h1>
        </div>
        <button onClick={() => navigate("/")}>← Back to Main Site</button>
      </div>

      <section className="admin-panel">
        <h2>Welcome, Admin!</h2>
        <p>Hello Om Jaiswal, can manage content, add new materials, and track progress here.</p>

        <div className="admin-card-grid">
          {cards.map((card) => (
            <button
              key={card.label}
              className={card.action ? "admin-action-card" : "admin-action-card disabled"}
              onClick={card.action || undefined}
              disabled={!card.action}
            >
              <span className="admin-card-icon">{card.icon}</span>
              <strong>{card.label}</strong>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;
