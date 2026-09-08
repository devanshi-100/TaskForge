import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import { taskApi } from "../services/api";

const statusOptions = [
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" }
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" }
];

const formatDate = (date) => date
  ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(date))
  : "Not set";

const formatDateInput = (date) => {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const TaskDetailsPage = () => {
  const { taskId } = useParams();
  console.log("Task id:",taskId);
  const { profile } = useOutletContext() || {};
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const assigneeOptions = useMemo(() => task?.project?.members || [], [task?.project?.members]);
  const isProjectOwner = Boolean(profile?.id && task?.project?.owner && String(profile.id) === String(task.project.owner));

  useEffect(() => {
    const loadTask = async () => {
      try {
        const data = await taskApi.getById(taskId);
        setTask(data.task);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [taskId]);

  const handleTaskChange = (event) => {
    const { name, value } = event.target;
    setTask((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSaveTask = async (event) => {
    event.preventDefault();
    if (!task?.title?.trim()) {
      setError("Task title is required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        title: task.title.trim(),
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate || undefined,
        assignedTo: task.assignedTo?._id || task.assignedTo || null
      };

      const data = await taskApi.update(taskId, payload);
      setTask(data.task);
      setSuccess("Task updated successfully.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (event) => {
    const nextStatus = event.target.value;
    if (!task || nextStatus === task.status) return;

    setError("");
    setSuccess("");

    try {
      const data = await taskApi.updateStatus(taskId, nextStatus);
      setTask(data.task);
      setSuccess("Task status updated.");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    setError("");
    try {
      await taskApi.delete(taskId);
      navigate(projectLink, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
      setIsDeleting(false);
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    const trimmedComment = commentText.trim();
    if (!trimmedComment) return;

    setIsCommenting(true);
    setError("");
    setSuccess("");

    try {
      const data = await taskApi.addComment(taskId, trimmedComment);
      setTask((current) => ({
        ...current,
        comments: [...(current?.comments || []), data.comment]
      }));
      setCommentText("");
      setSuccess("Comment added.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsCommenting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Task details" description="Loading task information..." />
        <section className="card"><p>Fetching task details…</p></section>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <PageHeader title="Task details" description="This task could not be found." />
        <section className="card"><p>Try returning to the project board and selecting another task.</p></section>
      </>
    );
  }

  const assignedMember = task.assignedTo || null;
  const projectLink = task.project?._id ? `/projects/${task.project._id}` : "/projects";

  return (
    <>
      <PageHeader
        title={task.title}
        description={task.project?.name ? `${task.project.name} • ${statusOptions.find((option) => option.value === task.status)?.label || task.status}` : "Task overview"}
        action={<div className="flex items-center gap-3"><Link className="back-link" to={projectLink}>← Back to project</Link>{isProjectOwner && <button className="icon-button" type="button" title="Delete task" aria-label="Delete task" onClick={handleDeleteTask} disabled={isDeleting}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 4h4l1 3H9l1-3Zm-4 3 1 13h10l1-13M10 11v5m4-5v5" /></svg></button>}</div>}
      />

      {error && <div className="form-error mb-6" role="alert">{error}</div>}
      {success && <div className="form-success mb-6" role="status">{success}</div>}

      <section className="two-column task-details-layout">
        <article className="card task-editor">
          <form className="task-form" onSubmit={handleSaveTask}>
            <label>
              <span>Task title</span>
              <input name="title" value={task.title || ""} onChange={handleTaskChange} placeholder="Task title" required />
            </label>

            <label>
              <span>Description</span>
              <textarea name="description" rows="6" value={task.description || ""} onChange={handleTaskChange} placeholder="What needs to be done?" />
            </label>

            <div className="form-row">
              <label>
                <span>Status</span>
                <select name="status" value={task.status || "todo"} onChange={(event) => {
                  handleTaskChange(event);
                  handleStatusChange(event);
                }}>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Priority</span>
                <select name="priority" value={task.priority || "medium"} onChange={handleTaskChange}>
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                <span>Assignee</span>
                <select name="assignedTo" value={assignedMember?._id || ""} onChange={(event) => {
                  const nextValue = event.target.value;
                  setTask((current) => ({
                    ...current,
                    assignedTo: nextValue ? ({ ...current.assignedTo, _id: nextValue }) : null
                  }));
                }}>
                  <option value="">Unassigned</option>
                  {assigneeOptions.map((member) => (
                    <option key={member._id} value={member._id}>{member.name}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Due date</span>
                <input
                  type="date"
                  name="dueDate"
                  value={formatDateInput(task.dueDate || "")}
                  onChange={handleTaskChange}
                />
              </label>
            </div>

            <div className="task-info">
              <strong className="task-info-heading">Task info</strong>
              <p><strong>Created by:</strong> {task.createdBy?.name || "Unknown"}</p>
              <p><strong>Workspace:</strong> {task.workspace?.name || "Workspace"}</p>
              <p><strong>Due date:</strong> {formatDate(task.dueDate)}</p>
              <p><strong>Completed:</strong> {task.completedAt ? formatDate(task.completedAt) : "Not completed"}</p>
            </div>

            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </article>

        <article className="card comments-panel">
          <h2>Comments</h2>
          <div className="grid gap-4">
            {task.comments?.length ? (
              <div className="grid gap-3">
                {task.comments.map((comment) => (
                  <div key={comment._id} className="comment-card">
                    <div className="comment-meta">
                      <strong>{comment.author?.name || "Member"}</strong>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                    <p>{comment.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No comments yet. Add the first update.</p>
            )}

            <form onSubmit={handleCommentSubmit} className="comment-form">
              <label>
                <span>Add comment</span>
                <textarea
                  rows="4"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Share an update or note for the team..."
                />
              </label>
              <button type="submit" disabled={isCommenting || !commentText.trim()}>
                {isCommenting ? "Posting..." : "Post comment"}
              </button>
            </form>
          </div>
        </article>
      </section>
    </>
  );
};

export default TaskDetailsPage;
