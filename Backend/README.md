# Backend - Study Pro Global

✅ **STATUS: PRODUCTION READY**

This folder contains the complete backend server application for the Study Pro Global EdTech portal.

## Overview

The backend provides all the business logic, database operations, and integrations required for the EdTech portal to function. It is a full-featured Express.js REST API with MySQL database integration.

## ✅ Implementation Complete

### Current Tech Stack: Node.js + Express

```
Backend/
├── config/             # Configuration files
│   └── database.js     # MySQL connection pool & table setup
├── middleware/         # Custom middleware
│   └── auth.js         # JWT authentication & authorization
├── routes/             # API routes (all implemented)
│   ├── auth.js         # Authentication endpoints
│   ├── users.js        # User profile management
│   ├── universities.js # University search & details
│   ├── applications.js # Application submission
│   ├── subscriptions.js# Subscription management
│   ├── payments.js     # Payment processing
│   ├── scholarships.js # Scholarship listings
│   ├── courses.js      # Course management
│   └── chat.js         # AI chat support
├── utils/              # Helper functions
│   └── helpers.js      # Common utilities
├── .env.example        # Environment template (pre-configured)
├── package.json        # Dependencies
├── server.js           # Entry point
├── sample_data.sql     # Sample data for testing
├── setup_database.sh   # Database setup script
├── API_TESTING.md      # Complete API testing guide
└── PRODUCTION_SETUP.md # Deployment guide
```

## ✅ Implemented Features

### 1. Authentication & Authorization ✅
- ✅ User registration and login
- ✅ JWT token generation and validation
- ✅ Role-based access control (Student, Admin)
- ✅ Secure password hashing with bcrypt

### 2. User Management ✅
- ✅ User profile management
- ✅ Profile completion tracking (automatic calculation)
- ✅ Document upload endpoints (ready for S3 integration)
- ✅ Progress tracking

### 3. University Management ✅
- ✅ University search with filters
- ✅ Program listings
- ✅ Advanced search and filter functionality
- ✅ Tier-based access control (limited results for free users)

### 4. Application Management ✅
- ✅ Application submission workflow
- ✅ Application tracking with status
- ✅ Document management
- ✅ Free vs Paid application limits (enforced)
- ✅ Subscription-based feature access

### 5. Subscription Management ✅
- ✅ Three subscription plans (Asia $25, Europe $50, Global $100)
- ✅ Subscription activation and expiration
- ✅ Feature access control based on subscription tier
- ✅ 2-year validity tracking (automatic)

### 6. Payment Processing ✅
- ✅ Payment creation and tracking
- ✅ Multiple payment methods ($myxn Token & Credit Card)
- ✅ Payment verification system
- ✅ Transaction history
- ✅ Webhook endpoint (ready for Stripe integration)

### 7. Scholarship Management ✅
- ✅ Scholarship listings with filters
- ✅ Auto scholarship matching algorithm (premium feature)
- ✅ Match scoring system
- ✅ Deadline tracking

### 8. Course Management ✅
- ✅ Free and paid courses
- ✅ Course enrollment system
- ✅ Course filtering (by type)
- ✅ Enrollment tracking

### 9. AI Chat Support ✅
- ✅ Conversation management
- ✅ Message history tracking
- ✅ Tier-based AI responses (basic vs premium)
- ✅ Ready for OpenAI integration

### 10. Security Features ✅
- ✅ Helmet for HTTP security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation with express-validator
- ✅ SQL injection prevention
- ✅ XSS protection

## Database Schema

### Core Tables
- `users` - User accounts
- `profiles` - User profiles
- `subscriptions` - Subscription records
- `universities` - University data
- `programs` - University programs
- `applications` - Student applications
- `payments` - Payment transactions
- `scholarships` - Scholarship opportunities
- `courses` - Professional courses
- `documents` - Uploaded documents

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/studypro
# or
MONGODB_URI=mongodb://localhost:27017/studypro

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# Payment Gateways
MYXN_TOKEN_API_KEY=
MYXN_TOKEN_WEBHOOK_SECRET=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Newsletter
MAILCHIMP_API_KEY=
MAILCHIMP_LIST_ID=

# AI Chat
AI_CHAT_API_KEY=
AI_CHAT_ENDPOINT=

# File Upload
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# Application
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
```

## Getting Started

### Prerequisites
- Node.js 16+ or 18+ (LTS)
- MySQL 5.7+ or MariaDB 10.3+
- PM2 (for production deployment)

### Quick Start

#### 1. Install Dependencies
```bash
cd Backend
npm install
```

#### 2. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and update any values you need
nano .env
```

The `.env.example` is pre-configured with:
- ✅ Database credentials (from production server)
- ✅ Secure JWT secrets (auto-generated)
- ✅ Production-ready configuration

#### 3. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will:
1. Connect to the MySQL database
2. Automatically create all required tables
3. Start listening on port 3000 (configurable)

#### 4. (Optional) Import Sample Data
```bash
# After the server has started at least once
./setup_database.sh
# Choose option 2 to import sample data
```

## API Documentation

See the `../API` folder for detailed API documentation and endpoints.

## API Documentation

See [API_TESTING.md](./API_TESTING.md) for complete API documentation and testing examples.

### Quick Test
```bash
# Health check
curl http://localhost:3000/api/health

# Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "country": "USA"
  }'

# Get subscription plans
curl http://localhost:3000/api/v1/subscriptions/plans
```

## Production Deployment

The backend is **ready for production deployment** to `www.studyproglobal.com.bd`.

### Automatic Deployment via cPanel

The `.cpanel.yml` file is configured to automatically deploy the backend to:
- Path: `/home/myxenpay/studypro-backend/`
- On every push to GitHub

See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for complete deployment guide.

### Manual Deployment

```bash
# On production server
cd /home/myxenpay/studypro-backend/
cp .env.example .env
npm install --production
pm2 start server.js --name studyproglobal-api
pm2 save
```

## Database

### Automatic Table Creation
All database tables are created automatically on first run. No manual SQL scripts needed!

Tables created:
- users, universities, programs
- applications, documents
- subscriptions, payments
- scholarships, courses
- chat_conversations, chat_messages

### Sample Data
Import sample data for testing:
```bash
./setup_database.sh
# Choose option 2
```

## Security Features

✅ **Implemented:**
- ✅ Input validation and sanitization (express-validator)
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (helmet)
- ✅ Rate limiting (100 requests per 15 min)
- ✅ Secure password hashing (bcrypt with 10 rounds)
- ✅ JWT token authentication
- ✅ CORS configuration
- ✅ HTTP security headers (helmet)

**Configure in Production:**
- SSL/TLS certificate (via cPanel or Let's Encrypt)
- Environment variables security (.env not in git)
- Regular security updates
