# Backend API Production Setup Guide

## Quick Start

The Backend API is now **ready for production deployment** to `www.studyproglobal.com.bd`.

### What's Included

✅ **Complete Backend Implementation**
- Express.js server with security middleware
- MySQL database integration
- JWT authentication system
- All API endpoints implemented:
  - Authentication (register, login, logout)
  - User profile management
  - University search & details
  - Application submission & tracking
  - Subscription plans & management
  - Payment processing (Stripe & $myxn token)
  - Scholarship listings & auto-matching
  - Course management
  - AI chat support

✅ **Security Features**
- Helmet for HTTP headers security
- CORS configuration
- Rate limiting
- JWT token authentication
- Password hashing with bcrypt
- Input validation
- SQL injection prevention

✅ **Database Schema**
- Automatic table creation on first run
- All required tables configured:
  - users, universities, programs
  - applications, documents
  - subscriptions, payments
  - scholarships, courses
  - chat_conversations, chat_messages

## Deployment Steps

### 1. Server Prerequisites

The server must have:
- Node.js 16+ or 18+
- MySQL 5.7+ or MariaDB 10.3+
- PM2 process manager (for production)

### 2. Automatic Deployment (Recommended)

Since `.cpanel.yml` is configured, deployment is automatic:

```bash
# Just push to GitHub
git push origin copilot/deploy-backend-api

# cPanel will automatically:
# 1. Pull latest code
# 2. Deploy Backend to /home/myxenpay/studypro-backend/
# 3. Set permissions
```

### 3. Initial Server Setup

SSH into your server and run:

```bash
cd /home/myxenpay/studypro-backend/

# Copy environment file
cp .env.example .env

# Install dependencies
npm install --production

# Start with PM2
pm2 start server.js --name studyproglobal-api
pm2 save
pm2 startup
```

### 4. Environment Configuration

The `.env.example` file is pre-configured with:
- ✅ Database credentials (from SERVER_CREDENTIALS.md)
- ✅ Secure JWT and Session secrets (auto-generated)
- ✅ Production URLs

**Additional Configuration Needed:**

Edit `/home/myxenpay/studypro-backend/.env` and add:

```env
# Email Configuration
SMTP_USER=noreply@studyproglobal.com.bd
SMTP_PASSWORD=your_email_app_password

# Stripe Payment Keys
STRIPE_PUBLIC_KEY=pk_live_your_key
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_key

# $myxn Token Configuration
MYXN_TOKEN_CONTRACT_ADDRESS=your_contract_address
MYXN_PAYMENT_WALLET_ADDRESS=your_wallet_address
MYXN_RPC_URL=your_rpc_endpoint

# OpenAI for AI Chat (Optional)
OPENAI_API_KEY=sk-your_openai_api_key

# AWS S3 for File Uploads (Optional)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=studyproglobal-uploads
```

### 5. Database Setup

The database tables will be created automatically on first run. The backend will:
1. Connect to MySQL database: `myxenpay_studyproglobal`
2. Create all required tables if they don't exist
3. Set up proper indexes and foreign keys

No manual SQL scripts needed!

### 6. Nginx/Apache Configuration

Update your web server to proxy API requests:

**For Apache (.htaccess already configured in CPANEL_DEPLOYMENT.md)**

**For Nginx:**
```nginx
location /api/ {
    proxy_pass http://localhost:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 7. Verification

Test the API endpoints:

```bash
# Health check
curl https://www.studyproglobal.com.bd/api/health

# Test registration
curl -X POST https://www.studyproglobal.com.bd/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "country": "USA",
    "academicLevel": "bachelor"
  }'

# Test university search
curl https://www.studyproglobal.com.bd/api/v1/universities/search?country=USA&limit=5

# Test subscription plans
curl https://www.studyproglobal.com.bd/api/v1/subscriptions/plans
```

## API Endpoints

### Base URL
- Production: `https://www.studyproglobal.com.bd/api/v1`

### Available Endpoints

**Authentication**
- POST `/api/v1/auth/register` - User registration
- POST `/api/v1/auth/login` - User login
- POST `/api/v1/auth/logout` - User logout
- GET `/api/v1/auth/me` - Get current user

**Users**
- GET `/api/v1/users/profile` - Get user profile
- PUT `/api/v1/users/profile` - Update user profile
- POST `/api/v1/users/documents` - Upload document
- GET `/api/v1/users/documents` - Get user documents

