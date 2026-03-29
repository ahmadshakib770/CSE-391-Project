import { useEffect, useState } from "react";
import api from "../../api/client";

const OwnerTasksPage = () => {
  const [staff, setStaff] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: "", details: "", assignedTo: "", dueDate: "" });
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [staffRes, tasksRes] = await Promise.all([api.get("/owner/staff"), api.get("/owner/tasks")]);
      setStaff(staffRes.data.staff || []);
      setTasks(tasksRes.data.tasks || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tasks data");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post("/owner/tasks", form);
      setForm({ title: "", details: "", assignedTo: "", dueDate: "" });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign task");
    }
  };

  return (
    <section>
      <p className="eyebrow">Operations Planner</p>
      <h2>Task Assignment</h2>
      {error ? <p className="error">{error}</p> : null}
      <form onSubmit={submit} className="form">
        <input placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea placeholder="Details" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
        <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} required>
          <option value="">Assign to staff</option>
          {staff.map((member) => (
            <option key={member._id} value={member._id}>{member.name}</option>
          ))}
        </select>
        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
        <button type="submit">Assign Task</button>
      </form>

      <div className="grid">
        {tasks.map((task) => (
          <article className="card" key={task._id}>
            <h3>{task.title}</h3>
            <p>{task.details}</p>
            <p>Assigned: {task.assignedTo?.name}</p>
            <p>Status: {task.status}</p>
            <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default OwnerTasksPage;
