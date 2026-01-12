(function() {
  const config = window.__TRACKER_CONFIG__;
  if (!config || !config.site_id) return;

  const siteId = config.site_id;
  const events = [];

  // ------- SESSION MANAGEMENT --------
  function getSessionId() {
    let sid = sessionStorage.getItem("session_id");
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("session_id", sid);
    }
    return sid;
  }

  // ------- EVENT COLLECTION --------
  function pushEvent(e) {
    events.push(e);
  }

  // Page view
  pushEvent({
    type: "page_view",
    url: location.href,
    path: location.pathname,
    referrer: document.referrer || null,
    timestamp: Math.floor(Date.now() / 1000) // Convert to epoch seconds
  });

  // Click events
  document.addEventListener("click", (e) => {
    pushEvent({
      type: "click",
      x: e.clientX,
      y: e.clientY,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      path: location.pathname,
      timestamp: Math.floor(Date.now() / 1000) // Convert to epoch seconds
    });
  });

  // Scroll events
  let scrollTimeout;
  window.addEventListener("scroll", () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      pushEvent({
        type: "scroll",
        scrollY: window.scrollY,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        path: location.pathname,
        timestamp: Math.floor(Date.now() / 1000) // Convert to epoch seconds
      });
    }, 100);
  });

  // ------- BATCH SENDER --------
  function sendBatch() {
    if (events.length === 0) return;

    const payload = {
      site_id: siteId,
      session_id: getSessionId(),
      events: [...events]
    };

    events.length = 0; // clear

    const data = JSON.stringify(payload);

    // Get the API base URL from config or use current origin
    const apiBase = config.api_base || window.location.origin;

    // try beacon first (sendBeacon requires Blob or FormData)
    if (navigator.sendBeacon) {
      const blob = new Blob([data], { type: "application/json" });
      navigator.sendBeacon(apiBase + "/api/v1/events", blob);
    } else {
      fetch(apiBase + "/api/v1/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data,
        keepalive: true,
        credentials: "omit" // Explicitly don't send credentials
      });
    }
  }

  // Send every 3 seconds
  setInterval(sendBatch, 3000);

  // Send remaining on unload
  window.addEventListener("beforeunload", sendBatch);
})();

