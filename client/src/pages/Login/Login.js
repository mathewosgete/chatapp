import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { UserContext } from "../../context/UserContext";
import { useNavigate, Link } from "react-router-dom";
import AppShell from "../../components/AppShell/AppShell";
import API_BASE from "../../config/api";

const Login = () => {
  const { userdata, setUserdata } = useContext(UserContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const loginRes = await axios.post(`${API_BASE}/api/users/login`, {
        email: form.email,
        password: form.password,
      });

      setUserdata({
        token: loginRes.data.token,
        user: {
          id: loginRes.data.user?.id,
          displayName: loginRes.data.user?.display_name,
        },
      });

      localStorage.setItem("auth-token", loginRes.data.token);
      navigate("/");
    } catch (error) {
      setError(error.response?.data?.message || "Unable to sign in.");
    }
  };

  useEffect(() => {
    if (userdata?.user) {
      navigate("/");
    }
  }, [userdata, navigate]);

  return (
    <AppShell authMode authLinkLabel="SIGN IN" authLinkTo="/login">
      <section className="auth-hero auth-hero--login">
        <div className="auth-card">
          <h1>Login to your account</h1>
          <p className="auth-switch-copy">
            Don&apos;t have an account? <Link to="/signup">Create a new account</Link>
          </p>

          <form className="form-stack" onSubmit={handleSubmit}>
            <input
              className="form-input auth-card__input"
              type="text"
              name="email"
              placeholder="Email or Username"
              value={form.email}
              onChange={handleChange}
            />
            <div className="password-field">
              <input
                className="form-input auth-card__input"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Your Password"
                value={form.password}
                onChange={handleChange}
              />
              <span 
                className="password-field__icon" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <button className="auth-submit-button" type="submit">
              submit
            </button>
          </form>

          <Link className="auth-card__link" to="/signup">
            Create an account?
          </Link>
        </div>

        <div className="marketing-panel">
          <p className="section-kicker">About</p>
          <h2>Chat App Q&amp;A</h2>
          <p>
          This platform is a Question and Answer platform where you can ask questions and get answers from other users.   
          you can also answer questions asked by other users.  
          </p>
          <a className="auth-how-button" href="#how-it-works">
          chat with.....
          </a>
        </div>
      </section>
    </AppShell>
  );
};

export default Login;
