import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import { projectApi, taskApi, workspaceApi } from "../services/api";

const columns = [
  { id: "todo", title: "To do", accent: "violet" },
  { id: "in-progress", title: "In progress", accent: "amber" },
  { id: "done", title: "Done", accent: "emerald" }
];

const initialForm = {
  title: "",
  description: "",
  priority: "medium",
  assignedTo: "",
  dueDate: ""
};

const statusForColumn = (status) => status === "review" ? "in-progress" : status;

const formatDate = (date) => date
  ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(date))
  : null;

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const { profile } = useOutletContext() || {};
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [movingTaskId, setMovingTaskId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [isUpdatingMembers, setIsUpdatingMembers] = useState(false);
  const navigate = useNavigate();
  const isProjectOwner = Boolean(profile?.id && project?.owner?._id && String(profile.id) === String(project.owner._id));
  const projectMemberIds = new Set((project?.members || []).map((member) => String(member._id)));

  useEffect(() => {
    const loadBoard = async () => {
      try {
        const [projectData, taskData] = await Promise.all([
          projectApi.getById(projectId),
          taskApi.get({ projectId })
        ]);
        const workspaceData = await workspaceApi.getById(projectData.project.workspace?._id);
        setProject({
          ...projectData.project,
          workspace: { ...projectData.project.workspace, members: workspaceData.members || [] }
        });
        setTasks(taskData.tasks || []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadBoard();
  }, [projectId]);

  const moveTask = async (taskId, nextStatus) => {
    const previousTasks = tasks;
    const task = tasks.find((item) => item._id === taskId);
    if (!task || statusForColumn(task.status) === nextStatus) return;

    setMovingTaskId(taskId);
    setError("");
    setTasks(tasks.map((item) => item._id === taskId ? { ...item, status: nextStatus } : item));
    try {
      await taskApi.updateStatus(taskId, nextStatus);
    } catch (requestError) {
      setTasks(previousTasks);
      setError(requestError.message);
    } finally {
      setMovingTaskId(null);
    }
  };

  const handleDrop = (event, status) => {
    event.preventDefault();
    if (draggedTaskId) moveTask(draggedTaskId, status);
    setDraggedTaskId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const data = await taskApi.create({
        ...form,
        projectId,
        dueDate: form.dueDate || undefined,
        assignedTo: form.assignedTo || undefined
      });
      setTasks((current) => [data.task, ...current]);
      setForm(initialForm);
      setIsModalOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Delete "${project.name}" and all of its tasks? This cannot be undone.`)) return;
    setIsDeleting(true);
    setError("");
    try {
      await projectApi.delete(projectId);
      navigate("/projects", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
      setIsDeleting(false);
    }
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;

    setDeletingTaskId(task._id);
    setError("");
    try {
      await taskApi.delete(task._id);
      setTasks((current) => current.filter((item) => item._id !== task._id));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleUpdateMembers = async (event) => {
    event.preventDefault();
    setIsUpdatingMembers(true);
    setError("");
    try {
      const data = await projectApi.updateMembers(projectId, [...projectMemberIds]);
      setProject((current) => ({ ...current, members: data.project.members }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsUpdatingMembers(false);
    }
  };

  return (
    <>
      <PageHeader
        title={project?.name || "Project board"}
        description={project?.description || "Move each task forward as the work progresses."}
        action={<div className="flex items-center gap-2"><button type="button" onClick={() => setIsModalOpen(true)}>+ Add task</button>{isProjectOwner && <button className="icon-button" type="button" title="Delete project" aria-label="Delete project" onClick={handleDeleteProject} disabled={isDeleting}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 4h4l1 3H9l1-3Zm-4 3 1 13h10l1-13M10 11v5m4-5v5" /></svg></button>}</div>}
      />
      {error && <div className="form-error mb-6" role="alert">{error}</div>}
      {isLoading ? (
        <section className="board" aria-label="Loading project board">
          {columns.map((column) => <div className="kanban-column kanban-skeleton" key={column.id} />)}
        </section>
      ) : (
        <section className="board" aria-label="Project task board">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => statusForColumn(task.status) === column.id);
            return (
              <article
                className={`kanban-column kanban-${column.accent}`}
                key={column.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, column.id)}
              >
                <header className="kanban-column-header">
                  <div><span className="column-dot" /><h2>{column.title}</h2></div>
                  <span className="task-count">{columnTasks.length}</span>
                </header>
                <div className="task-stack">
                  {columnTasks.length ? columnTasks.map((task) => (
                    <article
                      className={`task-card priority-${task.priority || "medium"} ${movingTaskId === task._id ? "task-card-moving" : ""}`}
                      draggable={movingTaskId !== task._id}
                      key={task._id}
                      onDragStart={() => setDraggedTaskId(task._id)}
                      onDragEnd={() => setDraggedTaskId(null)}
                    >
                      <div className="task-card-topline"><span className="priority-label">{task.priority || "medium"}</span>{task.dueDate && <span className="task-date">{formatDate(task.dueDate)}</span>}</div>
                      <Link className="task-title" to={`/tasks/${task._id}`}>{task.title}</Link>
                      {task.description && <p>{task.description}</p>}
                      <footer className="task-card-footer">
                        <span className="assignee-avatar" title={task.assignedTo?.name || "Unassigned"}>{(task.assignedTo?.name || "U").charAt(0).toUpperCase()}</span>
                        <div className="flex items-center gap-2">
                          {isProjectOwner && (
                            <button
                              className="icon-button task-delete-button"
                              type="button"
                              title="Delete task"
                              aria-label={`Delete task ${task.title}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteTask(task);
                              }}
                              onPointerDown={(event) => event.stopPropagation()}
                              disabled={deletingTaskId === task._id}
                            >
                              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 4h4l1 3H9l1-3Zm-4 3 1 13h10l1-13M10 11v5m4-5v5" />
                              </svg>
                            </button>
                          )}
                          <span className="drag-hint" aria-label="Draggable task">↕</span>
                        </div>
                      </footer>
                    </article>
                  )) : <p className="column-empty">Drop tasks here</p>}
                </div>
              </article>
            );
          })}
        </section>
      )}
      {isProjectOwner && (
        <section className="card mb-6">
          <h2>Project members</h2>
          <p className="mt-1 text-sm text-slate-500">Project members can view the project and be assigned tasks.</p>
          <form className="mt-4 grid gap-3" onSubmit={handleUpdateMembers}>
            <div className="grid gap-2 rounded-lg border border-slate-200 p-3">
              {(project?.workspace?.members || project?.members || []).map((member) => (
                <label className="flex items-center gap-2 text-sm" key={member._id}>
                  <input
                    type="checkbox"
                    checked={projectMemberIds.has(String(member._id))}
                    disabled={String(member._id) === String(project.owner?._id)}
                    onChange={(event) => {
                      const nextMembers = new Set(projectMemberIds);
                      if (event.target.checked) nextMembers.add(String(member._id));
                      else nextMembers.delete(String(member._id));
                      setProject((current) => ({
                        ...current,
                        members: [...nextMembers].map((memberId) =>
                          (current.members || []).find((item) => String(item._id) === memberId) || { _id: memberId, name: memberId }
                        )
                      }));
                    }}
                  />
                  <span>{member.name || member.email || "Member"}</span>
                </label>
              ))}
            </div>
            <button disabled={isUpdatingMembers} type="submit">
              {isUpdatingMembers ? "Saving members..." : "Save members"}
            </button>
          </form>
        </section>
      )}
      <Link className="back-link" to="/projects">← Back to projects</Link>
      {isModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
          <form className="task-modal" onSubmit={handleSubmit}>
            <div className="modal-heading"><div><h2 id="task-modal-title">Add a task</h2><p>Give the next piece of work a clear home.</p></div><button className="modal-close" type="button" aria-label="Close dialog" onClick={() => setIsModalOpen(false)}>x</button></div>
            <label>Task title<input autoFocus required maxLength="120" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Map the onboarding flow" /></label>
            <label>Description<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What does done look like?" /></label>
            <div className="form-row"><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label>Due date<input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label></div>
            <label>Assignee<select value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })}><option value="">Unassigned</option>{(project?.members || []).map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}</select></label>
            <button disabled={isSubmitting} type="submit">{isSubmitting ? "Adding..." : "Add task"}</button>
          </form>
        </div>
      )}
    </>
  );
};

export default ProjectDetailsPage;
