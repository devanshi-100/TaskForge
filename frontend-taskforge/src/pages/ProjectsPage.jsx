import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import { projectApi, workspaceApi } from "../services/api";

const initialForm = {
  name: "",
  description: "",
  workspaceId: "",
  members: [],
  priority: "medium",
  dueDate: "",
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedWorkspace = workspaces.find((workspace) => workspace._id === form.workspaceId);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const [projectData, workspaceData] = await Promise.all([
          projectApi.get(status ? { status } : {}),
          workspaceApi.getMine(),
        ]);
        const availableWorkspaces = workspaceData.workspaces || [];
        setProjects(projectData.projects || []);
        setWorkspaces(availableWorkspaces);
        setForm((current) => ({
          ...current,
          workspaceId: current.workspaceId || availableWorkspaces[0]?._id || "",
            members: current.members.filter((memberId) =>
              availableWorkspaces.find((workspace) => workspace._id === (current.workspaceId || availableWorkspaces[0]?._id))?.members?.some((member) => member._id === memberId)
            ),
        }));
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadProjects();
  }, [status]);

  const closeModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setForm((current) => ({
        ...initialForm,
        workspaceId: current.workspaceId || workspaces[0]?._id || "",
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const data = await projectApi.create({
        ...form,
        members: form.members,
        dueDate: form.dueDate || undefined,
      });
      setProjects((current) => [data.project, ...current]);
      setIsModalOpen(false);
      setForm((current) => ({
        ...initialForm,
        workspaceId: current.workspaceId,
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDueDate = (dueDate) =>
    dueDate
      ? new Intl.DateTimeFormat(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(new Date(dueDate))
      : "No due date";

  return (
    <>
      <PageHeader
        title="Projects"
        description="Turn team goals into focused, trackable work."
        action={
          <button
            type="button"
            disabled={!workspaces.length}
            onClick={() => setIsModalOpen(true)}
          >
            New project
          </button>
        }
      />
      {error && (
        <div
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm text-slate-500">
          {projects.length} project{projects.length === 1 ? "" : "s"}
        </p>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          Status
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            value={status}
            onChange={(event) => {
              setIsLoading(true);
              setStatus(event.target.value);
            }}
          >
            <option value="">All statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On hold</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </div>
      {isLoading ? (
        <section
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="Loading projects"
        >
          {[1, 2, 3].map((item) => (
            <div
              className="h-48 animate-pulse rounded-xl bg-slate-200"
              key={item}
            />
          ))}
        </section>
      ) : projects.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link
              className="group rounded-xl border border-slate-200 bg-white p-5 text-inherit no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
              key={project._id}
              to={`/projects/${project._id}`}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700">
                  {project.status || "planning"}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {project.priority || "medium"}
                </span>
              </div>
              <h2 className="mb-2 text-lg font-bold text-slate-900 group-hover:text-indigo-700">
                {project.name}
              </h2>
              <p className="line-clamp-2 min-h-10 text-sm text-slate-500">
                {project.description || "No description added yet."}
              </p>
              <div className="mt-5 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>{project.workspace?.name || "Workspace"}</span>
                <span>{formatDueDate(project.dueDate)}</span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-indigo-100 text-xl text-indigo-700">
            +
          </div>
          <h2 className="mt-4 text-xl font-bold">Create your first project</h2>
          <p className="mx-auto mt-2 max-w-md text-slate-500">
            Projects give your team a clear place to plan, prioritize, and
            finish work.
          </p>
          <button
            className="mt-6"
            disabled={!workspaces.length}
            type="button"
            onClick={() => setIsModalOpen(true)}
          >
            Create project
          </button>
        </section>
      )}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
        >
          <form
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onSubmit={handleSubmit}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold" id="project-modal-title">
                  Create project
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Give the work a home and a clear direction.
                </p>
              </div>
              <button
                aria-label="Close dialog"
                className="bg-transparent p-1 text-xl text-slate-400 hover:bg-transparent hover:text-slate-700"
                type="button"
                onClick={closeModal}
              >
                x
              </button>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-semibold">
                Project name
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  autoFocus
                  required
                  maxLength="80"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. Website refresh"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Workspace
                <select
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                  value={form.workspaceId}
                  onChange={(event) =>
                    setForm({ ...form, workspaceId: event.target.value, members: [] })
                  }
                >
                  <option value="" disabled>
                    Select a workspace
                  </option>
                  {workspaces.map((workspace) => (
                    <option key={workspace._id} value={workspace._id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="grid gap-2 text-sm">
                <legend className="font-semibold">Assign project members</legend>
                <p className="m-0 text-xs font-normal text-slate-500">Select workspace members who should access this project.</p>
                {selectedWorkspace?.members?.length ? (
                  <div className="grid gap-2 rounded-lg border border-slate-200 p-3">
                    {selectedWorkspace.members.map((member) => (
                      <label className="flex items-center gap-2 font-normal" key={member._id}>
                        <input
                          type="checkbox"
                          checked={form.members.includes(member._id)}
                          onChange={(event) => setForm({
                            ...form,
                            members: event.target.checked
                              ? [...new Set([...form.members, member._id])]
                              : form.members.filter((memberId) => memberId !== member._id)
                          })}
                        />
                        <span>{member.name} <span className="text-slate-400">({member.email})</span></span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="m-0 text-xs font-normal text-slate-500">No other workspace members are available.</p>
                )}
              </fieldset>
              <label className="grid gap-1.5 text-sm font-semibold">
                Description
                <textarea
                  className="min-h-24 rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  maxLength="500"
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="What does this project aim to accomplish?"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold">
                  Priority
                  <select
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    value={form.priority}
                    onChange={(event) =>
                      setForm({ ...form, priority: event.target.value })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-semibold">
                  Due date
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      setForm({ ...form, dueDate: event.target.value })
                    }
                  />
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="bg-transparent text-slate-600 hover:bg-slate-100"
                type="button"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Creating..." : "Create project"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ProjectsPage;
