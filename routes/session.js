const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const crypto = require("crypto");

// POST /api/v1/session - Create/get session
router.post("/", async (req, res) => {
  try {
    const { site_id, path } = req.body;

    if (!site_id || !path) {
      return res.status(400).json({ error: "site_id and path are required" });
    }

    // Generate unique session ID
    const session_id = crypto.randomBytes(16).toString("hex");
    
    // Session expires in 30 minutes (1800 seconds)
    const expires_at = new Date(Date.now() + 1800 * 1000);

    const session = new Session({
      session_id,
      site_id,
      path,
      expires_at,
    });

    await session.save();

    res.json({
      session_id,
      expires_in: 1800,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

module.exports = router;

