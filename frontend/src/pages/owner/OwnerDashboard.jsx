import DashboardLayout from "../../layouts/DashboardLayout";

const links = [
  { to: "/owner", label: "Staff List" },
  { to: "/owner/tasks", label: "Task Assignment" }
];

const OwnerDashboard = () => <DashboardLayout title="Owner Panel" links={links} />;

export default OwnerDashboard;
