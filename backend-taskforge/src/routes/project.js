const express = require("express");

const router = express.Router();

const Auth = require("../middleware/Auth");
const ProjectController = require("../controllers/ProjectController");

router.post("/", Auth, ProjectController.createProject);
router.get("/", Auth, ProjectController.getProjects);
router.get("/:id", Auth, ProjectController.getProject);
router.patch("/:id", Auth, ProjectController.updateProject);
router.patch("/:id/members", Auth, ProjectController.updateProjectMembers);
router.delete("/:id", Auth, ProjectController.deleteProject);

module.exports = router;
