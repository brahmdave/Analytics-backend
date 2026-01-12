const express = require("express");
const router = express.Router();
const Site = require("../models/Site");
const { authenticate } = require("../middleware/auth");
const crypto = require("crypto");

// POST /api/v1/sites - Create site (auth required)
router.post("/", authenticate, async (req, res) => {
  try {
    const { name, domain } = req.body;

    if (!name || !domain) {
      return res.status(400).json({ error: "name and domain are required" });
    }

    // Generate unique site_id
    const site_id = crypto.randomBytes(8).toString("hex");

    const site = new Site({
      site_id,
      name,
      domain,
      owner: req.userId,
    });

    await site.save();

    res.json({ site_id });
  } catch (error) {
    console.error("Error creating site:", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Site with this domain already exists" });
    }
    res.status(500).json({ error: "Failed to create site" });
  }
});

// GET /api/v1/sites - Get all sites for authenticated user
router.get("/", authenticate, async (req, res) => {
  try {
    const sites = await Site.find({ owner: req.userId }).select("-owner -__v");
    res.json(sites);
  } catch (error) {
    console.error("Error fetching sites:", error);
    res.status(500).json({ error: "Failed to fetch sites" });
  }
});

module.exports = router;

