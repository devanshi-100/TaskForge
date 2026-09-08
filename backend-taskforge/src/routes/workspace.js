const express = require("express");

const router = express.Router();

const Auth = require("../middleware/Auth.js");

const WorkspaceController = require("../controllers/WorkspaceController.js");

router.post("/create", Auth, WorkspaceController.createWorkspace);

router.get("/my", Auth, WorkspaceController.getMyWorkspaces);

router.get("/:id/summary", Auth, WorkspaceController.getWorkspaceSummary);

router.get("/:id", Auth, WorkspaceController.getWorkspace);

router.patch("/:id", Auth, WorkspaceController.updateWorkspace);

router.post("/:id/members", Auth, WorkspaceController.addWorkspaceMember);

router.delete("/:id/members/:memberId", Auth, WorkspaceController.removeWorkspaceMember);

router.delete("/:id", Auth, WorkspaceController.deleteWorkspace);

module.exports = router;
