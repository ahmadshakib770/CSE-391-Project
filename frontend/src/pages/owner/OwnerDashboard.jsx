import DashboardLayout from "../../layouts/DashboardLayout";

const links = [
  { to: "/owner", label: "Staff List" },
  { to: "/owner/orders", label: "Order Tracking" },
  { to: "/owner/menu", label: "Menu Management" },
  { to: "/owner/tasks", label: "Task Assignment" },
  { to: "/owner/sales-report", label: "Sales Report" }
];

const OwnerDashboard = () => <DashboardLayout title="Owner Panel" links={links} />;

export default OwnerDashboard;
