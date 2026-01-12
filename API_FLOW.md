# Analytics Backend API Flow

## Overview
This backend has two main user types:
1. **Dashboard Users** (authenticated) - Website owners who view analytics
2. **End Users** (anonymous) - Visitors on tracked websites (only need `site_id`)

---

## 🔐 Authentication Flow (Dashboard Users)

### 1. Sign Up (Create Account)
**POST** `/api/v1/auth/signup`
- **Auth:** None required
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response:**
```json
{
  "access_token": "jwt_token_here",
  "user_id": "user_id",
  "email": "user@example.com"
}
```

### 2. Login
**POST** `/api/v1/auth/login`
- **Auth:** None required
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response:**
```json
{
  "access_token": "jwt_token_here"
}
```

### 3. Get Current User
**GET** `/api/v1/auth/me`
- **Auth:** Bearer token required
- **Headers:** `Authorization: Bearer <access_token>`
- **Response:**
```json
{
  "user_id": "user_id",
  "email": "user@example.com"
}
```

---

## 📊 Site Management (Dashboard Users)

### 4. Create Site
**POST** `/api/v1/sites`
- **Auth:** Bearer token required
- **Body:**
```json
{
  "name": "My Website",
  "domain": "example.com"
}
```
- **Response:**
```json
{
  "site_id": "abc123def456"
}
```
- **Note:** Save this `site_id` - you'll use it in your tracker script!

### 5. List My Sites
**GET** `/api/v1/sites`
- **Auth:** Bearer token required
- **Response:**
```json
[
  {
    "_id": "...",
    "site_id": "abc123def456",
    "name": "My Website",
    "domain": "example.com",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

## 📈 Analytics APIs (Dashboard Users - View Data)

All analytics endpoints require Bearer token authentication.

### 6. Overview Analytics
**GET** `/api/v1/analytics/overview?site_id=<site_id>&from=<timestamp>&to=<timestamp>`
- **Auth:** Bearer token required
- **Query Params:**
  - `site_id` (required)
  - `from` (optional) - Unix timestamp in seconds
  - `to` (optional) - Unix timestamp in seconds
- **Response:**
```json
{
  "page_views": 1240,
  "unique_sessions": 430,
  "avg_session_duration": 62
}
```

### 7. Page Analytics
**GET** `/api/v1/analytics/pages?site_id=<site_id>&from=<timestamp>&to=<timestamp>`
- **Auth:** Bearer token required
- **Response:**
```json
[
  {
    "path": "/home",
    "views": 620,
    "unique_sessions": 210
  },
  {
    "path": "/about",
    "views": 450,
    "unique_sessions": 180
  }
]
```

### 8. Click Heatmap
**GET** `/api/v1/heatmap/clicks?site_id=<site_id>&path=<page_path>&from=<timestamp>&to=<timestamp>`
- **Auth:** Bearer token required
- **Query Params:**
  - `site_id` (required)
  - `path` (required) - e.g., "/home"
- **Response:**
```json
{
  "points": [
    { "x": 0.31, "y": 0.57, "count": 18 },
    { "x": 0.72, "y": 0.22, "count": 7 }
  ]
}
```

### 9. Scroll Depth Heatmap
**GET** `/api/v1/heatmap/scroll?site_id=<site_id>&path=<page_path>&from=<timestamp>&to=<timestamp>`
- **Auth:** Bearer token required
- **Response:**
```json
{
  "depth": [
    { "percent": 25, "users": 300 },
    { "percent": 50, "users": 190 },
    { "percent": 75, "users": 80 }
  ]
}
```

---

## 🎯 Data Collection APIs (Public - No Auth Required)

These are used by the tracker script embedded on websites. **No authentication needed** - only `site_id` is required.

### 10. Create/Get Session
**POST** `/api/v1/session`
- **Auth:** None required
- **Body:**
```json
{
  "site_id": "abc123def456",
  "path": "/home"
}
```
- **Response:**
```json
{
  "session_id": "session_uuid_here",
  "expires_in": 1800
}
```

### 11. Batch Event Ingestion
**POST** `/api/v1/events`
- **Auth:** None required
- **Body:**
```json
{
  "site_id": "abc123def456",
  "session_id": "session_uuid_here",
  "events": [
    {
      "type": "page_view",
      "path": "/home",
      "url": "https://example.com/home",
      "referrer": "https://google.com",
      "timestamp": 1736220000
    },
    {
      "type": "click",
      "path": "/home",
      "x": 420,
      "y": 610,
      "viewport": { "w": 1440, "h": 900 },
      "timestamp": 1736220001
    },
    {
      "type": "scroll",
      "path": "/home",
      "scrollY": 350,
      "viewport": { "w": 1440, "h": 900 },
      "timestamp": 1736220002
    }
  ]
}
```
- **Response:**
```json
{
  "status": "ok"
}
```

---

## 🔄 Complete Flow Example

### Step 1: Dashboard User Setup
```javascript
// 1. Sign up
const signup = await fetch('http://localhost:3000/api/v1/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'owner@example.com',
    password: 'password123'
  })
});
const { access_token } = await signup.json();

// 2. Create a site
const site = await fetch('http://localhost:3000/api/v1/sites', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    name: 'My Website',
    domain: 'example.com'
  })
});
const { site_id } = await site.json();
// site_id = "abc123def456" - USE THIS IN TRACKER SCRIPT
```

### Step 2: Embed Tracker on Website
```html
<!-- On your website (example.com) -->
<script>
  window.__TRACKER_CONFIG__ = {
    site_id: "abc123def456", // From step 1
    api_base: "http://localhost:3000" // Your backend URL
  };
</script>
<script src="http://localhost:3000/tracker.js"></script>
```

### Step 3: View Analytics (Dashboard)
```javascript
// Login
const login = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'owner@example.com',
    password: 'password123'
  })
});
const { access_token } = await login.json();

// Get overview
const overview = await fetch(
  'http://localhost:3000/api/v1/analytics/overview?site_id=abc123def456',
  {
    headers: { 'Authorization': `Bearer ${access_token}` }
  }
);
const data = await overview.json();
// { page_views: 1240, unique_sessions: 430, avg_session_duration: 62 }
```

---

## 🔑 Key Points

1. **Public APIs (No Auth):**
   - `/api/v1/events` - Event collection (only needs `site_id`)
   - `/api/v1/session` - Session creation (only needs `site_id`)

2. **Protected APIs (Bearer Token Required):**
   - All `/api/v1/analytics/*` endpoints
   - All `/api/v1/heatmap/*` endpoints
   - `/api/v1/sites` (create/list sites)
   - `/api/v1/auth/me`

3. **Security:**
   - `site_id` is public-facing (used in tracker script)
   - Only site owners (authenticated users) can view analytics
   - Site creation requires authentication
   - Analytics viewing requires authentication + `site_id`

4. **Frontend Integration:**
   - Tracker script only needs `site_id` (no auth)
   - Dashboard only needs `site_id` + Bearer token for viewing analytics
   - No need to tie `site_id` to user in frontend - backend handles ownership

---

## 📝 Notes

- Timestamps are in **Unix epoch seconds** (not milliseconds)
- Session expires after 30 minutes (1800 seconds)
- Events are batched and sent every 3 seconds
- All analytics endpoints support date filtering with `from` and `to` parameters

