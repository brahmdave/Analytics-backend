
# 📊 Analytics Backend

This backend powers a privacy-friendly web analytics dashboard with support for page views, sessions, heatmaps, and scroll depth. Developers can embed a lightweight tracker script on any website and view analytics in a protected dashboard.

---

## 🚀 Features

- Email/password authentication (JWT based)
- Site creation & multi-site support
- Page view tracking
- Unique session tracking
- Click heatmaps
- Scroll depth heatmaps
- Date filtering with `from`/`to` timestamps
- Public data ingestion API (no auth required)
- Protected analytics API (Bearer token required)
- Rate-limited event ingestion

---

## 🔗 Base URL

```

[http://localhost:3000](http://localhost:3000)

```

(Replace with production URL in deployment)

---

## 🔐 Authentication

Protected endpoints require a Bearer token:

```

Authorization: Bearer <access_token>

````

Token validity: **7 days**

---

# 1. Authentication APIs

## 🔸 Sign Up
Create a new user.

**POST** `/api/v1/auth/signup`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
````

**Response (201):**

```json
{
  "access_token": "<jwt_token>",
  "user_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com"
}
```

---

## 🔸 Login

Authenticate & get token.

**POST** `/api/v1/auth/login`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "access_token": "<jwt_token>"
}
```

---

## 🔸 Get Current User

**GET** `/api/v1/auth/me`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com"
}
```

---

# 2. Site Management APIs

## 🔸 Create Site

Used to register websites for tracking.

**POST** `/api/v1/sites`

**Headers:** Bearer token required

```json
{
  "name": "My Website",
  "domain": "example.com"
}
```

**Response:**

```json
{
  "site_id": "abc123def456"
}
```

> Save `site_id` — you’ll need it in the tracker script.

---

## 🔸 List My Sites

Fetch all owned sites.

**GET** `/api/v1/sites`

**Response:**

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

# 3. Analytics APIs (Protected)

All analytics endpoints require:

* Bearer token
* `site_id`
* optional: `from`, `to` (Unix epoch seconds)

---

## 🔸 Overview Analytics

**GET** `/api/v1/analytics/overview`

Example:

```
/api/v1/analytics/overview?site_id=abc123def456&from=1704067200&to=1704153600
```

**Response:**

```json
{
  "page_views": 1240,
  "unique_sessions": 430,
  "avg_session_duration": 62
}
```

---

## 🔸 Page Analytics

**GET** `/api/v1/analytics/pages?site_id=abc123def456`

**Response:**

```json
[
  { "path": "/home", "views": 620, "unique_sessions": 210 },
  { "path": "/about", "views": 450, "unique_sessions": 180 },
  { "path": "/contact", "views": 170, "unique_sessions": 95 }
]
```

Sorted by `views` descending.

---

# 4. Heatmap APIs (Protected)

---

## 🔸 Click Heatmap

**GET**

```
/api/v1/heatmap/clicks?site_id=<id>&path=/home
```

**Response:**

```json
{
  "points": [
    { "x": 0.31, "y": 0.57, "count": 18 },
    { "x": 0.72, "y": 0.22, "count": 7 },
    { "x": 0.45, "y": 0.68, "count": 5 }
  ]
}
```

Coordinates are normalized (0–1).

---

## 🔸 Scroll Depth Heatmap

**GET**

```
/api/v1/heatmap/scroll?site_id=<id>&path=/home
```

**Response:**

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

# 5. Data Collection APIs (Public — No Auth)

Used by tracker script.

---

## 🔸 Create/Get Session

**POST** `/api/v1/session`

```json
{
  "site_id": "abc123def456",
  "path": "/home"
}
```

**Response:**

```json
{
  "session_id": "uuid_here",
  "expires_in": 1800
}
```

Session TTL = 30 minutes

---

## 🔸 Batch Event Ingestion

**POST** `/api/v1/events`

```json
{
  "site_id": "abc123def456",
  "session_id": "uuid_here",
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

**Response:**

```json
{ "status": "ok" }
```

---

# 📦 Tracker Script Integration

On your website:

```html
<script>
  window.__TRACKER_CONFIG__ = {
    site_id: "abc123def456",
    api_base: "http://localhost:3000"
  };
</script>
<script src="http://localhost:3000/tracker.js"></script>
```

---

# 🧪 Testing With cURL

```bash
# Sign up
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Fetch overview (replace TOKEN & SITE_ID)
curl "http://localhost:3000/api/v1/analytics/overview?site_id=SITE_ID" \
  -H "Authorization: Bearer TOKEN"
```

---

# 📅 Date Handling

* Uses **Unix epoch seconds**
* Example (JS):

```js
const toUnix = (date) => Math.floor(date.getTime() / 1000);
```

---

# ⚙️ Rate Limiting

| Area            | Limit                     |
| --------------- | ------------------------- |
| Event ingestion | 100 requests / minute     |
| Other APIs      | 100 requests / 15 minutes |

---

# 🛡️ Security Model

* `site_id` is public (embedded in websites)
* Analytics viewing requires **Bearer token**
* Site creation requires authentication

---

# ✔️ Quick Start

1. Sign up → get token
2. Create site → get `site_id`
3. Embed tracker with `site_id`
4. Login to dashboard
5. View analytics

---

# 📌 Notes

* CORS enabled for ingestion endpoints
* Sessions expire after 30 minutes of inactivity
* Events are batched on client-side
* Heatmaps normalized for viewport scaling

---

# 🐛 Error Responses

Format:

```json
{ "error": "message" }
```

Codes:

* `200` OK
* `201` Created
* `400` Bad Request
* `401` Unauthorized
* `404` Not Found
* `500` Server Error


