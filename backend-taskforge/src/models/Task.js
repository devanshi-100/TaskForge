const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["todo", "in-progress", "review", "done"],
      default: "todo"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    labels: [{ type: String, trim: true }],
    dueDate: { type: Date },
    completedAt: { type: Date },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    comments: [
      {
        body: { type: String, required: true, trim: true },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

TaskSchema.index({ workspace: 1, project: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model("Task", TaskSchema);
