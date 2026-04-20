import { useEffect, useState } from "react";
import api from "../../api/client";

const OwnerTasksPage = () => {
  const [staff, setStaff] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: "", details: "", assignedTo: [], dueDate: "" });
  const [deletingTaskId, setDeletingTaskId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const toggleAssignedStaff = (staffId) => {
    setForm((prev) => {
      const exists = prev.assignedTo.includes(staffId);
      return {
        ...prev,
        assignedTo: exists
          ? prev.assignedTo.filter((id) => id !== staffId)
          : [...prev.assignedTo, staffId]
      };
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post("/owner/tasks", form);
      setForm({ title: "", details: "", assignedTo: [], dueDate: "" });
      setSuccess("Task assigned successfully");
      setError("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign task");
      setSuccess("");
    }
  };

  const deleteTask = async (taskId) => {
    try {
      setDeletingTaskId(taskId);
      await api.delete(`/owner/tasks/${taskId}`);
      setSuccess("Task deleted successfully");
      setError("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task");
      setSuccess("");
    } finally {
      setDeletingTaskId("");
    }
  };

  return (
    <section className="page-section">
      <header className="section-header">
        <p className="eyebrow">Operations Planner</p>
        <h2>Task Assignment</h2>
      </header>
      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}
      <form onSubmit={submit} className="form">
        <input placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea placeholder="Details" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
        <div className="staff-checkbox-panel">
          <p className="field-label">Assign to staff (choose one or more)</p>
          <div className="staff-checkbox-grid">
            {staff.map((member) => (
              <label key={member._id} className="staff-checkbox-item">
                <input
                  type="checkbox"
                  checked={form.assignedTo.includes(member._id)}
                  onChange={() => toggleAssignedStaff(member._id)}
                />
                <span>{member.name}</span>
              </label>
            ))}
          </div>
        </div>
        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
        <button type="submit" className="btn btn-primary">Assign Task</button>
      </form>

      <div className="grid task-admin-grid">
        {tasks.map((task) => (
          <article className="card task-admin-card" key={task._id}>
            <h3>{task.title}</h3>
            <p className="task-admin-text">{task.details || "No details"}</p>
            <p className="task-admin-text"><strong>Assigned:</strong> {task.assignedTo?.name}</p>
            <p className="task-admin-text"><strong>Status:</strong> {task.status}</p>
            <p className="task-admin-text"><strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => deleteTask(task._id)}
              disabled={deletingTaskId === task._id}
            >
              {deletingTaskId === task._id ? "Deleting..." : "Delete Task"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};

export default OwnerTasksPage;
