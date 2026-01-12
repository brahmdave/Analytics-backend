const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const { authenticate } = require("../middleware/auth");

// Helper function to build date filter
const buildDateFilter = (site_id, from, to) => {
  const filter = { site_id };
  
  if (from || to) {
    filter.timestamp = {};
    if (from) {
      filter.timestamp.$gte = new Date(parseInt(from) * 1000);
    }
    if (to) {
      filter.timestamp.$lte = new Date(parseInt(to) * 1000);
    }
  }
  
  return filter;
};

// GET /api/v1/heatmap/clicks
router.get("/clicks", authenticate, async (req, res) => {
  try {
    const { site_id, path, from, to } = req.query;

    if (!site_id || !path) {
      return res.status(400).json({ error: "site_id and path are required" });
    }

    const filter = {
      ...buildDateFilter(site_id, from, to),
      type: "click",
      path: path,
    };

    // Get all click events with viewport and coordinates
    const clicks = await Event.find(filter).select("x y viewport");

    if (clicks.length === 0) {
      return res.json({ points: [] });
    }

    // Normalize coordinates to 0-1 range based on viewport
    const normalizedPoints = {};
    
    clicks.forEach((click) => {
      if (click.x !== undefined && click.y !== undefined && click.viewport) {
        const normalizedX = click.x / click.viewport.w;
        const normalizedY = click.y / click.viewport.h;
        
        // Round to 2 decimal places for binning
        const keyX = Math.round(normalizedX * 100) / 100;
        const keyY = Math.round(normalizedY * 100) / 100;
        const key = `${keyX},${keyY}`;
        
        if (!normalizedPoints[key]) {
          normalizedPoints[key] = { x: keyX, y: keyY, count: 0 };
        }
        normalizedPoints[key].count++;
      }
    });

    // Convert to array and sort by count
    const points = Object.values(normalizedPoints).sort((a, b) => b.count - a.count);

    res.json({ points });
  } catch (error) {
    console.error("Error fetching click heatmap:", error);
    res.status(500).json({ error: "Failed to fetch click heatmap" });
  }
});

// GET /api/v1/heatmap/scroll
router.get("/scroll", authenticate, async (req, res) => {
  try {
    const { site_id, path, from, to } = req.query;

    if (!site_id || !path) {
      return res.status(400).json({ error: "site_id and path are required" });
    }

    const filter = {
      ...buildDateFilter(site_id, from, to),
      type: "scroll",
      path: path,
    };

    // Get all scroll events with session_id
    const scrollEvents = await Event.find(filter).select("scrollY viewport session_id");

    if (scrollEvents.length === 0) {
      return res.json({ depth: [] });
    }

    // Track maximum scroll depth per user (session)
    // scrollY represents pixels scrolled, we need to calculate percentage
    // For accurate percentage, we'd need page height, but we'll estimate based on scrollY
    const userMaxScroll = {};
    
    scrollEvents.forEach((event) => {
      if (event.scrollY !== undefined && event.viewport && event.viewport.h) {
        // Estimate scroll percentage: scrollY / (scrollY + viewport height)
        // This gives us a rough percentage. In production, you'd want to track actual page height
        const estimatedPageHeight = event.scrollY + event.viewport.h;
        const scrollPercent = estimatedPageHeight > 0 
          ? Math.min(100, Math.round((event.scrollY / estimatedPageHeight) * 100))
          : 0;
        
        // Track maximum scroll depth per session
        if (!userMaxScroll[event.session_id] || scrollPercent > userMaxScroll[event.session_id]) {
          userMaxScroll[event.session_id] = scrollPercent;
        }
      }
    });

    // Count users who reached each depth threshold
    const depth = [
      { percent: 25, users: 0 },
      { percent: 50, users: 0 },
      { percent: 75, users: 0 },
    ];

    Object.values(userMaxScroll).forEach((maxPercent) => {
      if (maxPercent >= 25) depth[0].users++;
      if (maxPercent >= 50) depth[1].users++;
      if (maxPercent >= 75) depth[2].users++;
    });

    res.json({ depth });
  } catch (error) {
    console.error("Error fetching scroll heatmap:", error);
    res.status(500).json({ error: "Failed to fetch scroll heatmap" });
  }
});

module.exports = router;

