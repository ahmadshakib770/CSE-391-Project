import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="centered minimal-home">
      <h1>ResApp</h1>

      <section className="auth-actions">
        <h2>Owner</h2>
        <div className="row">
          <Link to="/owner/login" className="card-link btn-like">Owner Sign In</Link>
          <Link to="/owner/register" className="card-link btn-like">Owner Sign Up</Link>
        </div>
      </section>

      <section className="auth-actions">
        <h2>Staff</h2>
        <div className="row">
          <Link to="/staff/login" className="card-link btn-like">Staff Sign In</Link>
          <Link to="/staff/register" className="card-link btn-like">Staff Sign Up</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
