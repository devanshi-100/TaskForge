import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import { workspaceApi } from "../services/api";

const WorkspacesPage = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const data = await workspaceApi.getMine();
        setWorkspaces(data.workspaces || []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadWorkspaces();
  }, []);

  const closeModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setForm({ name: "", description: "" });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const data = await workspaceApi.create(form);
      setWorkspaces((current) => [data.workspace, ...current]);
      setIsModalOpen(false);
      setForm({ name: "", description: "" });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Workspaces"
        description="Bring people, projects, and tasks together."
        action={<button type="button" onClick={() => setIsModalOpen(true)}>New workspace</button>}
      />

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}

      {isLoading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading workspaces">
          {[1, 2, 3].map((item) => <div className="h-44 animate-pulse rounded-xl bg-slate-200" key={item} />)}
        </section>
      ) : workspaces.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <Link className="group rounded-xl border border-slate-200 bg-white p-5 text-inherit no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md" key={workspace._id} to={`/workspaces/${workspace._id}`}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <span className="grid size-11 place-items-center rounded-lg bg-indigo-100 text-lg font-bold text-indigo-700">{workspace.name.charAt(0).toUpperCase()}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{workspace.members?.length || 1} member{workspace.members?.length === 1 ? "" : "s"}</span>
              </div>
              <h2 className="mb-2 text-lg font-bold text-slate-900 group-hover:text-indigo-700">{workspace.name}</h2>
              <p className="line-clamp-2 min-h-10 text-sm text-slate-500">{workspace.description || "No description added yet."}</p>
              <span className="mt-5 inline-block text-sm font-semibold text-indigo-700">Open workspace →</span>
            </Link>
          ))}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-indigo-100 text-xl text-indigo-700">+</div>
          <h2 className="mt-4 text-xl font-bold">Create your first workspace</h2>
          <p className="mx-auto mt-2 max-w-md text-slate-500">A workspace gives your team one home for projects, tasks, and progress.</p>
          <button className="mt-6" type="button" onClick={() => setIsModalOpen(true)}>Create workspace</button>
        </section>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="workspace-modal-title">
          <form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onSubmit={handleSubmit}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div><h2 className="text-xl font-bold" id="workspace-modal-title">Create workspace</h2><p className="mt-1 text-sm text-slate-500">You can invite teammates after creating it.</p></div>
              <button aria-label="Close dialog" className="bg-transparent p-1 text-xl text-slate-400 hover:bg-transparent hover:text-slate-700" type="button" onClick={closeModal}>×</button>
            </div>
            <label className="mb-4 grid gap-1.5 text-sm font-semibold">Workspace name<input className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" autoFocus required maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Product team" /></label>
            <label className="grid gap-1.5 text-sm font-semibold">Description <textarea className="min-h-28 rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" maxLength="500" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What will this workspace be used for?" /></label>
            <div className="mt-6 flex justify-end gap-3"><button className="bg-transparent text-slate-600 hover:bg-slate-100" type="button" onClick={closeModal}>Cancel</button><button disabled={isSubmitting} type="submit">{isSubmitting ? "Creating…" : "Create workspace"}</button></div>
          </form>
        </div>
      )}
    </>
  );
};

export default WorkspacesPage;
