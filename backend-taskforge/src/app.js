const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const AuthRoutes = require("./routes/auth");
const workspaceRoutes = require("./routes/workspace");
const projectRoutes = require("./routes/project");
const taskRoutes = require("./routes/task");

const app = express();

const configuredOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3002")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    const isLocalDevelopment = process.env.NODE_ENV !== "production" &&
      /^http:\/\/localhost:\d+$/.test(origin || "");

    if (!origin || configuredOrigins.includes(origin) || isLocalDevelopment) {
      return callback(null, true);
    }

    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true
}));

app.disable("x-powered-by");
app.use(express.json());
app.use(cookieParser());

// http://localhost:3000/api/auth/login
// http://localhost:3000/api/auth/signup   (data- as body, as query, as params)
// Routes
app.use( "/api/auth", AuthRoutes);
app.use( "/api/workspace", workspaceRoutes );
app.use( "/api/projects", projectRoutes );
app.use( "/api/tasks", taskRoutes );

module.exports = app;
