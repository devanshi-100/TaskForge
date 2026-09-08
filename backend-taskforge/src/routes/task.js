const express = require("express");

const router = express.Router();

const Auth = require("../middleware/Auth");
const TaskController = require("../controllers/TaskController");

router.post("/", Auth, TaskController.createTask);
router.get("/", Auth, TaskController.getTasks);
router.get("/:id", Auth, TaskController.getTask);
router.patch("/:id", Auth, TaskController.updateTask);
router.patch("/:id/status", Auth, TaskController.updateTaskStatus);
router.post("/:id/comments", Auth, TaskController.addTaskComment);
router.delete("/:id/comments/:commentId", Auth, TaskController.deleteTaskComment);
router.delete("/:id", Auth, TaskController.deleteTask);

module.exports = router;
