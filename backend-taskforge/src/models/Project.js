// const mongoose = require("mongoose");
const mongoose=require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["planning", "active", "on-hold", "completed"],
      default: "planning"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    dueDate: { type: Date },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

ProjectSchema.index({ workspace: 1, status: 1 });
ProjectSchema.index({ members: 1 });

module.exports = mongoose.model("Project", ProjectSchema);
