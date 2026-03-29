import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import OwnerLogin from "./pages/auth/OwnerLogin";
import OwnerRegister from "./pages/auth/OwnerRegister";
import StaffLogin from "./pages/auth/StaffLogin";
import StaffRegister from "./pages/auth/StaffRegister";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerStaffPage from "./pages/owner/OwnerStaffPage";
import OwnerTasksPage from "./pages/owner/OwnerTasksPage";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffOrdersPage from "./pages/staff/StaffOrdersPage";
import StaffTasksPage from "./pages/staff/StaffTasksPage";

const RedirectByRole = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={`/${user.role}`} replace />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/owner/login" element={<OwnerLogin />} />
      <Route path="/owner/register" element={<OwnerRegister />} />
      <Route path="/staff/login" element={<StaffLogin />} />
      <Route path="/staff/register" element={<StaffRegister />} />

      <Route
        path="/owner"
        element={
          <ProtectedRoute role="owner">
            <OwnerDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<OwnerStaffPage />} />
        <Route path="tasks" element={<OwnerTasksPage />} />
      </Route>

      <Route
        path="/staff"
        element={
          <ProtectedRoute role="staff">
            <StaffDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<StaffOrdersPage />} />
        <Route path="tasks" element={<StaffTasksPage />} />
      </Route>

      <Route path="/dashboard" element={<RedirectByRole />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
