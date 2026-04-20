import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";

const OwnerStaffDetailsPage = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();

  const [mode, setMode] = useState("edit");
  const [staff, setStaff] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    daysPerWeek: 6,
    startTime: "09:00",
    endTime: "17:00"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get(`/owner/staff/${staffId}`);
      const loaded = data.staff;
      setStaff(loaded);
      setForm({
        name: loaded.name,
        email: loaded.email,
        daysPerWeek: loaded.shift?.daysPerWeek || 6,
        startTime: loaded.shift?.startTime || "09:00",
        endTime: loaded.shift?.endTime || "17:00"
      });
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load staff details");
    }
  };

  useEffect(() => {
    load();
  }, [staffId]);

  const saveEdit = async (event) => {
    event.preventDefault();
    try {
      await api.patch(`/owner/staff/${staffId}`, {
        name: form.name,
        email: form.email,
        shift: {
          daysPerWeek: Number(form.daysPerWeek),
          startTime: form.startTime,
          endTime: form.endTime
        }
      });
      setSuccess("Staff details updated");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update staff");
    }
  };

  const deleteStaff = async () => {
    try {
      await api.delete(`/owner/staff/${staffId}`);
      navigate("/owner");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete staff");
    }
  };

  return (
    <section className="page-section">
      <header className="section-header">
        <h2>Staff Details</h2>
      </header>

      <div className="menu-mode-bar">
        <button
          type="button"
          className={`btn ${mode === "edit" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => {
            setMode("edit");
            setError("");
            setSuccess("");
          }}
        >
          Edit
        </button>
        <button
          type="button"
          className={`btn ${mode === "delete" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => {
            setMode("delete");
            setError("");
            setSuccess("");
          }}
        >
          Delete
        </button>
        <Link to="/owner" className="btn btn-secondary">Back to Staff List</Link>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}

      {staff ? (
        mode === "edit" ? (
          <form className="form" onSubmit={saveEdit}>
            <h3>Edit Staff Details</h3>

            <label className="field-label" htmlFor="staff-name">Name</label>
            <input
              id="staff-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <label className="field-label" htmlFor="staff-email">Email</label>
            <input
              id="staff-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <label className="field-label" htmlFor="staff-days">Shift Days Per Week</label>
            <input
              id="staff-days"
              type="number"
              min={1}
              max={7}
              value={form.daysPerWeek}
              onChange={(e) => setForm({ ...form, daysPerWeek: e.target.value })}
              required
            />

            <label className="field-label" htmlFor="staff-start">Shift Start Time</label>
            <input
              id="staff-start"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              required
            />

            <label className="field-label" htmlFor="staff-end">Shift End Time</label>
            <input
              id="staff-end"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              required
            />
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </form>
        ) : (
          <div className="form">
            <p><strong>Name:</strong> {staff.name}</p>
            <p><strong>Email:</strong> {staff.email}</p>
            <p><strong>Shift:</strong> {staff.shift?.daysPerWeek || 0} days/week</p>
            <p><strong>Time:</strong> {staff.shift?.startTime || "--:--"} - {staff.shift?.endTime || "--:--"}</p>
            <button type="button" className="btn btn-primary" onClick={deleteStaff}>Delete Staff</button>
          </div>
        )
      ) : null}
    </section>
  );
};

export default OwnerStaffDetailsPage;
