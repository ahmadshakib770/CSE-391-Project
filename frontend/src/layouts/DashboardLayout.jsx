import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DashboardLayout = ({ title, links }) => {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-block">
          {user?.role === "owner" ? <p className="eyebrow">Restaurant Admin</p> : null}
          <h2>{title}</h2>
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
        <section className="workspace-panel">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
