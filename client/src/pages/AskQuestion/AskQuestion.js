import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import AppShell from "../../components/AppShell/AppShell";

const formatUserName = (name) => {
  if (!name) return "User";
  let cleanName = name;
  if (name.includes("@")) {
    cleanName = name.split("@")[0];
  }
  const lowerName = cleanName.toLowerCase();
  if (lowerName.includes("mathewos")) {
    return "mathewos";
  }
  if (lowerName.includes("admin")) {
    return "admin";
  }
  return cleanName;
};

const AskQuestion = () => {
  const { userdata, setUserdata } = useContext(UserContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    codeBlock: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState([]);

  const logout = () => {
    setUserdata({ token: undefined, user: undefined });
    localStorage.setItem("auth-token", "");
    navigate("/login");
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Smart similarity/duplicate check with 400ms debounce
  useEffect(() => {
    if (!userdata?.token || !form.title.trim() || form.title.trim().length < 5) {
      setDuplicates([]);
      return;
    }

    const checkDuplicates = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/api/questions/duplicates?title=${encodeURIComponent(form.title.trim())}`,
          { headers: { "x-auth-token": userdata.token } }
        );
        setDuplicates(res.data.data || []);
      } catch (err) {
        console.error("Error fetching duplicates:", err);
      }
    };

    const delayDebounce = setTimeout(() => {
      checkDuplicates();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [form.title, userdata]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Question title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(
        "http://localhost:4000/api/questions",
        {
          title: form.title,
          description: form.title, // Use title as description for backend validation
          codeBlock: form.codeBlock,
          tags: "",
        },
        { headers: { "x-auth-token": userdata.token } }
      );
      navigate(`/questions/${res.data.questionId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post question.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell user={userdata?.user} onLogout={logout}>
      <section className="ask-page">
        <div className="ask-page__intro">
          <p className="section-kicker">Community Q&amp;A</p>
          <h1>Ask a public question</h1>
          <p>
            Be specific and clear. Explain the title clearly and paste any relevant code
            so the right people can help quickly.
          </p>
        </div>

        <div className="content-panel">
          <h2>Write your question</h2>
          <form className="form-stack" onSubmit={handleSubmit}>
            <div>
              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: "block" }}>
                Question Title *
              </label>
              <input
                className="form-input"
                name="title"
                placeholder="e.g. How do I center a div in CSS?"
                value={form.title}
                onChange={handleChange}
              />

              {/* Duplicate / Smart suggestions preview */}
              {duplicates.length > 0 && (
                <div className="similar-questions-panel">
                  <div className="similar-questions-header">
                    <span className="similar-questions-icon">💡</span>
                    <strong>We found similar questions that already have answers:</strong>
                  </div>
                  <div className="similar-questions-list">
                    {duplicates.map((q) => (
                      <Link 
                        key={q.question_id}
                        to={`/questions/${q.question_id}`}
                        className="similar-question-item"
                      >
                        <div className="similar-question-title">{q.question_text}</div>
                        <div className="similar-question-meta">
                          <span className="similar-question-answers">✔️ {q.answer_count} solution{q.answer_count !== 1 ? 's' : ''} available</span>
                          <span>· Asked by {formatUserName(q.user_name)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: "block" }}>
                Code Block <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>
              </label>
              <textarea
                className="form-textarea"
                name="codeBlock"
                placeholder="Paste relevant code here…"
                rows="6"
                value={form.codeBlock}
                onChange={handleChange}
                style={{ fontFamily: "monospace", fontSize: 13 }}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              className="primary-button"
              type="submit"
              disabled={submitting}
              style={{ opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Posting…" : "Post Your Question"}
            </button>
          </form>
        </div>
      </section>
    </AppShell>
  );
};

export default AskQuestion;
