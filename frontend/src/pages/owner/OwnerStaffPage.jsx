import { useEffect, useState } from "react";
import api from "../../api/client";

const OwnerStaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState("");

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

  const updateShift = async (staffId, shift) => {
    try {
      await api.patch(`/owner/staff/${staffId}/shift`, shift);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update shift");
    }
  };

  return (
    <section>
      <p className="eyebrow">Team Directory</p>
      <h2>Staff List & Workshift</h2>
      {error ? <p className="error">{error}</p> : null}
      <div className="grid">
        {staff.map((member) => (
          <article key={member._id} className="card">
            <h3>{member.name}</h3>
            <p>{member.email}</p>
            <p>
              {member.shift?.daysPerWeek || 0} days/week | {member.shift?.startTime || "--:--"} - {member.shift?.endTime || "--:--"}
            </p>
            <ShiftEditor member={member} onSave={updateShift} />
          </article>
        ))}
      </div>
    </section>
  );
};

const ShiftEditor = ({ member, onSave }) => {
  const [daysPerWeek, setDaysPerWeek] = useState(member.shift?.daysPerWeek || 6);
  const [startTime, setStartTime] = useState(member.shift?.startTime || "09:00");
  const [endTime, setEndTime] = useState(member.shift?.endTime || "17:00");

  return (
    <form
      className="mini-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(member._id, { daysPerWeek: Number(daysPerWeek), startTime, endTime });
      }}
    >
      <input type="number" min={1} max={7} value={daysPerWeek} onChange={(e) => setDaysPerWeek(e.target.value)} />
      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      <button type="submit">Save Shift</button>
    </form>
  );
};

export default OwnerStaffPage;
