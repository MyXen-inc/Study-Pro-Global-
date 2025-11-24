# Production Deployment Checklist

Use this checklist to ensure successful deployment of the Study Pro Global Backend API.

## Pre-Deployment Checklist

### 1. Server Prerequisites ✓
- [ ] Node.js 16+ or 18+ installed
- [ ] MySQL 5.7+ or MariaDB 10.3+ installed and running
- [ ] PM2 process manager installed globally (`npm install -g pm2`)
- [ ] Git installed and configured
- [ ] SSH access to production server configured
- [ ] Firewall configured (ports 22, 80, 443 open)

### 2. Database Access ✓
- [ ] Database `myxenpay_studyproglobal` exists
- [ ] Database user `myxenpay_studyproglobal` has full privileges
- [ ] Database connection tested from server
  ```bash
  mysql -h server10.cloudswebserver.com -u myxenpay_studyproglobal -p
  ```

### 3. Domain & SSL ✓
- [ ] Domain `www.studyproglobal.com.bd` points to server
- [ ] DNS propagation complete
- [ ] SSL certificate installed (Let's Encrypt or cPanel AutoSSL)
- [ ] HTTPS working and enforced

### 4. Web Server Configuration ✓
- [ ] Nginx or Apache installed and running
- [ ] Reverse proxy configured for `/api/` → `localhost:3000`
- [ ] `.htaccess` or nginx config tested
- [ ] Static file serving configured
- [ ] Gzip compression enabled

## Deployment Steps

### Step 1: Clone/Pull Repository ✓
```bash
cd /home/myxenpay/
# If first time:
git clone https://github.com/MyXen-inc/Study-Pro-Global.git
cd Study-Pro-Global

# If updating:
cd Study-Pro-Global
git pull origin copilot/deploy-backend-api
```
- [ ] Repository cloned/updated successfully
- [ ] On correct branch (`copilot/deploy-backend-api`)

### Step 2: Backend Setup ✓
```bash
cd Backend
```
- [ ] Changed to Backend directory

### Step 3: Install Dependencies ✓
```bash
npm install --production
```
- [ ] All dependencies installed successfully
- [ ] No critical errors in installation
- [ ] Check for any warnings

### Step 4: Configure Environment ✓
```bash
cp .env.example .env
nano .env
```

Required configurations:
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `DB_HOST=server10.cloudswebserver.com`
- [ ] `DB_USER=myxenpay_studyproglobal`
- [ ] `DB_PASSWORD=Nazmuzsakib01715@@##` (or updated password)
- [ ] `DB_NAME=myxenpay_studyproglobal`
- [ ] `JWT_SECRET` (pre-filled, secure)
- [ ] `SESSION_SECRET` (pre-filled, secure)
- [ ] `CORS_ORIGIN=https://www.studyproglobal.com.bd`

Optional but recommended:
- [ ] `SMTP_USER` and `SMTP_PASSWORD` (for email notifications)
- [ ] `STRIPE_SECRET_KEY` (for credit card payments)
- [ ] `MYXN_TOKEN_CONTRACT_ADDRESS` (for crypto payments)
- [ ] `OPENAI_API_KEY` (for enhanced AI chat)
- [ ] `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (for file uploads)

```bash
chmod 600 .env
```
- [ ] Environment file configured
- [ ] File permissions set (600)

### Step 5: Test Backend Locally ✓
```bash
node server.js
```
Expected output:
```
✅ Database connected successfully
✅ Database tables initialized successfully

🚀 Study Pro Global API Server
📍 Running on port 3000
🌍 Environment: production
🔗 Base URL: http://localhost:3000/api/v1
✅ Server started successfully at ...
```
- [ ] Database connection successful
- [ ] Tables created automatically
- [ ] Server started without errors
- [ ] Press Ctrl+C to stop

### Step 6: Start with PM2 ✓
```bash
pm2 start server.js --name studyproglobal-api
pm2 save
pm2 startup
```
- [ ] PM2 process started successfully
- [ ] PM2 configuration saved
- [ ] PM2 startup configured (run the command shown)

### Step 7: Verify Backend Running ✓
```bash
pm2 status
pm2 logs studyproglobal-api --lines 50
```
- [ ] Status shows "online"
- [ ] No errors in logs
- [ ] CPU and memory usage normal

### Step 8: Test API Endpoints ✓
```bash
# Health check
curl http://localhost:3000/api/health

# From another machine (replace with your domain)
curl https://www.studyproglobal.com.bd/api/health
```
Expected response:
```json
{
  "success": true,
  "message": "Study Pro Global API is running",
  "timestamp": "...",
  "environment": "production"
}
```
- [ ] Health check returns 200 OK
- [ ] Response is valid JSON
- [ ] External access works (via domain)

### Step 9: Test Registration ✓
```bash
curl -X POST https://www.studyproglobal.com.bd/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "country": "Bangladesh"
  }'
```
- [ ] Registration successful (201 Created)
- [ ] Returns JWT token
- [ ] User created in database

### Step 10: Import Sample Data (Optional) ✓
```bash
./setup_database.sh
# Choose option 2
```
Or manually:
```bash
mysql -h server10.cloudswebserver.com \
  -u myxenpay_studyproglobal \
  -p'Nazmuzsakib01715@@##' \
  myxenpay_studyproglobal < sample_data.sql
