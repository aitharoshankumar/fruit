const express = require("express");
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

// ================= SIGNUP =================
router.post("/signup", async (req, res) => {
  const { username, email, password, phone } = req.body;

  if (!username || !email || !password || !phone) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!email.includes("@")) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    const checkSql = "SELECT * FROM users WHERE email = ? OR phone = ?";

    db.query(checkSql, [email, phone], async (err, results) => {
      if (err) return res.status(500).json({ message: "DB error" });

      if (results.length > 0) {
        return res.status(400).json({ message: "Email or phone already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertSql = "INSERT INTO users (username, email, password, phone) VALUES (?, ?, ?, ?)";

      db.query(insertSql, [username, email, hashedPassword, phone], (error, result) => {
        if (error) return res.status(500).json({ message: "Signup failed" });

        res.status(201).json({ message: "Signup successful", userId: result.insertId });
      });
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= LOGIN =================
router.post("/login", (req, res) => {
  const { email, username, password } = req.body;

  if ((!email && !username) || !password) {
    return res.status(400).json({ message: "Email/Username and password required" });
  }

  const sql = "SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1";

  db.query(sql, [email || "", username || ""], async (error, results) => {
    if (error) return res.status(500).json({ message: "Login failed" });

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Login successful", token });
  });
});

// ================= RESET PASSWORD =================
router.post("/reset-password", async (req, res) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const checkSql = "SELECT * FROM users WHERE username = ?";

  db.query(checkSql, [username], async (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });

    if (results.length === 0) {
      return res.status(400).json({ message: "Username not found!" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updateSql = "UPDATE users SET password = ? WHERE username = ?";

    db.query(updateSql, [hashedPassword, username], (error) => {
      if (error) return res.status(500).json({ message: "Reset failed" });

      res.json({ message: "Password reset successful! Please login." });
    });
  });
});

module.exports = router;