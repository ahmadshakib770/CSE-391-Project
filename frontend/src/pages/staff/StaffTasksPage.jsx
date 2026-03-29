import { useEffect, useState } from "react";
import api from "../../api/client";

const StaffTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/staff/tasks");
      setTasks(data.tasks || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tasks");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (taskId, status) => {
    try {
      await api.patch(`/staff/tasks/${taskId}`, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task");
    }
  };

  return (
    <section>
      <p className="eyebrow">Daily Workflow</p>
      <h2>My Tasks</h2>
      {error ? <p className="error">{error}</p> : null}
      <div className="grid">
        {tasks.map((task) => (
          <article className="card" key={task._id}>
            <h3>{task.title}</h3>
            <p>{task.details}</p>
            <p>Assigned by: {task.assignedBy?.name}</p>
            <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
            <select value={task.status} onChange={(e) => updateStatus(task._id, e.target.value)}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </article>
        ))}
      </div>
    </section>
  );
};

export default StaffTasksPage;
