const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const Session = require("../models/Session");
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

// GET /api/v1/analytics/overview
router.get("/overview", authenticate, async (req, res) => {
  try {
    const { site_id, from, to } = req.query;

    if (!site_id) {
      return res.status(400).json({ error: "site_id is required" });
    }

    const filter = buildDateFilter(site_id, from, to);

    // Get page views count
    const pageViewsFilter = { ...filter, type: "page_view" };
    const page_views = await Event.countDocuments(pageViewsFilter);

    // Get unique sessions and calculate average session duration in one aggregation
    // This is compatible with MongoDB API Version 1
    const sessions = await Event.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$session_id",
          firstEvent: { $min: "$timestamp" },
          lastEvent: { $max: "$timestamp" },
        },
      },
    ]);

    // Get unique sessions count from the aggregation result
    const uniqueSessionsCount = sessions.length;

    let totalDuration = 0;
    let sessionCount = 0;

    sessions.forEach((session) => {
      const duration = (session.lastEvent - session.firstEvent) / 1000; // Convert to seconds
      if (duration > 0) {
        totalDuration += duration;
        sessionCount++;
      }
    });

    const avg_session_duration = sessionCount > 0 ? Math.round(totalDuration / sessionCount) : 0;

    // Get first and last event timestamps
    const firstLastEvents = await Event.aggregate([
      { $match: pageViewsFilter },
      {
        $group: {
          _id: null,
          first_event: { $min: "$timestamp" },
          last_event: { $max: "$timestamp" },
        },
      },
    ]);

    const first_event = firstLastEvents.length > 0 && firstLastEvents[0].first_event
      ? Math.floor(firstLastEvents[0].first_event.getTime() / 1000)
      : null;
    const last_event = firstLastEvents.length > 0 && firstLastEvents[0].last_event
      ? Math.floor(firstLastEvents[0].last_event.getTime() / 1000)
      : null;

    res.json({
      page_views: page_views,
      unique_sessions: uniqueSessionsCount,
      avg_session_duration: avg_session_duration,
      first_event: first_event, // Unix timestamp in seconds
      last_event: last_event,    // Unix timestamp in seconds
    });
  } catch (error) {
    console.error("Error fetching overview analytics:", error);
    res.status(500).json({ error: "Failed to fetch overview analytics" });
  }
});

// GET /api/v1/analytics/pages
router.get("/pages", authenticate, async (req, res) => {
  try {
    const { site_id, from, to } = req.query;

    if (!site_id) {
      return res.status(400).json({ error: "site_id is required" });
    }

    const filter = buildDateFilter(site_id, from, to);

    // Aggregate page views and unique sessions per path
    // Only count page_view events to match overview endpoint
    const pageStats = await Event.aggregate([
      { 
        $match: { 
          ...filter, 
          type: "page_view" // Only count page_view events
        } 
      },
      {
        $group: {
          _id: "$path",
          views: { $sum: 1 },
          unique_sessions: { $addToSet: "$session_id" },
          first_view: { $min: "$timestamp" },
          last_view: { $max: "$timestamp" },
        },
      },
      {
        $project: {
          path: "$_id",
          views: 1,
          unique_sessions: { $size: "$unique_sessions" },
          first_view: 1,
          last_view: 1,
          _id: 0,
        },
      },
      { $sort: { views: -1 } },
    ]);

    // Convert Date objects to Unix timestamps (seconds)
    const pageStatsWithTimestamps = pageStats.map((stat) => ({
      ...stat,
      first_view: stat.first_view ? Math.floor(stat.first_view.getTime() / 1000) : null,
      last_view: stat.last_view ? Math.floor(stat.last_view.getTime() / 1000) : null,
    }));

    res.json(pageStatsWithTimestamps);
  } catch (error) {
    console.error("Error fetching page analytics:", error);
    res.status(500).json({ error: "Failed to fetch page analytics" });
  }
});

module.exports = router;

