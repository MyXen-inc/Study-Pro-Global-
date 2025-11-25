# Subdomain Configuration Guide

## Overview

Study Pro Global uses a multi-subdomain architecture across two domains for better organization and scalability:

**Why Two Domains?**
- **studyproglobal.com** - Primary frontend domain for public-facing website
- **studyproglobal.com.bd** - Backend services domain for API, mobile, and admin interfaces

This separation provides:
- Better load distribution
- Enhanced security (API isolated from frontend)
- Geographical flexibility
- Easier scaling of individual services

```
┌─────────────────────────────────────────────────────────────┐
│           studyproglobal.com + studyproglobal.com.bd        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┬────────────┐
        │                   │                   │            │
        ▼                   ▼                   ▼            ▼
┌───────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐
│www.           │  │api.          │  │mobile.       │  │studypro-backend.│
│studyproglobal │  │studyproglobal│  │studyproglobal│  │studyproglobal   │
│.com           │  │.com.bd       │  │.com.bd       │  │.com.bd          │
│               │  │              │  │              │  │                 │
│Frontend       │  │Backend API   │  │Mobile App    │  │Admin Dashboard  │
│(HTML/CSS/JS)  │  │(Node.js)     │  │(React Native)│  │(Admin Panel)    │
│Port: 80/443   │  │Port: 3000    │  │Port: 80/443  │  │Port: 80/443     │
└───────────────┘  └──────────────┘  └──────────────┘  └─────────────────┘
```

## Subdomain Structure

### 1. **www.studyproglobal.com** (Main Frontend)
- **Purpose**: Public-facing website
- **Domain**: studyproglobal.com
- **Location**: `/home/myxenpay/studyproglobal.com/`
- **Technology**: HTML, CSS, JavaScript
- **Content**: Homepage, blog, university listings, user dashboard

### 2. **api.studyproglobal.com.bd** (Backend API)
- **Purpose**: RESTful API server
- **Domain**: studyproglobal.com.bd
- **Location**: `/home/myxenpay/studypro-backend/`
- **Technology**: Node.js + Express
- **Port**: 3000
- **Endpoints**: `/api/v1/*`

### 3. **mobile.studyproglobal.com.bd** (Mobile App)
- **Purpose**: Mobile application or mobile-optimized interface
- **Domain**: studyproglobal.com.bd
- **Location**: `/home/myxenpay/mobile.studyproglobal.com.bd/`
- **Technology**: React Native or Mobile-optimized HTML

### 4. **studypro-backend.studyproglobal.com.bd** (Admin Dashboard)
- **Purpose**: Administrative backend interface
- **Domain**: studyproglobal.com.bd
- **Location**: `/home/myxenpay/studypro-backend-admin/`
- **Technology**: Admin panel for content management

## Quick Reference

| Service | URL | Domain | Purpose |
|---------|-----|--------|---------|
| Frontend | https://www.studyproglobal.com | .com | Public website |
| Backend API | https://api.studyproglobal.com.bd | .com.bd | REST API |
| Mobile | https://mobile.studyproglobal.com.bd | .com.bd | Mobile interface |
| Admin | https://studypro-backend.studyproglobal.com.bd | .com.bd | Admin panel |

## cPanel Setup Instructions

### Step 1: Add Both Domains to cPanel

First, ensure both domains are added to your cPanel account:
1. Log in to cPanel
2. Navigate to **Domains** → **Domains**
3. Add **studyproglobal.com** (primary domain for frontend)
4. Add **studyproglobal.com.bd** (for API and backend services)

### Step 2: Create Subdomains in cPanel

Navigate to **Domains** → **Subdomains** and create the following:

#### Frontend (Main Domain)
- **Domain**: `www.studyproglobal.com`
- **Document Root**: `/home/myxenpay/studyproglobal.com/`
- Note: This is the primary public-facing website

#### API Subdomain
- **Subdomain**: `api`
- **Domain**: `studyproglobal.com.bd`
- **Document Root**: `/home/myxenpay/api.studyproglobal.com.bd`
- Note: This will proxy to the Node.js backend running on port 3000

#### Mobile Subdomain
- **Subdomain**: `mobile`
- **Domain**: `studyproglobal.com.bd`
- **Document Root**: `/home/myxenpay/mobile.studyproglobal.com.bd`

#### Backend Admin Subdomain
- **Subdomain**: `studypro-backend`
- **Domain**: `studyproglobal.com.bd`
- **Document Root**: `/home/myxenpay/studypro-backend-admin`

### Step 2: Configure Node.js Application for API

1. Go to cPanel → **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   ```
   Node.js version: 16.x or higher
   Application mode: Production
   Application root: /home/myxenpay/studypro-backend
   Application URL: api.studyproglobal.com.bd
   Application startup file: server.js
   Passenger log file: /home/myxenpay/studypro-backend/logs/passenger.log
   ```
4. Click **Create**
5. Click **Run NPM Install**
6. Click **Start Application**

### Step 3: SSL Certificates

Enable SSL for all subdomains:
1. Go to cPanel → **SSL/TLS Status**
2. Select all subdomains
3. Click **Run AutoSSL**

Or use Let's Encrypt:
1. Go to cPanel → **SSL/TLS**
2. Select **Manage SSL sites**
3. Install certificates for each subdomain

