import DashboardLayout from "../../layouts/DashboardLayout";

const links = [
  { to: "/staff", label: "Create Order" },
  { to: "/staff/orders", label: "Order List" },
  { to: "/staff/tasks", label: "My Tasks" }
];

const StaffDashboard = () => <DashboardLayout title="Staff Panel" links={links} />;

export default StaffDashboard;
