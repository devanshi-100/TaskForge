const jwt = require("jsonwebtoken");

const Auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decoded = jwt.verify( token, process.env.JWT_SECRET );
    req.auth = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

module.exports = Auth;
