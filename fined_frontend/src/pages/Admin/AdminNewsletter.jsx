import { useState } from "react";
import { sendNewsletter } from "../../services/api";
import { useNavigate } from "react-router-dom";

function AdminNewsletter() {
  const navigate = useNavigate();
  const [data, setData] = useState({ title: "", content: "" });
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (event) => {
    event.preventDefault();
    setSending(true);
    setStatus("");
    try {
      const response = await sendNewsletter(data);
      setStatus(response.message || "Newsletter sent.");
    } catch (err) {
      setStatus(err.message || "Failed to send newsletter.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="admin-form-page">
      <section className="admin-form-card newsletter-card">
        <div className="form-heading">
          <h1>Send Newsletter</h1>
          <button onClick={() => navigate("/admin")}>Back to Dashboard</button>
        </div>

        <form onSubmit={handleSend}>
          <label>
            Title
            <input
              value={data.title}
              onChange={(event) => setData((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </label>

          <label>
            Content
            <textarea
              value={data.content}
              onChange={(event) => setData((prev) => ({ ...prev, content: event.target.value }))}
              rows={8}
              required
            />
          </label>

          <button className="primary-btn" type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send Emails"}
          </button>
        </form>

        {status && <p className="form-status">{status}</p>}
      </section>
    </main>
  );
}

export default AdminNewsletter;
