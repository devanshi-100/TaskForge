const Project = require("../models/Project");
const Workspace = require("../models/Workspace");
const Task = require("../models/Task");
const { handleControllerError, isNonEmptyString } = require("../utils/http");

const isWorkspaceMember = (workspace, userId) =>
  workspace.owner.toString() === userId ||
  workspace.members.some((memberId) => memberId.toString() === userId);

exports.createProject = async (req, res) => {
  try {
    const { name, description, workspaceId, members = [], dueDate, priority } = req.body;

    if (!isNonEmptyString(name) || !workspaceId) {
      return res.status(400).json({ message: "Project name and workspaceId are required" });
    }
    if (!Array.isArray(members)) {
      return res.status(400).json({ message: "Members must be an array" });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (!isWorkspaceMember(workspace, req.auth.id)) {
      return res.status(403).json({ message: "You are not a member of this workspace" });
    }

    const allowedMembers = new Set(workspace.members.map((memberId) => memberId.toString()));
    const projectMembers = [...new Set([req.auth.id, ...members.map(String)])];
    const invalidMember = projectMembers.find((memberId) => !allowedMembers.has(memberId));

    if (invalidMember) {
      return res.status(400).json({ message: "Project members must belong to the workspace" });
    }

    const project = await Project.create({
      name,
      description,
      workspace: workspaceId,
      owner: req.auth.id,
      members: projectMembers,
      dueDate,
      priority
    });

    res.status(201).json({ message: "Project created", project });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.getProjects = async (req, res) => {
  try {
    const { workspaceId, status } = req.query;
    const query = { members: req.auth.id };

    if (workspaceId) {
      query.workspace = workspaceId;
    }

    if (status) {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate("workspace", "name")
      .populate("owner", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("workspace", "name")
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.members.some((member) => member._id.toString() === req.auth.id)) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    res.json({ project });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.owner.toString() !== req.auth.id) {
      return res.status(403).json({ message: "Only the project owner can update this project" });
    }

    const allowedUpdates = ["name", "description", "status", "priority", "dueDate"];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    await project.save();

    res.json({ message: "Project updated", project });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.updateProjectMembers = async (req, res) => {
  try {
    const { members = [] } = req.body;
    if (!Array.isArray(members)) {
      return res.status(400).json({ message: "Members must be an array" });
    }
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.owner.toString() !== req.auth.id) {
      return res.status(403).json({ message: "Only the project owner can update members" });
    }

    const workspace = await Workspace.findById(project.workspace);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    const allowedMembers = new Set(workspace.members.map((memberId) => memberId.toString()));
    const nextMembers = [...new Set([project.owner.toString(), ...members.map(String)])];
    const invalidMember = nextMembers.find((memberId) => !allowedMembers.has(memberId));

    if (invalidMember) {
      return res.status(400).json({ message: "Project members must belong to the workspace" });
    }

    const removedMembers = project.members
      .map((memberId) => memberId.toString())
      .filter((memberId) => !nextMembers.includes(memberId));

    project.members = nextMembers;
    await project.save();
    if (removedMembers.length) {
      await Task.updateMany(
        { project: project._id, assignedTo: { $in: removedMembers } },
        { $unset: { assignedTo: "" } }
      );
    }
    await project.populate("members", "name email");

    res.json({ message: "Project members updated", project });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.owner.toString() !== req.auth.id) {
      return res.status(403).json({ message: "Only the project owner can delete this project" });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: "Project and its tasks deleted" });
  } catch (error) {
    handleControllerError(res, error);
  }
};
