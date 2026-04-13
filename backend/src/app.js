import cors from "cors";
import path from "path";
import express from "express";
import { authRoutes } from "./routes/authRoutes.js";
import { caregiverRoutes } from "./routes/caregiverRoutes.js";
import { childRoutes } from "./routes/childRoutes.js";
import { conversationRoutes } from "./routes/conversationRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.resolve("public/uploads")));

// Lightweight health endpoint for local dev and smoke checks.
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/caregiver", caregiverRoutes);
app.use("/api/child", childRoutes);
app.use("/api/conversation", conversationRoutes);

app.use(errorHandler);
