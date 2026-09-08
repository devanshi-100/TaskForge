const express = require("express");
const router = express.Router();

const AuthController = require("../controllers/AuthController.js");
const Auth = require("../middleware/Auth.js");

router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);
router.get("/getProfile", Auth, AuthController.getProfile);
router.post("/logout", AuthController.logout);

module.exports = router;
