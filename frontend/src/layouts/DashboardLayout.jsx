import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DashboardLayout = ({ title, links }) => {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Restaurant Management</p>
          <h2>{title}</h2>
          <p className="muted">{user?.name}</p>
        </div>
        {user?.role === "staff" && user?.shift ? (
          <div className="shift-box">
            <p className="shift-label">Shift</p>
            <p>{user.shift.daysPerWeek} days/week</p>
            <p>
              {user.shift.startTime} - {user.shift.endTime}
            </p>
          </div>
        ) : null}
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/owner" || link.to === "/staff"}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="danger-btn" type="button">
          Logout
        </button>
      </aside>
      <main className="content">
        <header className="content-topbar">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>{title}</h1>
          </div>
          <span className="role-pill">{user?.role}</span>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
