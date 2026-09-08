const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }
  return data;
};

export const authApi = {
  signup: (user) => request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(user)
  }),
  login: (credentials) => request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  }),
  getProfile: () => request("/auth/getProfile"),
  logout: () => request("/auth/logout", { method: "POST" })
};

export const workspaceApi = {
  getMine: () => request("/workspace/my"),
  getById: (workspaceId) => request(`/workspace/${workspaceId}`),
  getSummary: (workspaceId) => request(`/workspace/${workspaceId}/summary`),
  create: (workspace) => request("/workspace/create", {
    method: "POST",
    body: JSON.stringify(workspace)
  }),
  update: (workspaceId, updates) => request(`/workspace/${workspaceId}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  }),
  addMember: (workspaceId, email) => request(`/workspace/${workspaceId}/members`, {
    method: "POST",
    body: JSON.stringify({ email })
  }),
  removeMember: (workspaceId, memberId) => request(`/workspace/${workspaceId}/members/${memberId}`, {
    method: "DELETE"
  }),
  delete: (workspaceId) => request(`/workspace/${workspaceId}`, {
    method: "DELETE"
  })
};

export const projectApi = {
  get: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.workspaceId) params.set("workspaceId", filters.workspaceId);
    if (filters.status) params.set("status", filters.status);
    const query = params.toString();
    return request(`/projects/${query ? `?${query}` : ""}`);
  },
  getById: (projectId) => request(`/projects/${projectId}`),
  create: (project) => request("/projects", {
    method: "POST",
    body: JSON.stringify(project)
  }),
  update: (projectId, updates) => request(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  }),
  updateMembers: (projectId, members) => request(`/projects/${projectId}/members`, {
    method: "PATCH",
    body: JSON.stringify({ members })
  }),
  delete: (projectId) => request(`/projects/${projectId}`, {
    method: "DELETE"
  })
};

export const taskApi = {
  get: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.projectId) params.set("projectId", filters.projectId);
    if (filters.status) params.set("status", filters.status);
    const query = params.toString();
    return request(`/tasks/${query ? `?${query}` : ""}`);
  },
  getById: (taskId) => request(`/tasks/${taskId}`),
  create: (task) => request("/tasks", {
    method: "POST",
    body: JSON.stringify(task)
  }),
  delete: (taskId)=>request(`/tasks/${taskId}`,{
    method:"DELETE"
  }),
  update: (taskId, updates) => request(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  }),
  updateStatus: (taskId, status) => request(`/tasks/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  }),
  addComment: (taskId, body) => request(`/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body })
  }),
  deleteComment: (taskId, commentId) => request(`/tasks/${taskId}/comments/${commentId}`, {
    method: "DELETE"
  })
};