```
- [ ] Sample data imported successfully
- [ ] Universities, programs, scholarships, courses available

## Post-Deployment Verification

### 1. API Functionality ✓
Test key endpoints:
- [ ] POST `/api/v1/auth/register` - User registration
- [ ] POST `/api/v1/auth/login` - User login
- [ ] GET `/api/v1/subscriptions/plans` - Get subscription plans
- [ ] GET `/api/v1/universities/search` - Search universities
- [ ] GET `/api/v1/scholarships` - Get scholarships
- [ ] GET `/api/v1/courses` - Get courses
- [ ] POST `/api/v1/chat/message` - AI chat (with auth)

See `API_TESTING.md` for complete testing guide.

### 2. Frontend Integration ✓
- [ ] Frontend can reach API
- [ ] CORS allows frontend domain
- [ ] API responses display correctly
- [ ] Authentication flow works
- [ ] User can register and login

### 3. Performance ✓
```bash
pm2 monit
```
- [ ] CPU usage < 50% under normal load
- [ ] Memory usage stable
- [ ] Response times < 500ms
- [ ] No memory leaks

### 4. Logs & Monitoring ✓
```bash
pm2 logs studyproglobal-api
```
- [ ] Logs show normal operation
- [ ] No errors or warnings
- [ ] Database queries executing
- [ ] API requests being processed

### 5. Security ✓
- [ ] HTTPS enforced (no HTTP access)
- [ ] API responds with security headers
- [ ] Rate limiting working (test with multiple requests)
- [ ] JWT tokens expiring correctly
- [ ] Invalid tokens rejected
- [ ] .env file not accessible via web

## Optional Enhancements

### Email Notifications ✓
- [ ] SMTP credentials configured in .env
- [ ] Test email sending
- [ ] Welcome email on registration
- [ ] Password reset emails

### Payment Gateways ✓
- [ ] Stripe account created
- [ ] Stripe keys in .env
- [ ] Webhook endpoint configured
- [ ] Test payment flow

- [ ] $myxn token contract address in .env
- [ ] Test crypto payment flow

### AI Chat Enhancement ✓
- [ ] OpenAI API key in .env
- [ ] Test enhanced AI responses
- [ ] Monitor API usage

### File Uploads ✓
- [ ] AWS S3 bucket created
- [ ] AWS credentials in .env
- [ ] Test document upload
- [ ] File size limits configured

### Monitoring & Alerts ✓
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Error tracking (Sentry, Rollbar)
- [ ] Performance monitoring (New Relic, DataDog)
- [ ] Log aggregation (Papertrail, Loggly)

### Backups ✓
```bash
# Create backup script
nano /home/myxenpay/backup_db.sh
```
- [ ] Daily database backups scheduled
- [ ] Backup script tested
- [ ] Backups stored securely
- [ ] Restore process tested

### Documentation ✓
- [ ] API documentation accessible
- [ ] Deployment guide shared with team
- [ ] Credentials stored securely
- [ ] Contact information updated

## Troubleshooting

### Backend not starting
```bash
pm2 logs studyproglobal-api --err
node server.js  # Run directly to see errors
```

### Database connection failed
```bash
# Test connection
mysql -h server10.cloudswebserver.com -u myxenpay_studyproglobal -p

# Check credentials in .env
cat .env | grep DB_
```

### Port 3000 already in use
```bash
# Check what's using port 3000
sudo netstat -tlnp | grep 3000

# Kill process if needed
sudo kill -9 <PID>
```

### API not accessible via domain
- Check nginx/apache configuration
- Test reverse proxy: `curl http://localhost:3000/api/health`
- Check firewall rules
- Verify SSL certificate

### High CPU/Memory usage
```bash
pm2 monit
pm2 restart studyproglobal-api
```

## Rollback Plan

If issues occur after deployment:

1. **Stop the API**
   ```bash
   pm2 stop studyproglobal-api
   ```

2. **Revert to previous version**
   ```bash
   git checkout <previous-commit>
   npm install --production
   ```

3. **Restart API**
   ```bash
   pm2 restart studyproglobal-api
   ```

4. **Restore database** (if needed)
   ```bash
   mysql ... < backup_YYYYMMDD.sql
   ```

## Success Criteria

✅ Deployment is successful when:
- [ ] All checklist items completed
- [ ] API health check returns 200 OK
- [ ] Users can register and login
- [ ] University search works
- [ ] No errors in logs
- [ ] Frontend can communicate with API
- [ ] Performance is acceptable
- [ ] Security measures active

## Support

**Deployment Issues**: admin@studyproglobal.com.bd  
**API Documentation**: See `API_TESTING.md`  
**Security Issues**: See `SECURITY_SUMMARY.md`  
**Setup Guide**: See `PRODUCTION_SETUP.md`

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Verified By**: _______________  
**Status**: ⬜ Pending / ⬜ In Progress / ⬜ Complete / ⬜ Issues

**Notes**:
_________________________________________
_________________________________________
_________________________________________
