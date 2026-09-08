const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { handleControllerError, isNonEmptyString } = require("../utils/http");

// REGISTER
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hashedPassword });
    res.status(201).json({ message: "User created successfully", user: { id: user._id, name: user.name, email: user.email }});
    // this.login(req, res);
  } catch (error) {
    handleControllerError(res, error);
  }
};

// 123456 -> jhwdvfguvweug32767376chdvu373768
// {
//     message: "User created Successfully",
//     user;{
//         id : mongoDB object ID -> _id ( jhsdvcgvweg43vdgrewvrytP+hdgvucuy )
//     }
// }

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ message: "Login successful", user: { id: user._id, name: user.name, email: user.email }});
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.auth.id ;
    if(!userId){
      return res.status(400).json({ message: "ID not found" });
    }
    const user = await User.findOne({ _id: userId });
    if(!user){
      return res.status(400).json({ message: "User not Exist" });
    }
    res.json({ message: "Data Fetch Successfully", user: { id: user._id,name: user.name, email: user.email }});
  } catch (error) {
    handleControllerError(res, error);
  }
}

exports.logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    handleControllerError(res, error);
  }
};
