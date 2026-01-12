# Analytics Backend API Documentation

**Base URL:** `http://localhost:3000` (or your production URL)

---

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 1. Authentication APIs

### Sign Up
Create a new user account.

**Endpoint:** `POST /api/v1/auth/signup`

**Auth:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com"
}
```

**Error Responses:**
- `400` - Email already exists or password too short
- `500` - Server error

---

### Login
Authenticate and get access token.

**Endpoint:** `POST /api/v1/auth/login`

**Auth:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401` - Invalid credentials
- `400` - Missing email or password

---

### Get Current User
Get authenticated user information.

**Endpoint:** `GET /api/v1/auth/me`

**Auth:** Required (Bearer token)

**Response (200):**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com"
}
```

**Error Responses:**
- `401` - Unauthorized (invalid/missing token)

---

## 2. Site Management APIs

### Create Site
Create a new website to track.

**Endpoint:** `POST /api/v1/sites`

**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "name": "My Website",
  "domain": "example.com"
}
```

**Response (200):**
```json
{
  "site_id": "abc123def456"
}
```

**Note:** Save the `site_id` - you'll need it for:
- Embedding the tracker script
- Fetching analytics data

---

### List My Sites
Get all sites owned by the authenticated user.

**Endpoint:** `GET /api/v1/sites`

**Auth:** Required (Bearer token)

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "site_id": "abc123def456",
    "name": "My Website",
    "domain": "example.com",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

## 3. Analytics APIs

All analytics endpoints require authentication and a `site_id` query parameter.

### Overview Analytics
Get high-level metrics for a site.

**Endpoint:** `GET /api/v1/analytics/overview`

**Auth:** Required (Bearer token)

**Query Parameters:**
- `site_id` (required) - The site ID to get analytics for
- `from` (optional) - Start timestamp (Unix epoch seconds)
- `to` (optional) - End timestamp (Unix epoch seconds)

**Example:**
```
GET /api/v1/analytics/overview?site_id=abc123def456&from=1704067200&to=1704153600
```

**Response (200):**
```json
{
  "page_views": 1240,
  "unique_sessions": 430,
  "avg_session_duration": 62
}
```

**Response Fields:**
- `page_views` - Total number of page views
- `unique_sessions` - Number of unique user sessions
- `avg_session_duration` - Average session duration in seconds

---

### Page Analytics
Get per-page statistics.

**Endpoint:** `GET /api/v1/analytics/pages`

**Auth:** Required (Bearer token)

**Query Parameters:**
- `site_id` (required)
- `from` (optional) - Start timestamp
- `to` (optional) - End timestamp

**Example:**
```
GET /api/v1/analytics/pages?site_id=abc123def456
```

**Response (200):**
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
  },
  {
    "path": "/contact",
    "views": 170,
    "unique_sessions": 95
  }
]
```

**Response Fields:**
- `path` - Page path (e.g., "/home")
- `views` - Total views for this page
- `unique_sessions` - Unique sessions that viewed this page

**Note:** Results are sorted by views (descending)

---

## 4. Heatmap APIs

### Click Heatmap
Get normalized click coordinates for heatmap visualization.

**Endpoint:** `GET /api/v1/heatmap/clicks`

**Auth:** Required (Bearer token)

**Query Parameters:**
- `site_id` (required)
- `path` (required) - Page path (e.g., "/home")
- `from` (optional) - Start timestamp
- `to` (optional) - End timestamp

**Example:**
```
GET /api/v1/heatmap/clicks?site_id=abc123def456&path=/home
```

**Response (200):**
```json
{
  "points": [
    { "x": 0.31, "y": 0.57, "count": 18 },
    { "x": 0.72, "y": 0.22, "count": 7 },
    { "x": 0.45, "y": 0.68, "count": 5 }
  ]
}
```

**Response Fields:**
- `points` - Array of click points
  - `x` - Normalized X coordinate (0-1)
  - `y` - Normalized Y coordinate (0-1)
  - `count` - Number of clicks at this position

**Note:** Coordinates are normalized (0-1) to work with any screen size. Multiply by viewport dimensions to get pixel positions.

---

### Scroll Depth Heatmap
Get scroll depth statistics for a page.

**Endpoint:** `GET /api/v1/heatmap/scroll`

**Auth:** Required (Bearer token)

**Query Parameters:**
- `site_id` (required)
- `path` (required) - Page path
- `from` (optional) - Start timestamp
- `to` (optional) - End timestamp

**Example:**
```
GET /api/v1/heatmap/scroll?site_id=abc123def456&path=/home
```

**Response (200):**
```json
{
  "depth": [
    { "percent": 25, "users": 300 },
    { "percent": 50, "users": 190 },
    { "percent": 75, "users": 80 }
  ]
}
```

**Response Fields:**
- `depth` - Array of scroll depth statistics
  - `percent` - Scroll depth percentage (25, 50, 75)
  - `users` - Number of users who reached this depth

---

## 📝 Frontend Integration Examples

### React/TypeScript Example

```typescript
// api.ts
const API_BASE = 'http://localhost:3000';

