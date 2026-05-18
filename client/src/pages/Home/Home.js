import React, { useContext, useEffect, useState } from "react";
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

const Home = ({ logout }) => {
  const { userdata } = useContext(UserContext);
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userdata?.user) { navigate("/login"); return; }
    
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const url = `http://localhost:4000/api/questions${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`;
        const res = await axios.get(url, {
          headers: { "x-auth-token": userdata.token },
        });
        setQuestions(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchQuestions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [userdata, navigate, search]);

  const filtered = questions;

  return (
    <AppShell user={userdata?.user} onLogout={logout}>
      <section className="home-page">
        {/* Hero Banner */}
        <div className="hero-strip">
          <div>
            <p className="section-kicker">Welcome back </p>
            <h1>Hello, {userdata?.user?.displayName ? formatUserName(userdata.user.displayName) : "Guest"}</h1>
            <p>
              Ask questions from the community, share your knowledge, and get
              answers from real community.
            </p>
          </div>
          <div className="hero-strip__actions">
            <input
              className="form-input"
              type="search"
              placeholder="🔍 Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Link className="primary-button" to="/questions/ask">
              + Ask a Question
            </Link>
          </div>
        </div>

        {/* Questions Panel */}
        <section className="content-panel">
          <div className="content-panel__header">
            <h2>Community Questions</h2>
            <p>{filtered.length} question{filtered.length !== 1 ? "s" : ""}</p>
          </div>

          {loading ? (
            <div className="empty-state">
              <p>Loading questions…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <p>No questions yet. Be the first to ask one!</p>
              <Link className="primary-button" to="/questions/ask" style={{ marginTop: 16, display: "inline-flex" }}>
                Ask a Question
              </Link>
            </div>
          ) : (
            <div className="question-list">
              {filtered.map((q) => (
                <Link
                  className="question-row"
                  key={q.question_id}
                  to={`/questions/${q.question_id}`}
                >
                  <div className="question-row__avatar">
                    <span>{formatUserName(q.user_name).charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="question-row__content">
                    <h3>{q.question_text}</h3>
                    <small style={{ color: "var(--muted)", marginTop: 8, display: "block" }}>
                      Asked by <strong>{formatUserName(q.user_name)}</strong> ·{" "}
                      {new Date(q.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="question-row__meta" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <strong>{q.answer_count}</strong>
                      <span>answer{q.answer_count !== 1 ? "s" : ""}</span>
                    </div>
                    <span className="question-row__arrow">➔</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
};

export default Home;
