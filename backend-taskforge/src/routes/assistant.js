const express = require("express");
const Auth = require("../middleware/Auth");
const AssistantController = require("../controllers/AssistantController");

const router = express.Router();

router.post("/tasks/:taskId/guidance", Auth, AssistantController.getTaskGuidance);

module.exports = router;
