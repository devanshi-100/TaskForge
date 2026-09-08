import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import { projectApi, workspaceApi } from "../services/api";

const sum = (value) => Number.isFinite(value) ? value : 0;

const WorkspaceDetailsPage = () => {
  const { workspaceId } = useParams();
  const { profile } = useOutletContext() || {};
  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const inviteInputRef = useRef(null);
  const navigate = useNavigate();
  const ownerId = workspace?.owner?._id || workspace?.owner;
  const isWorkspaceOwner = Boolean(profile?.id && ownerId && String(ownerId) === String(profile.id));

  //this
  const loadWorkspace = async () => {
    try {
      const [workspaceData, projectData, summaryData] = await Promise.all([
        workspaceApi.getById(workspaceId),
        projectApi.get({ workspaceId }),
        workspaceApi.getSummary(workspaceId)
      ]);

      setWorkspace(workspaceData || null);
      setProjects(projectData.projects || []);
      setSummary(summaryData.summary || {});
    } catch (requestError) {
      setError(requestError.message);
    } 
  };

  useEffect(() => {
    setIsLoading(true);

    loadWorkspace().finally(() => {
      setIsLoading(false);
    });
  }, [workspaceId]);

  const handleInviteMember = async (event) => {
    event.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;

    setIsSubmitting(true);
    setError("");

    try {
      const data = await workspaceApi.addMember(workspaceId, email);
      setWorkspace(data.workspace);
      setInviteEmail("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const focusInviteForm = () => {
    inviteInputRef.current?.focus();
  };

  const handleRemoveMember = async (memberId) => {
    if (!memberId || !window.confirm("Remove this member from the workspace?")) {
      return;
    }

    setError("");
    try {
      await workspaceApi.removeMember(workspaceId, memberId);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm(`Delete "${workspace.name}" and all of its projects and tasks? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setError("");
    try {
      await workspaceApi.delete(workspaceId);
      navigate("/workspaces", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
      setIsDeleting(false);
    }
  };

  const deleteButton = isWorkspaceOwner && (
    <button className="icon-button" type="button" title="Delete workspace" aria-label="Delete workspace" onClick={handleDeleteWorkspace} disabled={isDeleting}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 4h4l1 3H9l1-3Zm-4 3 1 13h10l1-13M10 11v5m4-5v5" /></svg>
    </button>
  );

  if (isLoading) {
    return (
      <>
        <PageHeader title="Workspace" description="Loading workspace details..." />
        <section className="card"><p>Fetching workspace information…</p></section>
      </>
    );
  }

  if (!workspace) {
    return (
      <>
        <PageHeader title="Workspace" description="This workspace could not be loaded." />
        <section className="card"><p>Return to your workspaces and choose another one.</p></section>
      </>
    );
  }

  const summaryCards = [
    { label: "Projects", value: sum(summary?.totalProjects) },
    { label: "Active projects", value: sum(summary?.activeProjects) },
    { label: "Tasks", value: sum(summary?.totalTasks) },
    { label: "Completed", value: sum(summary?.completedTasks) },
    { label: "My tasks", value: sum(summary?.myTasks) },
    { label: "Overdue", value: sum(summary?.overdueTasks) }
  ];

  return (
    <>
      <PageHeader
        title={workspace.name}
        description={workspace.description || "A shared place for planning and shipping work."}
        action={isWorkspaceOwner ? <div className="flex items-center gap-2"><button type="button" onClick={focusInviteForm}>Invite member</button>{deleteButton}</div> : null}
      />

      {error && <div className="form-error mb-6" role="alert">{error}</div>}

      <section className="stat-grid mb-6">
        {summaryCards.map((item) => (
          <article className="card stat-card" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section className="two-column">
        <article className="card">
          <h2>Projects</h2>
          {projects.length ? (
            <div className="grid gap-3">
              {projects.map((project) => (
                <Link
                  key={project._id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-inherit no-underline transition hover:border-indigo-300 hover:bg-white"
                  to={`/projects/${project._id}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong>{project.name}</strong>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{project.status || "planning"}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{project.description || "No description yet."}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p>No projects yet. Create the first one for this workspace.</p>
          )}
          <Link className="mt-4 inline-block text-sm font-semibold" to="/projects">View all projects →</Link>
        </article>

        <article className="card">
          <h2>Members</h2>
          {isWorkspaceOwner && (
            <form className="mb-5 grid gap-3" onSubmit={handleInviteMember}>
              <label className="flex flex-row gap-3 items-center">
                <span>Invite by email</span>
                <input
                  ref={inviteInputRef}
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="team@example.com"
                  className="border border-gray-300 rounded-md px-3 py-2"
                />
              </label>
              <button type="submit" disabled={isSubmitting || !inviteEmail.trim()}>
                {isSubmitting ? "Adding..." : "Invite member"}
              </button>
            </form>
          )}

          <div className="grid gap-3">
            {(workspace.members || []).map((member) => (
              <div key={member._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <strong className="block">{member.name || "Member"}</strong>
                  <span className="text-sm text-slate-500">{member.email}</span>
                </div>
                {isWorkspaceOwner && String(ownerId) !== String(member._id) && (
                  <button type="button" className="bg-transparent px-2 py-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleRemoveMember(member._id)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </article>
      </section>

    </>
  );
};

export default WorkspaceDetailsPage;
