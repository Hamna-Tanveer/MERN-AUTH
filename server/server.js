/*import express from "express";
import cors from "cors";
import "dotenv/config";

import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/user.js";

const app = express();
const port = process.env.PORT || 4000;
connectDB();

//const allowedOrigins = ["http://localhost:5173"]; // frontend Url
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://your-vercel-app.vercel.app"] //to deploy on vercel
    : ["http://localhost:5173"]; //local server

//middleware
app.use(express.json());
app.use(
  cors({ origin: allowedOrigins, credentials: true, methods: ["POST", "GET"] })
);
app.use(cookieParser()); //connect backend to frontend

//API Endpoints...
app.get("/", (req, res) => res.send("API Working!"));
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.listen(port, () => console.log(`Server started at port ${port}`));*/

// server.js (or your main server file)
import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/user.js";

const app = express();

// Connect DB
connectDB();

// Allowed origins - update with your actual frontend URL
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://your-actual-frontend-domain.vercel.app"] // ← Change this!
    : ["http://localhost:5173"];

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(cookieParser());

// Routes
app.get("/", (req, res) => res.send("API Working!"));
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// Add a catch-all handler for debugging
app.use("*", (req, res) => {
  console.log(`404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Export the app for Vercel
export default app;
