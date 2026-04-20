import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const AuthForm = ({ role, mode }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    daysPerWeek: 6,
    startTime: "09:00",
    endTime: "17:00"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isRegister = mode === "register";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        email: form.email,
        password: form.password
      };

      if (isRegister) {
        payload.name = form.name;
      }

      if (isRegister && role === "staff") {
        payload.shift = {
          daysPerWeek: Number(form.daysPerWeek),
          startTime: form.startTime,
          endTime: form.endTime
        };
      }

      const endpoint = `/auth/${role}/${isRegister ? "register" : "login"}`;
      const { data } = await api.post(endpoint, payload);
      login(data);
      navigate(`/${role}`);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.request
          ? "Cannot reach backend API. Ensure backend is running and MongoDB Atlas connection is valid."
          : "Request failed");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <section className="auth-side">
        <p className="eyebrow">TableEase</p>
        <h2>Restaurant Workforce Platform</h2>
        <p>{role === "owner" ? "Owner" : "Staff"} portal for daily operations and coordination.</p>
      </section>

      <section className="auth-main">
        <div className="auth-card card-panel">
          <p className="eyebrow">{role === "owner" ? "Owner Portal" : "Staff Portal"}</p>
          <h1>{isRegister ? "Create Account" : "Welcome Back"}</h1>
          <p className="lead-text compact">{role === "owner" ? "Owner" : "Staff"} {isRegister ? "Registration" : "Sign In"}</p>

          <form onSubmit={handleSubmit} className="form">
            {isRegister ? <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} required /> : null}
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required minLength={6} />

            {isRegister && role === "staff" ? (
              <>
                <input name="daysPerWeek" type="number" min={1} max={7} value={form.daysPerWeek} onChange={handleChange} required />
                <input name="startTime" type="time" value={form.startTime} onChange={handleChange} required />
                <input name="endTime" type="time" value={form.endTime} onChange={handleChange} required />
              </>
            ) : null}

            {error ? <p className="error">{error}</p> : null}
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Please wait..." : isRegister ? "Register" : "Login"}</button>
          </form>

          <div className="row">
            {isRegister ? (
              <Link to={`/${role}/login`} className="text-link">Go to Sign In</Link>
            ) : (
              <Link to={`/${role}/register`} className="text-link">Go to Sign Up</Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthForm;
