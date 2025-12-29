# API Documentation

This document describes the public API endpoints available for the Awesome Mac application.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
- [Error Codes](#error-codes)
- [Type Definitions](#type-definitions)

---

## Base URL

```
https://jaywcjlove.github.io/awesome-mac/api
```

For local development:

```
http://localhost:3000/api
```

---

## Authentication

Currently, public endpoints do not require authentication. Future admin endpoints may use API keys.

### Header Authentication (Future)

```http
Authorization: Bearer YOUR_API_KEY
```

---

## Rate Limiting

All API endpoints are rate limited to prevent abuse.

### Default Limits

| Endpoint      | Requests | Window   |
| ------------- | -------- | -------- |
| `/api/search` | 60       | 1 minute |
| `/api/vitals` | 10       | 1 minute |
| Other         | 100      | 1 minute |

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200000
Retry-After: 30
```

### Rate Limit Error

When the rate limit is exceeded:

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

**Status Code**: 429 Too Many Requests

---

## Endpoints

### Search API

Search for applications by name, description, or category.

#### Endpoint

```
GET /api/search
```

#### Query Parameters

| Parameter | Type   | Required | Default | Description             |
| --------- | ------ | -------- | ------- | ----------------------- |
| `q`       | string | No       | -       | Search query string     |
| `page`    | number | No       | 1       | Page number (1-100)     |
| `limit`   | number | No       | 10      | Results per page (1-50) |

#### Example Request

```bash
curl "https://jaywcjlove.github.io/awesome-mac/api/search?q=vscode&limit=10"
```

#### Response

```json
{
  "q": "vscode",
  "results": [
    {
      "id": "developer-toolsvisual-studio-code",
      "slug": "visual-studio-code",
      "name": "Visual Studio Code",
      "description": "Code editor. Free, open-source, cross-platform source code editor.",
      "categoryId": "developer-tools",
      "categoryName": "Developer Tools",
      "isFree": true,
      "isOpenSource": true,
      "isAppStore": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "hasMore": false
  },
  "suggestions": [],
  "analytics": {
    "searchId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Response Fields

| Field         | Type   | Description                              |
| ------------- | ------ | ---------------------------------------- |
| `q`           | string | The sanitized search query               |
| `results`     | array  | Array of matching apps                   |
| `pagination`  | object | Pagination information                   |
| `suggestions` | array  | Suggested search terms (when no results) |
| `analytics`   | object | Analytics metadata                       |

#### App Summary Object

| Field          | Type    | Description                         |
| -------------- | ------- | ----------------------------------- |
| `id`           | string  | Unique app identifier               |
| `slug`         | string  | URL-friendly app identifier         |
| `name`         | string  | App name                            |
| `description`  | string  | App description                     |
| `categoryId`   | string  | Category identifier                 |
| `categoryName` | string  | Category name                       |
| `isFree`       | boolean | Whether the app is free             |
| `isOpenSource` | boolean | Whether the app is open source      |
| `isAppStore`   | boolean | Whether the app is on the App Store |

#### Search Behavior

1. **Exact Match**: Highest priority for exact name matches
2. **Prefix Match**: Medium priority for names starting with query
3. **Contains Match**: Lower priority for names containing query
4. **Description Match**: Lower priority for description matches
5. **Category Match**: Bonus for matching category name

#### Empty Query

If `q` is empty or not provided, returns empty results:

```json
{
  "q": "",
  "results": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "hasMore": false
  }
}
```

---

### Web Vitals API

Submit Core Web Vitals metrics for performance monitoring.

#### Endpoint

```
POST /api/vitals
```

#### Request Body

```json
{
  "name": "LCP",
  "value": 1234,
  "rating": "good",
  "delta": 100,
  "id": "metric-id",
  "page": "/apps/visual-studio-code"
}
```

#### Request Fields

| Field    | Type   | Required | Description                                 |
| -------- | ------ | -------- | ------------------------------------------- |
| `name`   | string | Yes      | Metric name (LCP, FID, CLS, FCP, TTFB, INP) |
| `value`  | number | Yes      | Metric value in milliseconds                |
| `rating` | string | No       | Rating (good, needs-improvement, poor)      |
| `delta`  | number | No       | Difference from previous value              |
| `id`     | string | Yes      | Unique metric identifier                    |
| `page`   | string | Yes      | Page URL where metric was measured          |

#### Valid Metric Names

| Name   | Full Name                 | Description                    |
| ------ | ------------------------- | ------------------------------ |
| `LCP`  | Largest Contentful Paint  | Largest image/text render time |
| `FID`  | First Input Delay         | Time to first user interaction |
| `CLS`  | Cumulative Layout Shift   | Visual stability score         |
| `FCP`  | First Contentful Paint    | First content render time      |
| `TTFB` | Time to First Byte        | Server response time           |
| `INP`  | Interaction to Next Paint | Interaction responsiveness     |

#### Response

**Success**: 204 No Content

**Error**:

```json
{
  "error": "Invalid request body",
  "details": [...]
}
```

---

## Error Codes

### Standard Errors

| Status Code | Error                 | Description                     |
| ----------- | --------------------- | ------------------------------- |
| 400         | Bad Request           | Invalid request parameters      |
| 404         | Not Found             | Resource not found              |
| 429         | Too Many Requests     | Rate limit exceeded             |
| 500         | Internal Server Error | Server error                    |
| 503         | Service Unavailable   | Service temporarily unavailable |

### Error Response Format

```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "code": "ERROR_CODE"
}
```

### Specific Error Codes

| Code                  | Description                       |
| --------------------- | --------------------------------- |
| `INDEX_UNAVAILABLE`   | Search index is being updated     |
| `INVALID_PARAMS`      | Invalid query parameters          |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded               |
| `UNAUTHORIZED`        | Invalid or missing authentication |
| `NOT_FOUND`           | Requested resource not found      |
| `SERVER_ERROR`        | Internal server error             |

### Example Error Response

```json
{
  "error": "Search index unavailable",
  "message": "The search index is currently being updated. Please try again later.",
  "code": "INDEX_UNAVAILABLE"
}
```

**Headers**:

```http
Retry-After: 60
```

---

## Type Definitions

### AppSummary

```typescript
interface AppSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  isFree: boolean;
  isOpenSource: boolean;
  isAppStore: boolean;
}
```

### Pagination

```typescript
interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
```

### SearchResponse

```typescript
interface SearchResponse {
  q: string;
  results: AppSummary[];
  pagination: Pagination;
  suggestions?: string[];
  analytics?: SearchAnalytics;
}
```

### SearchAnalytics

```typescript
interface SearchAnalytics {
  searchId: string;
  timestamp: string; // ISO 8601
}
```

### WebVitalMetric

```typescript
interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
  page: string;
}
```

### ErrorResponse

```typescript
interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
}
```

---

## CORS

The API supports CORS for cross-origin requests.

### Allowed Origins

By default, the API allows requests from:

- `https://jaywcjlove.github.io`
- `http://localhost:3000` (development)

### CORS Headers

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

### Preflight Request

```bash
curl -X OPTIONS https://jaywcjlove.github.io/awesome-mac/api/search \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: GET"
```

---

## Security Headers

All API responses include security headers:

```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Resource-Policy: same-origin
```

---

## JavaScript Client

A TypeScript client is included in the project:

```typescript
import { api } from '@/types/api';

// Search
const results = await api.search({ q: 'vscode', limit: 10 });
console.log(results.results);

// Submit web vitals
await api.submitWebVital({
  name: 'LCP',
  value: 1234,
  rating: 'good',
  id: 'metric-1',
  page: '/apps/visual-studio-code',
});
```

### Standalone Usage

```typescript
class AwesomeMacAPI {
  constructor(baseURL: string = '/api');
  async search(params: SearchRequest): Promise<SearchResponse>;
  async submitWebVital(metric: WebVitalMetric): Promise<void>;
}

const api = new AwesomeMacAPI('https://jaywcjlove.github.io/awesome-mac/api');
const results = await api.search({ q: 'browser' });
```

---

## SDKs

### Official SDKs

Currently, only the JavaScript/TypeScript client is provided.

### Community SDKs

If you create a community SDK, please submit a PR to add it here.

---

## Changelog

### Version 1.0.0

- Initial public API release
- Search endpoint
- Web Vitals endpoint
- Rate limiting
- CORS support

---

## Support

For issues, questions, or feature requests:

- **GitHub Issues**: https://github.com/jaywcjlove/awesome-mac/issues
- **Documentation**: See [DEVELOPMENT.md](DEVELOPMENT.md) for development setup

---

## License

The API and its documentation are licensed under the same terms as the Awesome Mac project: CC-BY-SA-4.0