**Universities**
- GET `/api/v1/universities/search` - Search universities
- GET `/api/v1/universities/:id` - Get university details
- GET `/api/v1/universities/filters/countries` - Get all countries

**Applications**
- POST `/api/v1/applications` - Submit application
- GET `/api/v1/applications` - Get user applications
- GET `/api/v1/applications/:id` - Get application details

**Subscriptions**
- GET `/api/v1/subscriptions/plans` - Get available plans
- POST `/api/v1/subscriptions` - Create subscription
- GET `/api/v1/subscriptions/my-subscriptions` - Get user subscriptions

**Payments**
- POST `/api/v1/payments/create` - Create payment
- POST `/api/v1/payments/verify` - Verify payment
- GET `/api/v1/payments/history` - Get payment history

**Scholarships**
- GET `/api/v1/scholarships` - Get scholarships
- GET `/api/v1/scholarships/:id` - Get scholarship details
- POST `/api/v1/scholarships/auto-match` - Auto-match scholarships (Premium)

**Courses**
- GET `/api/v1/courses` - Get courses
- GET `/api/v1/courses/:id` - Get course details
- POST `/api/v1/courses/:id/enroll` - Enroll in course

**AI Chat**
- POST `/api/v1/chat/message` - Send chat message
- GET `/api/v1/chat/conversations/:id` - Get conversation history
- GET `/api/v1/chat/conversations` - Get all conversations

## Monitoring & Maintenance

### Check API Status
```bash
pm2 status
pm2 logs studyproglobal-api
```

### Restart API
```bash
pm2 restart studyproglobal-api
```

### View Logs
```bash
pm2 logs studyproglobal-api --lines 100
```

### Database Backup
```bash
# Use environment variables from your .env file
mysqldump -h $DB_HOST \
  -u $DB_USER \
  -p$DB_PASSWORD \
  $DB_NAME > backup_$(date +%Y%m%d).sql
```

## Security Checklist

- [x] Secure JWT secrets generated
- [x] Database credentials secured in .env
- [x] CORS configured for production domain
- [x] Rate limiting enabled
- [x] Helmet security headers enabled
- [x] Password hashing with bcrypt
- [x] Input validation on all endpoints
- [x] SQL injection prevention with parameterized queries
- [ ] SSL/HTTPS enabled (configure via cPanel)
- [ ] Regular security updates scheduled

## Troubleshooting

### API not starting
```bash
# Check logs
pm2 logs studyproglobal-api

# Check port availability
netstat -tlnp | grep 3000

# Check environment file
cat /home/myxenpay/studypro-backend/.env
```

### Database connection error
```bash
# Test database connection (use your credentials from .env)
mysql -h $DB_HOST \
  -u $DB_USER \
  -p$DB_PASSWORD \
  -e "SELECT VERSION(); SHOW DATABASES;"
```

### Cannot access API
1. Check if PM2 process is running: `pm2 status`
2. Check Nginx/Apache proxy configuration
3. Verify firewall allows port 3000
4. Check SSL certificate is valid

## Next Steps After Deployment

1. **Add Sample Data**
   - Add universities to database
   - Add scholarship opportunities
   - Add course offerings

2. **Configure Payment Gateways**
   - Set up Stripe account
   - Configure $myxn token integration
   - Test payment webhooks

3. **Set up Email Service**
   - Configure SMTP credentials
   - Test registration emails
   - Set up notification emails

4. **Enable AI Chat** (Optional)
   - Get OpenAI API key
   - Configure in .env
   - Test chat responses

5. **Monitoring**
   - Set up uptime monitoring
   - Configure error alerts
   - Enable performance monitoring

6. **Future Integrations** (Optional Enhancements)
   - **MSM Unify**: Consider integrating with [MSM Unify services](https://www.msmunify.com/service/) for enhanced university services and [institutional features](https://www.msmunify.com/for-institutions/)
   - Add MSM Unify API configuration in `.env` (MSMUNIFY_API_KEY, MSMUNIFY_ENABLED)
   - Explore their API for additional student services and university connections

## Support

For deployment issues:
- Check logs: `pm2 logs studyproglobal-api`
- Review Backend/DEPLOYMENT.md for detailed setup
- Contact: admin@studyproglobal.com.bd

---

**Study Pro Global Backend API v1.0.0**  
MyXen Foundation - EdTech Platform for Global University Enrollment
