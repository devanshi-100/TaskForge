import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { authApi } from "../../services/api";
import taskForgeLogo from "../../assets/TaskForge.png";
import userDefaultLogo from "../../assets/userDefaultLog.png";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/workspaces", label: "Workspaces" },
  { to: "/projects", label: "Projects" }
];

const AppLayout = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    authApi.getProfile()
      .then((data) => {
        setProfile(data.user || data.profile || null);
      })
      .catch((requestError) => {
        console.warn("Unable to load profile:", requestError.message);
        navigate("/login", { replace: true });
      });
  }, [navigate]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authApi.logout();
      navigate("/login", { replace: true });
    } catch (requestError) {
      setSignOutError(requestError.message || "Unable to sign out. Please try again.");
      setIsSigningOut(false);
    }
  };

  const displayName = profile?.name || "Your workspace";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <NavLink className="brand" to="/dashboard"><img className="brand-mark" src={taskForgeLogo} alt="TaskForge" />TaskForge</NavLink>
          <p className="sidebar-kicker">Work, made visible</p>
        </div>
        <nav aria-label="Primary navigation">
          {navItems.map(({ to, label }) => (
            <NavLink key={to} className="nav-link" to={to}><span className={`nav-icon nav-icon-${label.toLowerCase()}`} aria-hidden="true" />{label}</NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <img className="user-avatar" src={userDefaultLogo} alt="Default user avatar" />
            <span><strong>{displayName}</strong><small>{profile?.email || "Signed in"}</small></span>
          </div>
          {signOutError && <p className="sidebar-error" role="alert">{signOutError}</p>}
          <button className="text-button sidebar-signout" type="button" onClick={handleSignOut} disabled={isSigningOut}>
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>
      <main className="main-content"><Outlet context={{ profile }} /></main>
    </div>
  );
};

export default AppLayout;
