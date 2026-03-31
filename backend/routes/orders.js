const express = require("express");
const db = require("../db");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

/* Save order */
router.post("/orders", authMiddleware, (req, res) => {
  const { customerName, phone, address, planName, items } = req.body;
  const userId = req.user.id; // from JWT

  // ✅ Validation
  if (
    !customerName ||
    !phone ||
    !address ||
    !planName ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      message: "Invalid order data"
    });
  }

  const itemsText = JSON.stringify(items);

  const sql = `
    INSERT INTO orders (user_id, customer_name, phone, address, plan_name, items)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [userId, customerName, phone, address, planName, itemsText],
    (error, result) => {
      if (error) {
        return res.status(500).json({
          message: "Order save failed",
          error: error.message
        });
      }

      res.status(201).json({
        message: "Order saved successfully ✅",
        orderId: result.insertId
      });
    }
  );
});

/* Get orders (only logged-in user) */
router.get("/orders", authMiddleware, (req, res) => {
  const sql = "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC";

  db.query(sql, [req.user.id], (error, results) => {
    if (error) {
      return res.status(500).json({
        message: "Failed to fetch orders",
        error: error.message
      });
    }

    // ✅ Safe JSON parse
    const formatted = results.map(order => ({
      ...order,
      items: (() => {
        try {
          return JSON.parse(order.items);
        } catch {
          return [];
        }
      })()
    }));

    res.json(formatted);
  });
});

module.exports = router;