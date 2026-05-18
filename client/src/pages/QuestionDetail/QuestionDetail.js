import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import AppShell from "../../components/AppShell/AppShell";
import "./QuestionDetail.css";

const formatUserName = (name) => {
  if (!name) return "User";
  
  // Extract local part of email if username is an email
  let cleanName = name;
  if (name.includes("@")) {
    cleanName = name.split("@")[0];
  }
  
  // Custom mappings requested by user
  const lowerName = cleanName.toLowerCase();
  if (lowerName.includes("mathewos")) {
    return "mathewos";
  }
  if (lowerName.includes("admin")) {
    return "admin";
  }
  
  return cleanName;
};

const renderAttractiveText = (text) => {
  if (!text) return "";
  
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let formatted = escaped.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="attractive-link">${url}</a>`;
  });
  
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="attractive-inline-code">$1</code>');
  
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
};

const CodeBlock = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="attractive-code-window">
      <div className="attractive-code-header">
        <div className="mac-dots">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
        </div>
        <span className="code-lang">code snippet</span>
        <button type="button" className="copy-btn" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="attractive-code-content">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const QuestionDetail = () => {
  const { userdata, setUserdata } = useContext(UserContext);
  const { questionId } = useParams();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [answerCode, setAnswerCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const logout = () => {
    setUserdata({ token: undefined, user: undefined });
    localStorage.setItem("auth-token", "");
    navigate("/login");
  };

  const fetchQuestion = async () => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/questions/${questionId}`,
        { headers: { "x-auth-token": userdata.token } }
      );
      setQuestion(res.data.data);
    } catch {
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userdata?.user) { navigate("/login"); return; }
    fetchQuestion();
    // eslint-disable-next-line
  }, [questionId, userdata]);

  // Scroll to bottom whenever answers change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [question?.answers]);

  const handleScrollToMessage = (msgId) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("telegram-highlight");
      setTimeout(() => {
        element.classList.remove("telegram-highlight");
      }, 1500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await axios.post(
        `http://localhost:4000/api/questions/${questionId}/answers`,
        { 
          answer, 
          answerCode,
          replyToId: replyTo && replyTo.id !== 'question' ? replyTo.id : null
        },
        { headers: { "x-auth-token": userdata.token } }
      );
      setAnswer("");
      setAnswerCode("");
      setReplyTo(null);
      await fetchQuestion();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post your answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
      " · " + d.toLocaleDateString();
  };

  if (loading) {
    return (
      <AppShell user={userdata?.user} onLogout={logout}>
        <div className="chat-loading"><div className="chat-spinner" /><p>Loading conversation…</p></div>
      </AppShell>
    );
  }

  if (!question) {
    return (
      <AppShell user={userdata?.user} onLogout={logout}>
        <section className="content-panel content-panel--empty">
          <h2>Question not found</h2>
          <p>This question may have been removed.</p>
          <Link className="primary-button" to="/" style={{ marginTop: 16 }}>← Back</Link>
        </section>
      </AppShell>
    );
  }

  const myName = userdata?.user?.displayName;

  return (
    <AppShell user={userdata?.user} onLogout={logout}>
      <div className="telegram-page">
        <div className="telegram-chat-container">
          
          {/* ── Telegram Chat Header ── */}
          <div className="telegram-header">
            <button className="telegram-back-btn" onClick={() => navigate("/")}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>
            </button>
            <div className="telegram-header-info">
              <h2 className="telegram-title" title={question.question_text}>{question.question_text}</h2>
              <span className="telegram-subtitle">
                {question.answers && question.answers.length > 0 
                  ? `${question.answers.length + 1} messages`
                  : "1 message"}
              </span>
            </div>
          </div>

          {/* ── Telegram Chat Thread ── */}
          <div className="telegram-thread">
            {/* 1. The Original Question (First Message) */}
            <div 
              id="msg-question"
              className={`chat-message ${question.user_name === myName ? "chat-message--mine" : "chat-message--theirs"}`}
            >
              <div className="chat-avatar">
                {formatUserName(question.user_name).charAt(0).toUpperCase()}
              </div>
              <div className="chat-message-content">
                <div className="chat-message-meta">
                  <span className="chat-author">{formatUserName(question.user_name)}</span>
                  <span className="chat-time">{formatTime(question.created_at)}</span>
                  <button 
                    type="button" 
                    className="chat-reply-trigger"
                    onClick={() => setReplyTo({ id: 'question', user: question.user_name, text: question.question_description || question.question_text })}
                    title="Reply to message"
                  >
                    reply
                  </button>
                </div>
                <div className="chat-bubble chat-bubble--question">
                  <p className="chat-text">{renderAttractiveText(question.question_description || question.question_text)}</p>
                  {question.question_code_block && (
                    <CodeBlock code={question.question_code_block} />
                  )}
                </div>
              </div>
            </div>

            {/* 2. The Answers (Subsequent Messages) */}
            {question.answers && question.answers.length > 0 && question.answers.map((item) => {
              const isMe = item.user_name === myName;

              return (
                <div 
                  key={item.answer_id} 
                  id={`msg-${item.answer_id}`}
                  className={`chat-message ${isMe ? "chat-message--mine" : "chat-message--theirs"}`}
                >
                  <div className="chat-avatar">
                    {formatUserName(item.user_name).charAt(0).toUpperCase()}
                  </div>
                  <div className="chat-message-content">
                    <div className="chat-message-meta">
                      <span className="chat-author">{formatUserName(item.user_name)}</span>
                      <span className="chat-time">{formatTime(item.created_at)}</span>
                      <button 
                        type="button" 
                        className="chat-reply-trigger"
                        onClick={() => setReplyTo({ id: item.answer_id, user: item.user_name, text: item.answer })}
                        title="Reply to message"
                      >
                        reply
                      </button>
                    </div>
                    <div className="chat-bubble">
                      {item.reply_to_id && (
                        <div 
                          className="telegram-reply-quote"
                          onClick={() => handleScrollToMessage(item.reply_to_id)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="quote-left-accent"></div>
                          <div className="quote-content">
                            <span className="quote-author">
                              {formatUserName(item.parent_user_name)}
                            </span>
                            <span className="quote-text">
                              {item.parent_answer && item.parent_answer.length > 80 
                                ? item.parent_answer.slice(0, 80) + "..." 
                                : item.parent_answer || "Code snippet / attachment"}
                            </span>
                          </div>
                        </div>
                      )}
                      <p className="chat-text">{renderAttractiveText(item.answer)}</p>
                      {item.answer_code && (
                        <CodeBlock code={item.answer_code} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div ref={chatEndRef} />
          </div>

          {/* ── Telegram Chat Input Area ── */}
          <div className="telegram-input-area">
            
            {/* Reply Preview Bar */}
            {replyTo && (
              <div className="telegram-reply-preview">
                <div className="reply-preview-left-accent"></div>
                <div className="reply-preview-content">
                  <span className="reply-preview-author">
                    Replying to {formatUserName(replyTo.user)}
                  </span>
                  <span className="reply-preview-text">
                    {replyTo.text.length > 80 ? replyTo.text.slice(0, 80) + "..." : replyTo.text}
                  </span>
                </div>
                <button 
                  type="button" 
                  className="reply-preview-close" 
                  onClick={() => setReplyTo(null)}
                >
                  ✕
                </button>
              </div>
            )}

            <form className="telegram-form" onSubmit={handleSubmit}>
              <div className="telegram-input-wrapper">
                <textarea
                  className="telegram-textarea"
                  placeholder="Message..."
                  rows="1"
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = (e.target.scrollHeight) + 'px';
                  }}
                  disabled={submitting}
                  required
                />
                <textarea
                  className="telegram-code-input"
                  placeholder="Paste code snippets here (optional)..."
                  rows="1"
                  value={answerCode}
                  onChange={(e) => {
                    setAnswerCode(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = (e.target.scrollHeight) + 'px';
                  }}
                  disabled={submitting}
                />
              </div>
              <button
                className="telegram-send-btn"
                type="submit"
                disabled={submitting || !answer.trim()}
                title="Send Message"
              >
                {submitting ? "..." : (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                  </svg>
                )}
              </button>
            </form>
            {error && <p className="chat-error">{error}</p>}
          </div>

        </div>
      </div>
    </AppShell>
  );
};

export default QuestionDetail;
