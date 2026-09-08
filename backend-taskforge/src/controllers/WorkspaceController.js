const Workspace = require("../models/Workspace");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const { handleControllerError, isNonEmptyString } = require("../utils/http");

const isWorkspaceMember = (workspace, userId) =>
  workspace.owner.toString() === userId ||
  workspace.members.some((memberId) => (memberId._id || memberId).toString() === userId);

const isWorkspaceOwner = (workspace, userId) =>
  workspace.owner.toString() === userId;

exports.createWorkspace = async (req, res) => {
  try {

    const { name, description } = req.body;
    if (!isNonEmptyString(name)) {
      return res.status(400).json({ message: "Workspace name is required" });
    }

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.auth.id,
      members: [req.auth.id]
    });

    res.status(201).json({
      message: "Workspace created",
      workspace
    });

  } catch (error) {
    handleControllerError(res, error);
  }
};
exports.getMyWorkspaces = async (req, res) => {
  try {
    const workspaces =
      await Workspace.find({
        $or: [{ owner: req.auth.id }, { members: req.auth.id }]
      }).populate("members", "name email");

    res.status(200).json({
      workspaces
    });

  } catch (error) {
    handleControllerError(res, error);
  }
};
exports.getWorkspace = async (req,res) => {
  try {
    const workspace =
      await Workspace.findById(
        req.params.id
      )
        .populate(
          "owner",
          "name email"
        )
        .populate(
          "members",
          "name email"
        );


    if (!workspace) {
      return res.status(404).json({
        message:
          "Workspace not found"
      });
    }
    if (!isWorkspaceMember(workspace, req.auth.id)) {
      return res.status(403).json({
        message: "You are not a member of this workspace"
      });
    }
    res.json(workspace);

  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.updateWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (!isWorkspaceOwner(workspace, req.auth.id)) {
      return res.status(403).json({ message: "Only the workspace owner can update it" });
    }

    if (name !== undefined) {
      if (!isNonEmptyString(name)) {
        return res.status(400).json({ message: "Workspace name cannot be empty" });
      }
      workspace.name = name;
    }
    if (description !== undefined) workspace.description = description;

    await workspace.save();

    res.json({ message: "Workspace updated", workspace });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.addWorkspaceMember = async (req, res) => {
  try {
    const { email } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!isNonEmptyString(email)) {
      return res.status(400).json({ message: "Member email is required" });
    }

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (!isWorkspaceOwner(workspace, req.auth.id)) {
      return res.status(403).json({ message: "Only the workspace owner can add members" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!isWorkspaceMember(workspace, user._id.toString())) {
      workspace.members.push(user._id);
      await workspace.save();
    }

    await workspace.populate("members", "name email");

    res.json({ message: "Workspace member added", workspace });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.removeWorkspaceMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (!isWorkspaceOwner(workspace, req.auth.id)) {
      return res.status(403).json({ message: "Only the workspace owner can remove members" });
    }

    if (workspace.owner.toString() === memberId) {
      return res.status(400).json({ message: "Workspace owner cannot be removed" });
    }

    const isMember = workspace.members.some(
      (id) => id.toString() === memberId
    );

    if (!isMember) {
      return res.status(404).json({
        message: "User is not a member of this workspace"
      });
    }

    workspace.members = workspace.members.filter(
      (workspaceMemberId) => workspaceMemberId.toString() !== memberId
    );

    await workspace.save();

    await Project.updateMany(
      { workspace: workspace._id },
      { $pull: { members: memberId } }
    );

    await Task.updateMany(
      { workspace: workspace._id, assignedTo: memberId },
      { $unset: { assignedTo: "" } }
    );

    await workspace.populate([
      { path: "owner", select: "name email" },
      { path: "members", select: "name email" }
    ]);

    res.json({ message: "Workspace member removed", workspace });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.getWorkspaceSummary = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (!isWorkspaceMember(workspace, req.auth.id)) {
      return res.status(403).json({ message: "You are not a member of this workspace" });
    }

    const [
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      myTasks,
      overdueTasks
    ] = await Promise.all([
      Project.countDocuments({ workspace: workspace._id }),
      Project.countDocuments({ workspace: workspace._id, status: "active" }),
      Task.countDocuments({ workspace: workspace._id }),
      Task.countDocuments({ workspace: workspace._id, status: "done" }),
      Task.countDocuments({ workspace: workspace._id, assignedTo: req.auth.id }),
      Task.countDocuments({
        workspace: workspace._id,
        status: { $ne: "done" },
        dueDate: { $lt: new Date() }
      })
    ]);

    res.json({
      summary: {
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        myTasks,
        overdueTasks
      }
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (!isWorkspaceOwner(workspace, req.auth.id)) {
      return res.status(403).json({ message: "Only the workspace owner can delete it" });
    }

    await Task.deleteMany({ workspace: workspace._id });
    await Project.deleteMany({ workspace: workspace._id });
    await workspace.deleteOne();

    res.json({ message: "Workspace, projects, and tasks deleted" });
  } catch (error) {
    handleControllerError(res, error);
  }
};
