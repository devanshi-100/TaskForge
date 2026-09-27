const Project = require("../models/Project");
const Task = require("../models/Task");

const syncProjectCompletionStatus = async (projectId) => {
  const [project, hasTasks, hasOpenTasks] = await Promise.all([
    Project.findById(projectId),
    Task.exists({ project: projectId }),
    Task.exists({ project: projectId, status: { $ne: "done" } })
  ]);

  if (!project) return null;

  if (project.status === "on-hold") return project;

  let nextStatus = "planning";
  if (hasTasks) {
    nextStatus = hasOpenTasks ? "active" : "completed";
  }
  if (project.status !== nextStatus) {
    project.status = nextStatus;
    await project.save();
  }

  return project;
};

module.exports = { syncProjectCompletionStatus };
