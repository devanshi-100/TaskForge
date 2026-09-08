import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import ProjectsPage from "./pages/ProjectsPage";
import SignupPage from "./pages/SignupPage";
import TaskDetailsPage from "./pages/TaskDetailsPage";
import WorkspaceDetailsPage from "./pages/WorkspaceDetailsPage";
import WorkspacesPage from "./pages/WorkspacesPage";

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route element={<AppLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/workspaces" element={<WorkspacesPage />} />
      <Route path="/workspaces/:workspaceId" element={<WorkspaceDetailsPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
      <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />
    </Route>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default App;
