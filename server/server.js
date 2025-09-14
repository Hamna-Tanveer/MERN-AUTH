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

// Allowed origins
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://your-vercel-app.vercel.app"]
    : ["http://localhost:5173"];

app.use(express.json());
app.use(
  cors({ origin: allowedOrigins, credentials: true, methods: ["POST", "GET"] })
);
app.use(cookieParser());

// Routes
app.get("/", (req, res) => res.send("API Working!"));
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// ✅ Run locally with app.listen
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

// ✅ Export app for Vercel
export default app;
