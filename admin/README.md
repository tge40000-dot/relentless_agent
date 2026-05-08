# RELENTLESS BILLIONAIRE - Admin Dashboard

A complete, production-ready admin dashboard for managing the Relentless Billionaire platform.

## Features

- **Full CRUD Operations**: Manage artists, services, vendors, events, memberships, and bookings
- **Authentication**: Secure cookie-based session management
- **Real-time Data**: SWR-powered data fetching and caching
- **System Monitoring**: Health checks, backups, and metrics
- **Communication**: SMS and email messaging capabilities
- **Settings Management**: Theme, typography, branding, and social links
- **Revenue Tracking**: Payment transactions and scaling budget (10% rule)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom gold/black theme
- **State Management**: SWR for server state
- **Authentication**: Cookie-based sessions
- **API Integration**: Relentless Billionaire Worker endpoints

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

The admin dashboard connects to your Worker API at:
- API Base URL: `https://api.relentlessbillionaire.com`

## Deployment

### Cloudflare Pages

1. Build the application: `npm run build`
2. Deploy the `out` directory to Cloudflare Pages
3. Configure custom domain (e.g., admin.relentlessbillionaire.com)
4. Set up environment variables if needed

### Authentication

The admin dashboard uses secure cookie-based authentication:
- Login endpoint: `/api/admin/login`
- Logout endpoint: `/api/admin/logout`
- Session cookies are automatically managed

## Dashboard Sections

### Content Management
- **Artists**: Manage artist profiles and information
- **Services**: Service listings and descriptions
- **Vendors**: Vendor management
- **Events**: Event creation and management
- **Memberships**: Tier management (STARTER, PRO, ELITE)
- **Bookings**: Booking system management

### System Management
- **Payments**: Transaction monitoring and tracking
- **SMS**: Send SMS messages to customers
- **Email**: Email communication system
- **Settings**: Site configuration
- **Theme**: Visual theme customization
- **Typography**: Font and text styling
- **Branding**: Brand assets and identity
- **Social**: Social media links management
- **Backups**: System backup and restore
- **System Health**: Monitoring and metrics

## Security Features

- Secure cookie-based authentication
- API endpoint protection
- Input validation and sanitization
- CORS configuration
- HTTPS enforcement

## Business Rules

- **10% Scaling Rule**: Only 10% of revenue can be used for scaling
- **Approval Required**: Christopher approval needed for major decisions
- **Revenue Tracking**: All transactions logged for optimization
- **Data Protection**: Customer data encrypted at rest

## Support

For technical support or questions:
- Contact Christopher for platform decisions
- Check system health dashboard for status
- Review logs for troubleshooting

---

© 2026 Relentless Billionaire. All rights reserved.
