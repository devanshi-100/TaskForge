const Project = require("../models/Project");
const Task = require("../models/Task");
const { handleControllerError, isNonEmptyString } = require("../utils/http");

const taskStatuses = ["todo", "in-progress", "review", "done"];

const isProjectMember = (project, userId) =>
  project && project.members.some((member) => String(member._id || member) === string(userId));

exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, dueDate, priority, status, labels } = req.body;

    if (!isNonEmptyString(title) || !projectId) {
      return res.status(400).json({ message: "Task title and projectId are required" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isProjectMember(project, req.auth.id)) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    if (assignedTo && !isProjectMember(project, assignedTo)) {
      return res.status(400).json({ message: "Assigned user must be a project member" });
    }

    const task = await Task.create({
      title,
      description,
      project: project._id,
      workspace: project.workspace,
      assignedTo,
      createdBy: req.auth.id,
      dueDate,
      priority,
      status,
      labels
    });

    res.status(201).json({ message: "Task created", task });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { projectId, workspaceId, assignedTo, status, priority } = req.query;
    const query = {};

    if (workspaceId) query.workspace = workspaceId;
    if (assignedTo) query.assignedTo = assignedTo;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const visibleProjects = await Project.find({ members: req.auth.id }).select("_id");
    query.project = { $in: visibleProjects.map((project) => project._id) };
    if (projectId) query.$and = [{ project: projectId }];

    const tasks = await Task.find(query)
      .populate("project", "name status")
      .populate("workspace", "name")
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate({
        path: "project",
        select: "name members owner",
        populate: { path: "members", select: "name email" }
      })
      .populate("workspace", "name")
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!isProjectMember(task.project, req.auth.id)) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    res.json({ task });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    if (!isProjectMember(project, req.auth.id)) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    const canEdit = task.createdBy.toString() === req.auth.id ||
      task.assignedTo?.toString() === req.auth.id ||
      project.owner.toString() === req.auth.id;
    if (!canEdit) {
      return res.status(403).json({ message: "Only the task creator, assignee, or project owner can update this task" });
    }

    if (req.body.assignedTo && !isProjectMember(project, req.body.assignedTo)) {
      return res.status(400).json({ message: "Assigned user must be a project member" });
    }

    const allowedUpdates = [
      "title",
      "description",
      "status",
      "priority",
      "dueDate",
      "assignedTo",
      "labels"
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    if (req.body.status === "done" && !task.completedAt) {
      task.completedAt = new Date();
    }

    if (req.body.status && req.body.status !== "done") {
      task.completedAt = undefined;
    }

    await task.save();
    await task.populate("assignedTo", "name email");

    res.json({ message: "Task updated", task });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!taskStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid task status" });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isProjectMember(project, req.auth.id)) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    task.status = status;
    task.completedAt = status === "done" ? new Date() : undefined;

    await task.save();

    res.json({ message: "Task status updated", task });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.addTaskComment = async (req, res) => {
  try {
    const { body } = req.body;
    const task = await Task.findById(req.params.id);

    if (!isNonEmptyString(body)) {
      return res.status(400).json({ message: "Comment body is required" });
    }

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isProjectMember(project, req.auth.id)) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    task.comments.push({
      body,
      author: req.auth.id
    });

    await task.save();
    await task.populate("comments.author", "name email");

    res.status(201).json({
      message: "Comment added",
      comment: task.comments[task.comments.length - 1]
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.deleteTaskComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isProjectMember(project, req.auth.id)) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    const comment = task.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.author.toString() !== req.auth.id && project.owner.toString() !== req.auth.id) {
      return res.status(403).json({ message: "Only the comment author or project owner can delete it" });
    }

    comment.deleteOne();
    await task.save();

    res.json({ message: "Comment deleted" });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isProjectMember(project, req.auth.id)) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    if (project.owner.toString() !== req.auth.id) {
      return res.status(403).json({ message: "Only the project owner can delete this task" });
    }

    await task.deleteOne();

    res.json({ message: "Task deleted" });
  } catch (error) {
    handleControllerError(res, error);
  }
};
