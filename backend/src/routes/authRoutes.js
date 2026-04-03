import { Router } from "express";
import { db } from "../db/database.js";

export const authRoutes = Router();

// Validates the simple demo caregiver login used by the prototype.
authRoutes.post("/login", (req, res) => {
  const { email, password } = req.body;
  const caregiver = email
    ? db
        .prepare("SELECT id, email, name FROM caregiver_users WHERE email = ? AND password = ?")
        .get(email, password)
    : db
        .prepare("SELECT id, email, name FROM caregiver_users WHERE password = ? LIMIT 1")
        .get(password);

  if (!caregiver) {
    return res.status(401).json({ message: "Invalid demo credentials." });
  }

  return res.json({
    caregiver,
    token: "demo-caregiver-session",
  });
});
