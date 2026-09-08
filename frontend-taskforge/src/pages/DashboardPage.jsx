import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import { projectApi, taskApi, workspaceApi } from "../services/api";

const startOfWeek = () => {
  const date = new Date();
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDate = (date) => date
  ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(date))
  : "No due date";

const DashboardPage = () => {
  const [data, setData] = useState({ workspaces: [], projects: [], tasks: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [workspaceData, projectData, taskData] = await Promise.all([
          workspaceApi.getMine(),
          projectApi.get(),
          taskApi.get()
        ]);
        setData({
          workspaces: workspaceData.workspaces || [],
          projects: projectData.projects || [],
          tasks: taskData.tasks || []
        });
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const weekStart = startOfWeek();
    return [
      { value: data.tasks.filter((task) => task.status !== "done").length, label: "Open tasks", tone: "indigo" },
      { value: data.tasks.filter((task) => task.dueDate && new Date(task.dueDate) >= weekStart && new Date(task.dueDate) < new Date(weekStart.getTime() + 7 * 86400000) && task.status !== "done").length, label: "Due this week", tone: "amber" },
      { value: data.projects.filter((project) => project.status === "active").length, label: "Active projects", tone: "violet" },
      { value: data.tasks.filter((task) => task.status === "done").length, label: "Completed tasks", tone: "emerald" }
    ];
  }, [data]);

  return (
    <>
      <PageHeader title="Good to see you" description="Here’s the pulse of your work across every workspace." action={<Link className="button-link" to="/projects">View projects</Link>} />
      {error && <div className="form-error mb-6" role="alert">{error}</div>}
      {isLoading ? <section className="stat-grid" aria-label="Loading dashboard">{[1, 2, 3, 4].map((item) => <div className="card metric-skeleton" key={item} />)}</section> : (
        <>
          <section className="stat-grid">
            {metrics.map((metric) => <article className={`card stat-card stat-card-${metric.tone}`} key={metric.label}><span className="stat-icon" aria-hidden="true" /><strong>{metric.value}</strong><span>{metric.label}</span></article>)}
          </section>
          <section className="dashboard-grid">
            <article className="card dashboard-panel">
              <div className="panel-heading"><div><p className="eyebrow">Keep moving</p><h2>Recent tasks</h2></div><Link to="/projects">See all</Link></div>
              {data.tasks.length ? <div className="recent-list">{data.tasks.slice(0, 5).map((task) => <Link className="recent-item" key={task._id} to={`/tasks/${task._id}`}><span className={`status-dot status-${task.status}`} /><span className="recent-item-copy"><strong>{task.title}</strong><small>{task.project?.name || "Project"} · {task.status === "done" ? "Completed" : formatDate(task.dueDate)}</small></span><span className="recent-arrow">→</span></Link>)}</div> : <div className="panel-empty"><span>✓</span><h3>Nothing is waiting</h3><p>When you add tasks, your latest work will appear here.</p><Link to="/projects">Open a project</Link></div>}
            </article>
            <article className="card dashboard-panel">
              <div className="panel-heading"><div><p className="eyebrow">Your spaces</p><h2>Workspaces</h2></div><Link to="/workspaces">Manage</Link></div>
              {data.workspaces.length ? <div className="workspace-list">{data.workspaces.slice(0, 4).map((workspace) => <Link className="workspace-item" key={workspace._id} to={`/workspaces/${workspace._id}`}><span className="workspace-mark">{workspace.name.charAt(0).toUpperCase()}</span><span><strong>{workspace.name}</strong><small>{workspace.members?.length || 1} member{workspace.members?.length === 1 ? "" : "s"}</small></span><span className="recent-arrow">→</span></Link>)}</div> : <div className="panel-empty"><span>+</span><h3>Start with a workspace</h3><p>Give your team a shared home for projects and tasks.</p><Link to="/workspaces">Create workspace</Link></div>}
            </article>
          </section>
        </>
      )}
    </>
  );
};

export default DashboardPage;