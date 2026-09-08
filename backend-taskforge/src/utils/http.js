const mongoose = require("mongoose");

const handleControllerError = (res, error) => {
  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: "Invalid resource ID" });
  }
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: error.message });
  }
  if (error && error.code === 11000) {
    return res.status(409).json({ message: "A record with that value already exists" });
  }
  return res.status(500).json({ message: "Internal server error" });
};

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

module.exports = { handleControllerError, isNonEmptyString };
