# Relentless Billionaire API Worker

Unified API Worker for Relentless Billionaire - Admin auth, content CRUD, payments, messaging, media management, and GOT BEATS? marketplace.

## Current Status

**Status:** ✅ Operational  
**Worker URL:** https://relentless-billionaire-api.tge40000.workers.dev  
**Authentication:** Cloudflare Access (enforced)  
**KV Configuration:** Fallback mode (ADMIN_AUTH with fallback for CONTENT, SETTINGS, METRICS, SESSIONS)

## Features

- Admin authentication with password reset
- Content CRUD for multiple collections
- Media upload/management via R2
- GOT BEATS? audio marketplace
- Membership tier discounts
- Stripe payment integration (placeholder)
- SMS messaging via Telnyx (placeholder)
- Email messaging via Resend (placeholder)
- Cloudflare Access protection

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure wrangler.toml
- KV namespace ID already configured: `a5a8acb98514418184de30c1eb8f4dff`
- R2 bucket already configured: `rbb`
- Environment variables already set

### 3. Deploy
```bash
npm run deploy
```

### 4. Access Worker
- Navigate to: https://relentless-billionaire-api.tge40000.workers.dev
- Authenticate via Cloudflare Access
- Access API endpoints

## Authentication

**Cloudflare Access** is enabled and required for all API endpoints. Frontend requests must include the CF_Authorization token:

```javascript
const getCFAccessToken = () => {
  const match = document.cookie.match(/CF_Authorization=([^;]+)/);
  return match ? match[1] : null;
};

const authenticatedFetch = async (url, options = {}) => {
  const token = getCFAccessToken();
  const headers = {
    ...options.headers,
    'Cookie': token ? `CF_Authorization=${token}` : ''
  };
  return fetch(url, { ...options, headers, credentials: 'include' });
};
```

## Environment Variables

### Variables (set in wrangler.toml)
- `ADMIN_EMAIL` - Admin email address (default: relentlessbillionaire@outlook.com)
- `EMAIL_FROM` - From email for Resend (default: noreply@relentlessbillionaire.com)
- `TELNYX_FROM` - Telnyx phone number (update with actual number)

### Secrets (set via wrangler secret) - Optional
- `STRIPE_SECRET_KEY` - Stripe API secret key (for payments)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `TELNYX_API_KEY` - Telnyx API key for SMS
- `RESEND_API_KEY` - Resend API key for email

## KV Namespaces

### Current Configuration (Fallback Mode)
- `ADMIN_AUTH` - Admin credentials, reset tokens, content, settings, metrics, sessions (ID: a5a8acb98514418184de30c1eb8f4dff)

### Optional Enhancement
For enhanced separation, create additional KV namespaces:
- `CONTENT` - Content collections
- `SETTINGS` - Site configuration
- `METRICS` - Analytics metrics
- `SESSIONS` - User sessions

**Setup Guide:** See KV-NAMESPACE-SETUP-GUIDE.md

## API Endpoints

### Health
- `GET /api/health` - Health check (requires CF Access)

### Admin Auth (requires CF Access)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `POST /api/admin/request-reset` - Request password reset
- `POST /api/admin/reset-password` - Confirm password reset

### Admin Secure (requires CF Access + Admin Auth)
- `GET /api/admin/secure/content/:collection` - List content
- `POST /api/admin/secure/content/:collection` - Create content
- `PUT /api/admin/secure/content/:collection` - Update content
- `DELETE /api/admin/secure/content/:collection` - Delete content
- `GET /api/admin/secure/settings/:key` - Get setting
- `PUT /api/admin/secure/settings/:key` - Update setting
- `POST /api/admin/secure/media/upload` - Upload media to R2
- `GET /api/admin/secure/media/list` - List media files
- `DELETE /api/admin/secure/media/delete` - Delete media file

### Public (requires CF Access, read-only)
- `GET /api/public/content/:collection` - List public content
- `GET /api/public/media/get/:key` - Get public media
- `GET /api/public/settings/:key` - Get public setting

