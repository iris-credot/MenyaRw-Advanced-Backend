# Menya Rwanda – Backend API

AI-powered cultural heritage discovery platform for Rwanda.

## Stack
- **Runtime**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (Bearer token)
- **AI Chatbot**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Media**: Cloudinary
- **Email**: Nodemailer
- **Geospatial**: MongoDB 2dsphere indexes + Haversine

## Setup

```bash
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

---

## API Reference

**Base URL**: `http://localhost:5000/api/v1`

All protected routes require: `Authorization: Bearer <token>`

---

### AUTH  `/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register + sends OTP |
| POST | `/auth/login` | ❌ | Login → returns JWT |
| POST | `/auth/verify-otp` | ❌ | Verify email OTP |
| POST | `/auth/resend-otp` | ❌ | Resend OTP |
| POST | `/auth/forgot-password` | ❌ | Send password reset email |
| PATCH | `/auth/reset-password/:token` | ❌ | Reset password via token |
| GET | `/auth/me` | ✅ | Get current user |

---

### USERS  `/users`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/users` | ✅ | admin | Get all users |
| GET | `/users/:id` | ✅ | any | Get user by ID |
| PATCH | `/users/profile` | ✅ | any | Update own profile |
| PATCH | `/users/password` | ✅ | any | Change password |
| DELETE | `/users/:id` | ✅ | admin | Delete user |
| GET | `/users/saved-sites` | ✅ | any | Get saved heritage sites |
| POST | `/users/saved-sites/:siteId` | ✅ | any | Toggle save/unsave a site |
| PATCH | `/users/fcm-token` | ✅ | any | Register push notification token |

---

### HERITAGE SITES  `/sites`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/sites` | ❌ | – | List all published sites (filter, paginate) |
| GET | `/sites/featured` | ❌ | – | Get featured sites |
| GET | `/sites/nearby` | ❌ | – | Sites near coordinates (`?longitude=&latitude=&radius=`) |
| GET | `/sites/:id` | ❌ | – | Get site by ID or slug |
| POST | `/sites` | ✅ | admin | Create heritage site |
| PATCH | `/sites/:id` | ✅ | admin | Update site |
| DELETE | `/sites/:id` | ✅ | admin | Delete site |
| PATCH | `/sites/:id/publish` | ✅ | admin | Toggle published status |
| PATCH | `/sites/:id/feature` | ✅ | admin | Toggle featured status |

**Query filters for GET `/sites`**:
`?category=<id>&province=<name>&historicalPeriod=<period>&search=<text>&page=1&limit=20&sort=-createdAt`

---

### CATEGORIES  `/categories`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/categories` | ❌ | – | List all categories (with site counts) |
| GET | `/categories/:id` | ❌ | – | Get category |
| POST | `/categories` | ✅ | admin | Create category |
| PATCH | `/categories/:id` | ✅ | admin | Update category |
| DELETE | `/categories/:id` | ✅ | admin | Delete category |

---

### REVIEWS  `/sites/:siteId/reviews`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/sites/:siteId/reviews` | ❌ | Get all reviews for a site |
| GET | `/sites/:siteId/reviews/mine` | ✅ | Get my review for a site |
| POST | `/sites/:siteId/reviews` | ✅ | Submit a review |
| PATCH | `/reviews/:id` | ✅ | Edit my review |
| DELETE | `/reviews/:id` | ✅ | Delete review (own or admin) |

---

### VISITS  `/visits`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/visits/sites/:siteId` | ✅ | Log a visit / check-in |
| GET | `/visits/my` | ✅ | Get my visit history |
| GET | `/visits/sites/:siteId/check` | ✅ | Check if I've visited this site |
| GET | `/visits/sites/:siteId/stats` | ✅ (admin) | Visit analytics for a site |

---

### NOTIFICATIONS  `/notifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | ✅ | Get my notifications (`?unreadOnly=true`) |
| PATCH | `/notifications/read-all` | ✅ | Mark all as read |
| PATCH | `/notifications/:id/read` | ✅ | Mark one as read |
| DELETE | `/notifications/:id` | ✅ | Delete notification |

---

### AI CHATBOT  `/chatbot`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/chatbot/sessions` | ✅ | Get my chat sessions |
| GET | `/chatbot/sessions/current` | ✅ | Get/create active session (`?siteId=&language=en`) |
| POST | `/chatbot/sessions/:sessionId/message` | ✅ | Send a message → AI reply |
| GET | `/chatbot/sessions/:sessionId/history` | ✅ | Get session history |
| PATCH | `/chatbot/sessions/:sessionId/close` | ✅ | Close session |

---

### GEOFENCING  `/geofence`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/geofence/ping` | ✅ | Send GPS location → triggers notifications for nearby sites |
| GET | `/geofence/check` | ✅ | Get all sites within radius (`?longitude=&latitude=&radius=5000`) |

---

## Data Models

### Site – Multilingual fields
All content fields (name, shortDescription, fullStory, significance) support:
```json
{ "en": "...", "rw": "...", "fr": "..." }
```

### Site – Geofence zones
- `2km` zone: teaser notification ("You are near Kandt House Museum!")
- `500m` zone: welcome notification with full site introduction

### Site categories (fixed enum)
- Royal Heritage
- Genocide Memorial
- Natural Heritage
- Colonial-Era Site
- Living Cultural Site

### Provinces
- Kigali City, Northern, Southern, Eastern, Western