### Step 4: Configure API Proxy (Alternative Method)

If you prefer Apache proxy instead of Node.js app manager:

1. Create `/home/myxenpay/api.studyproglobal.com.bd/.htaccess`:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

2. Ensure PM2 is running the backend:
```bash
pm2 start /home/myxenpay/studypro-backend/ecosystem.config.js --env production
pm2 save
```

## Frontend Configuration

Update API endpoint in `Frontend/js/config.js`:
```javascript
const CONFIG = {
  API: {
    BASE_URL: window.location.hostname === 'localhost' 
      ? 'http://localhost:3000/api/v1'
      : 'https://api.studyproglobal.com.bd/api/v1'
  },
  PAYMENT: {
    // Payment configuration
    WALLET_ADDRESS: 'Azvjj21uXQzHbM9VHhyDfdbj14HD8Tef7ZuC1p7sEMk9'
  }
};
```

## Backend Configuration

Update CORS in `Backend/server.js`:
```javascript
const corsOptions = {
  origin: [
    // Primary frontend domain (.com)
    'https://www.studyproglobal.com',
    'https://studyproglobal.com',
    
    // API and backend services (.com.bd)
    'https://api.studyproglobal.com.bd',
    'https://mobile.studyproglobal.com.bd',
    'https://studypro-backend.studyproglobal.com.bd',
    
    // Local development
    'http://localhost:3000',
    'http://localhost:5500'
  ],
  credentials: true
};
```

## Environment Variables

In `Backend/.env`:
```env
# API URL
APP_URL=https://api.studyproglobal.com.bd

# CORS Origins - Frontend (.com) + Backend services (.com.bd)
CORS_ORIGIN=https://www.studyproglobal.com,https://studyproglobal.com,https://api.studyproglobal.com.bd,https://mobile.studyproglobal.com.bd,https://studypro-backend.studyproglobal.com.bd

# Frontend URL for redirects
FRONTEND_URL=https://www.studyproglobal.com
```

## Testing the Setup

### Test API Subdomain
```bash
curl https://api.studyproglobal.com.bd/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Study Pro Global API",
  "environment": "production",
  "database": "connected",
  "timestamp": "2024-11-25T19:30:00.000Z"
}
```

### Test Frontend to API Communication
1. Open `https://www.studyproglobal.com.bd`
2. Open browser console (F12)
3. Check Network tab for API requests to `api.studyproglobal.com.bd`
4. Verify no CORS errors

## Troubleshooting

### CORS Errors
- Verify all subdomains are listed in `Backend/server.js` CORS config
- Check that SSL is enabled on all subdomains
- Ensure credentials: true is set in CORS options

### API Not Responding
- Check PM2 status: `pm2 status`
- View logs: `pm2 logs studyproglobal-api`
- Verify port 3000 is open: `netstat -tulpn | grep 3000`

### 502 Bad Gateway
- Ensure Node.js app is running in cPanel
- Check Apache proxy configuration
- Verify backend path is correct

## File Structure

```
/home/myxenpay/
├── studyproglobal.com/             # Main frontend (.com domain)
│   ├── index.html
│   ├── css/
│   ├── js/
│   │   └── config.js               # Points to api.studyproglobal.com.bd
│   └── uploads/
│
├── api.studyproglobal.com.bd/      # API subdomain document root
│   └── .htaccess                   # Proxy to port 3000 (if using Apache)
│
├── mobile.studyproglobal.com.bd/   # Mobile subdomain
│   └── index.html
│
├── studypro-backend-admin/         # Admin dashboard subdomain
│   └── index.html
│
└── studypro-backend/               # Backend application (outside public)
    ├── server.js
    ├── .env
    ├── ecosystem.config.js
    ├── package.json
    └── logs/
```

## Security Considerations

1. **Backend Location**: Backend code is outside public_html for security
2. **Environment Variables**: Never commit `.env` files
3. **API Authentication**: All API endpoints require JWT tokens
4. **Rate Limiting**: API has rate limiting enabled (100 req/15min)
5. **HTTPS Only**: All subdomains should use HTTPS in production

## Deployment Workflow

1. **Update Code**: Push changes to repository
2. **Deploy Frontend** (www.studyproglobal.com): 
   ```bash
   cd /home/myxenpay/studyproglobal.com
   git pull origin main
   # Copy Frontend directory contents
   cp -r Frontend/* .
   ```
3. **Deploy Backend API** (api.studyproglobal.com.bd):
   ```bash
   cd /home/myxenpay/studypro-backend
   git pull origin main
   # Copy Backend directory contents
   cp -r Backend/* .
   # Note: API directory contains documentation only, not deployable code
   npm install --production
   bash scripts/deploy.sh
   pm2 restart studyproglobal-api
   ```
4. **Deploy Mobile** (mobile.studyproglobal.com.bd):
   ```bash
   cd /home/myxenpay/mobile.studyproglobal.com.bd
   git pull origin main
   # Copy Mobile directory contents
   cp -r Mobile/* .
   ```
5. **Verify**: Test all subdomains and API endpoints

## Additional Resources

- [cPanel Node.js Documentation](https://docs.cpanel.net/cpanel/software/application-manager/)
- [PM2 Process Manager](https://pm2.keymetrics.io/)
- [Express CORS Guide](https://expressjs.com/en/resources/middleware/cors.html)
