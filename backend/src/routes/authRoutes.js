import { Router } from "express";
import { db } from "../db/database.js";
import bcryptjs from "bcryptjs";

export const authRoutes = Router();

authRoutes.post("/login", (req, res) => {
  const { email, password, role } = req.body;

  try {
    if (role === "caregiver") {
      // Caregiver login - requires email and password
      const caregiver = db
        .prepare(`
          SELECT c.caregiver_id, c.email, c.password_hash, u.user_id, u.role
          FROM caregivers c
          JOIN users u ON c.user_id = u.user_id
          WHERE c.email = ?
        `)
        .get(email);

      if (!caregiver) {
        return res.status(401).json({ message: "Invalid caregiver credentials." });
      }

      // Verify password hash
      const passwordValid = bcryptjs.compareSync(password, caregiver.password_hash);
      if (!passwordValid) {
        return res.status(401).json({ message: "Invalid caregiver credentials." });
      }

      return res.json({
        user: {
          userId: caregiver.user_id,
          caregiverId: caregiver.caregiver_id,
          role: caregiver.role,
          email: caregiver.email,
        },
        token: "demo-session-token", // In production, generate JWT
      });
    } else if (role === "child") {
      // Child login - just needs to select the child
      const child = db
        .prepare(`
          SELECT c.child_id, c.name, u.user_id, u.role
          FROM children c
          JOIN users u ON c.user_id = u.user_id
          LIMIT 1
        `)
        .get();

      if (!child) {
        return res.status(401).json({ message: "No children available." });
      }

      return res.json({
        user: {
          userId: child.user_id,
          childId: child.child_id,
          role: child.role,
          name: child.name,
        },
        token: "demo-session-token",
      });
    } else {
      return res.status(400).json({ message: "Invalid role." });
    }
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});
