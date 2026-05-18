import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import AppShell from "../../components/AppShell/AppShell";
import API_BASE from "../../config/api";

const SignUp = () => {
  const [form, setForm] = useState({
    userName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const { userdata, setUserdata } = useContext(UserContext);
  const navigate = useNavigate();
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
      await axios.post(`${API_BASE}/api/users`, form);

      const loginRes = await axios.post(
        `${API_BASE}/api/users/login`,
        {
          email: form.email,
          password: form.password,
        }
      );

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
      setError(error.response?.data?.message || "Unable to create account.");
    }
  };

  useEffect(() => {
    if (userdata?.user) {
      navigate("/");
    }
  }, [navigate, userdata]);

  return (
    <AppShell authMode authLinkLabel="SIGN IN" authLinkTo="/login">
      <section className="auth-hero auth-hero--signup">
        <div className="auth-card">
          <h1>Join the network</h1>
          <p className="auth-switch-copy">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          <form className="form-stack" onSubmit={handleSubmit}>
            <input
              className="form-input auth-card__input"
              type="email"
              name="email"
              placeholder="Your Email"
              value={form.email}
              onChange={handleChange}
            />
            <div className="inline-fields">
              <input
                className="form-input auth-card__input"
                type="text"
                name="firstName"
                placeholder="Daniel"
                value={form.firstName}
                onChange={handleChange}
              />
              <input
                className="form-input auth-card__input"
                type="text"
                name="lastName"
                placeholder="Kebede"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
            <input
              className="form-input auth-card__input"
              type="text"
              name="userName"
              placeholder="User Name"
              value={form.userName}
              onChange={handleChange}
            />
            <div className="password-field">
              <input
                className="form-input auth-card__input"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
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

            <button className="auth-join-button" type="submit">
              Create Account
            </button>
          </form>


          <Link className="auth-card__link" to="/login">
            Already have an account?
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
           HAVE A WELL DISCUSSION
          </a>
        </div>
      </section>
    </AppShell>
  );
};

export default SignUp;
