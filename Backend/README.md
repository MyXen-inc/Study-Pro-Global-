# Backend - Study Pro Global

This folder contains the backend server application for the Study Pro Global EdTech portal.

## Overview

The backend provides the business logic, database operations, and integrations required for the EdTech portal to function.

## Recommended Tech Stack

### Option 1: Node.js + Express
```
Backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── services/       # Business logic
│   └── utils/          # Helper functions
├── config/             # Configuration files
├── tests/              # Test files
├── package.json
└── server.js          # Entry point
```

### Option 2: Python + Django/Flask
```
Backend/
├── app/
│   ├── models/         # Database models
│   ├── views/          # View functions
│   ├── serializers/    # Data serializers
│   └── utils/          # Helper functions
├── config/             # Configuration
├── tests/              # Test files
├── requirements.txt
└── manage.py          # Entry point
```

## Key Features to Implement

### 1. Authentication & Authorization
- User registration and login
- JWT token generation and validation
- Role-based access control (Student, Admin, University Partner)
- Password reset functionality

### 2. User Management
- User profile management
- Profile completion tracking
- Document upload (CV, certificates)
- Progress tracking

### 3. University Management
- University CRUD operations
- Program listings
- Search and filter functionality
- University ambassador system

### 4. Application Management
- Application submission workflow
- Application tracking
- Status updates
- Document management
- Free vs Paid application limits

### 5. Subscription Management
- Subscription plans (Free, Asia $25, Europe $50, Global $100)
- Subscription activation and expiration
- Feature access control based on subscription
- 2-year validity tracking

### 6. Payment Processing
- **$myxn Token integration** (Cryptocurrency) from [myxenpay-dapp](https://github.com/bikkhoto/myxenpay-dapp)
- Credit card processing (Visa, Mastercard, American Express)
- Payment gateway integration (Stripe or similar)
- Payment webhook handling
- Transaction history

### 7. Scholarship Management
- Scholarship listings
- Auto scholarship matching algorithm (premium feature)
- Eligibility checking
- Application tracking

### 8. Course Management
- Free resources (e-books, templates)
- Paid courses (IELTS/TOEFL prep)
- Course enrollment
- Progress tracking

### 9. AI Chat Support
- Integration with AI chat service
- 24/7 availability
- Basic support for free users
- Premium support for paid users

### 10. Notification System
- Email notifications
- Newsletter system (Mailchimp/Sendinblue integration)
- Application status updates
- Deadline reminders

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
- Node.js 18+ or Python 3.10+
- PostgreSQL 14+ or MongoDB 6+
- Redis (for caching and sessions)

### Installation

#### Node.js
```bash
npm install
npm run dev
```

#### Python (Django)
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## API Documentation

See the `../API` folder for detailed API documentation and endpoints.

## Testing

```bash
# Node.js
npm test

# Python
python manage.py test
```

## Deployment

Recommended platforms:
- AWS (EC2, ECS, Lambda)
- DigitalOcean
- Heroku
- Railway
- Render

## Security Considerations

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Secure password hashing (bcrypt)
- HTTPS enforcement
- Secure session management
