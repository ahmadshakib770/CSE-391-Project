import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";

const normalizeText = (value) => String(value || "").toLowerCase().trim();

const OwnerStaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const filteredStaff = useMemo(() => {
    const query = normalizeText(searchTerm);
    if (!query) return staff;

    return staff.filter((member) => {
      const name = normalizeText(member.name);
      const email = normalizeText(member.email);
      return name.includes(query) || email.includes(query);
    });
  }, [staff, searchTerm]);

  const load = async () => {
    try {
      const { data } = await api.get("/owner/staff");
      setStaff(data.staff || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load staff");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="page-section">
      <header className="section-header">
        <h2>Staff List</h2>
      </header>

      <div className="row search-toolbar">
        <input
          className="search-input"
          placeholder="Search staff by name or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error ? <p className="error">{error}</p> : null}
      <div className="grid">
        {filteredStaff.length === 0 ? <p className="menu-placeholder">No staff matched your search.</p> : null}
        {filteredStaff.map((member) => (
          <article key={member._id} className="card">
            <h3>
              <Link to={`/owner/staff/${member._id}`} className="text-link">{member.name}</Link>
            </h3>
            <p>{member.email}</p>
            <p>
              {member.shift?.daysPerWeek || 0} days/week | {member.shift?.startTime || "--:--"} - {member.shift?.endTime || "--:--"}
            </p>
            <Link to={`/owner/staff/${member._id}`} className="btn btn-secondary">Open Details</Link>
          </article>
        ))}
      </div>
    </section>
  );
};

export default OwnerStaffPage;