export class AnalyticsAPI {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth
  async signup(email: string, password: string) {
    const data = await this.request('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe() {
    return this.request('/api/v1/auth/me');
  }

  // Sites
  async createSite(name: string, domain: string) {
    return this.request('/api/v1/sites', {
      method: 'POST',
      body: JSON.stringify({ name, domain }),
    });
  }

  async getSites() {
    return this.request('/api/v1/sites');
  }

  // Analytics
  async getOverview(siteId: string, from?: number, to?: number) {
    const params = new URLSearchParams({ site_id: siteId });
    if (from) params.append('from', from.toString());
    if (to) params.append('to', to.toString());
    return this.request(`/api/v1/analytics/overview?${params}`);
  }

  async getPages(siteId: string, from?: number, to?: number) {
    const params = new URLSearchParams({ site_id: siteId });
    if (from) params.append('from', from.toString());
    if (to) params.append('to', to.toString());
    return this.request(`/api/v1/analytics/pages?${params}`);
  }

  async getClickHeatmap(siteId: string, path: string, from?: number, to?: number) {
    const params = new URLSearchParams({ site_id: siteId, path });
    if (from) params.append('from', from.toString());
    if (to) params.append('to', to.toString());
    return this.request(`/api/v1/heatmap/clicks?${params}`);
  }

  async getScrollHeatmap(siteId: string, path: string, from?: number, to?: number) {
    const params = new URLSearchParams({ site_id: siteId, path });
    if (from) params.append('from', from.toString());
    if (to) params.append('to', to.toString());
    return this.request(`/api/v1/heatmap/scroll?${params}`);
  }
}

export const api = new AnalyticsAPI();
```

### Usage in React Component

```typescript
import { api } from './api';
import { useEffect, useState } from 'react';

function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [siteId, setSiteId] = useState('abc123def456');

  useEffect(() => {
    // Load token from localStorage on mount
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.setToken(token);
    }
  }, []);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const data = await api.getOverview(siteId);
        setOverview(data);
      } catch (error) {
        console.error('Failed to fetch overview:', error);
      }
    }
    fetchOverview();
  }, [siteId]);

  return (
    <div>
      <h1>Analytics Dashboard</h1>
      {overview && (
        <div>
          <p>Page Views: {overview.page_views}</p>
          <p>Unique Sessions: {overview.unique_sessions}</p>
          <p>Avg Session Duration: {overview.avg_session_duration}s</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 Error Handling

All endpoints return standard HTTP status codes:

- `200` - Success
- `201` - Created (signup)
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Server Error

Error responses follow this format:
```json
{
  "error": "Error message here"
}
```

---

## 📅 Date/Time Handling

- All timestamps are in **Unix epoch seconds** (not milliseconds)
- Use `from` and `to` query parameters for date filtering
- Example: `from=1704067200` (January 1, 2024 00:00:00 UTC)

**JavaScript helper:**
```javascript
// Convert Date to Unix seconds
const toUnixSeconds = (date) => Math.floor(date.getTime() / 1000);

// Convert Unix seconds to Date
const fromUnixSeconds = (seconds) => new Date(seconds * 1000);

// Example: Last 7 days
const now = new Date();
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const from = toUnixSeconds(sevenDaysAgo);
const to = toUnixSeconds(now);
```

---

## 🚀 Quick Start Checklist

1. ✅ User signs up → Get `access_token`
2. ✅ Store token in localStorage/sessionStorage
3. ✅ User creates site → Get `site_id`
4. ✅ Store `site_id` for later use
5. ✅ Use `site_id` + `access_token` to fetch analytics
6. ✅ Display data in dashboard

---

## 📌 Important Notes

- **Token Expiration:** Tokens expire after 7 days (refresh by logging in again)
- **Site ID:** Public-facing, used in tracker script (no security risk)
- **CORS:** Backend allows all origins for analytics tracking
- **Rate Limiting:** 
  - Events: 100 requests/minute
  - Other APIs: 100 requests/15 minutes

---

## 🧪 Testing with cURL

```bash
# Sign up
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get overview (replace TOKEN and SITE_ID)
curl http://localhost:3000/api/v1/analytics/overview?site_id=SITE_ID \
  -H "Authorization: Bearer TOKEN"
```

---

For tracker script integration, see the main README or `API_FLOW.md`.

