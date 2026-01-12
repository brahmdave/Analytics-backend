const express = require("express");
const router = express.Router();
const Event = require("../models/Event");

// Middleware to handle sendBeacon requests (may not have Content-Type header)
router.use(express.json({ type: ['application/json', 'application/octet-stream', '*/*'] }));

// POST /api/v1/events - Batch event ingestion
router.post("/", async (req, res) => {
  try {
    const { site_id, session_id, events } = req.body;

    if (!site_id || !session_id || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: "Invalid request: site_id, session_id, and events array required" });
    }

    // Validate and transform events
    const eventDocs = events.map((event) => {
      if (!event.type || !event.path || !event.timestamp) {
        throw new Error("Each event must have type, path, and timestamp");
      }

      return {
        site_id,
        session_id,
        type: event.type,
        path: event.path,
        url: event.url,
        referrer: event.referrer,
        x: event.x,
        y: event.y,
        viewport: event.viewport,
        scrollY: event.scrollY,
        timestamp: new Date(event.timestamp * 1000), // Convert epoch seconds to Date
      };
    });

    // Insert events in batch
    await Event.insertMany(eventDocs);

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Error ingesting events:", error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

