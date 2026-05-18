import { Link, NavLink } from "react-router-dom";

const AppShell = ({
  children,
  user,
  onLogout,
  authMode = false,
  authLinkLabel = "SIGN IN",
  authLinkTo = "/login",
}) => {
  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="brand" to={user ? "/" : "/signup"}>
            <span className="brand__mark">C</span>
            <span className="brand__text">HAT APP</span>
          </Link>

          <nav className="site-nav">
            <NavLink to="/" className="site-nav__link">
              Home
            </NavLink>
            <a className="site-nav__link" href="#how-it-works">
              Ethiopian chatapp
            </a>
            {user ? (
              <button className="site-nav__button" onClick={onLogout} type="button">
                LogOut
              </button>
            ) : (
              <Link className="site-nav__button" to={authLinkTo}>
                {authLinkLabel}
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className={`page-content ${authMode ? "page-content--auth" : ""}`}>
        {children}
      </main>

      <footer className="site-footer" id="how-it-works">
        <div className="site-footer__inner">
          <div>
            <div className="brand brand--footer">
              <span className="brand__mark">C</span>
              <span className="brand__text">HAT APP</span>
            </div>
          </div>

          <div>
            <h3 className="site-footer__title">Contact Info</h3>
            <p>Chat App</p>
            <p>mathewosgetie@gmail.com</p>
            <p>+251 918325419</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