### Payments (requires configuration)
- `POST /api/payments/checkout` - Create Stripe checkout session
- `POST /api/payments/webhook` - Stripe webhook handler

### Messaging (requires configuration)
- `POST /api/messaging/sms` - Send SMS via Telnyx
- `POST /api/messaging/email` - Send email via Resend

## Content Collections

Valid collections:
- `artists` - Artist profiles
- `services` - Service offerings
- `vendors` - Vendor information
- `events` - Events calendar
- `memberships` - Membership tiers
- `bookings` - Booking records
- `beats` - Audio beats for GOT BEATS? marketplace (NEW)

## Media Categories

Supported media categories:
- `videos` - Video files
- `images` - Image files
- `audio` - Audio files (for beats) (NEW)
- `banners` - Banner images
- `thumbnails` - Thumbnail images
- `misc` - Miscellaneous files

## GOT BEATS? Feature

### Components
- `AudioPlayer.js` - Audio player with purchase button
- `BeatsMarketplace.js` - Marketplace with filtering and membership discounts
- `GotBeatsTab.js` - Tab component with Marketplace and Manage views
- `BeatsAdmin.js` - Admin interface for beat management

### Integration
```jsx
import GotBeatsTab from './GotBeatsTab';

<GotBeatsTab 
  apiBaseUrl="https://relentless-billionaire-api.tge40000.workers.dev"
  userMembership={user.membershipTier}
  isAdmin={user.role === 'admin'}
/>
```

### Membership Discounts
- **STARTER:** 10% discount
- **PRO:** 25% discount
- **ELITE:** 40% discount
- **Guest:** No discount

## Security Notes

- **Authentication:** Cloudflare Access required for all endpoints
- **Default admin password:** `ChangeMeNow!123` (change immediately after first login)
- **Session expiration:** 24 hours
- **Password reset expiration:** 15 minutes
- **Password hashing:** Web Crypto API (SHA-256)
- **File upload limit:** 100MB max
- **Supported file types:** images, videos, audio (MP3, WAV, OGG, M4A)

## Worker Compatibility

**Important:** This worker uses Web Crypto API instead of bcryptjs and nanoid for Cloudflare Workers compatibility:
- Password hashing: `crypto.subtle.digest('SHA-256', ...)`
- ID generation: `crypto.randomUUID()`
- No external dependencies for crypto operations

## Documentation

- **OPERATIONAL-STATUS.md** - Detailed operational status
- **KV-NAMESPACE-SETUP-GUIDE.md** - Guide for creating additional KV namespaces
- **GOT-BEATS-INTEGRATION.md** - GOT BEATS? integration instructions
- **INTEGRATION-SUMMARY.md** - Media management component summary
- **R2-SETUP.md** - R2 bucket configuration
- **DEPLOYMENT-CHECKLIST.md** - Comprehensive deployment checklist
- **OPERATIONAL-SUMMARY.md** - Complete operational summary

## Development

### Local Development
```bash
npm run dev
```

### Deployment
```bash
npm run deploy
```

### View Logs
```bash
npm run tail
```

## Troubleshooting

### Authentication Errors
- Ensure Cloudflare Access is properly configured
- Check that frontend includes CF Access tokens
- Verify user has access to the application

### KV Namespace Errors
- Fallback mode allows system to work with single KV namespace
- Create additional namespaces when ready (see KV-NAMESPACE-SETUP-GUIDE.md)
- Update wrangler.toml with actual namespace IDs

### Media Upload Errors
- Ensure R2 bucket "rbb" exists and is accessible
- Check file size (max 100MB)
- Verify file type is supported (images, videos, audio)

## Updates (April 16, 2026)

- Replaced bcryptjs/nanoid with Web Crypto API for Workers compatibility
- Added fallback logic for KV namespaces (ADMIN_AUTH as fallback)
- Updated all frontend components with Cloudflare Access authentication
- Added audio file support (MP3, WAV, OGG, M4A)
- Added beats collection for GOT BEATS? feature
- Added Stripe checkout support for beat purchases
- Deployed worker successfully to Cloudflare
- Created comprehensive documentation
