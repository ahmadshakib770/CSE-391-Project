import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="centered landing-wrap">
      <section className="landing-hero card-panel">
        <h1 className="brand-title">TableEase</h1>
      </section>

      <section className="portal-grid">
        <article className="portal-column card-panel">
          <h2>Owner Portal</h2>
          <div className="stack-actions">
            <Link to="/owner/login" className="btn btn-primary">Owner Sign In</Link>
            <Link to="/owner/register" className="btn btn-secondary">Owner Sign Up</Link>
          </div>
        </article>

        <article className="portal-column card-panel">
          <h2>Staff Portal</h2>
          <div className="stack-actions">
            <Link to="/staff/login" className="btn btn-primary">Staff Sign In</Link>
            <Link to="/staff/register" className="btn btn-secondary">Staff Sign Up</Link>
          </div>
        </article>
      </section>
    </div>
  );
};

export default Home;
