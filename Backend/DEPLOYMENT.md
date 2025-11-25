# Study Pro Global - Production Deployment Guide

## Server Information

**Domain**: www.studyproglobal.com.bd  

**Note**: All server credentials should be stored securely in `.env` files and never committed to version control.

---

## Prerequisites

Before deploying, ensure you have:

1. **Node.js** (v16+ or v18+) installed on the server
2. **MySQL/MariaDB** database access (credentials in secure `.env` file)
3. **PM2** or similar process manager for Node.js
4. **Nginx** or Apache configured as reverse proxy
5. **SSL Certificate** for HTTPS (Let's Encrypt recommended)
6. **Git** for code deployment

---

## Step 1: Server Setup

### 1.1 Connect to Server

```bash
ssh username@server10.cloudswebserver.com
```

### 1.2 Install Node.js (if not installed)

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 1.3 Install PM2 Process Manager

```bash
sudo npm install -g pm2
```

### 1.4 Install MySQL Client (if needed)

```bash
sudo apt-get install mysql-client
```

---

## Step 2: Clone Repository

```bash
# Navigate to web directory
cd /var/www/

# Clone the repository
git clone https://github.com/MyXen-inc/Study-Pro-Global-.git
cd Study-Pro-Global-

# Checkout the production branch
git checkout copilot/create-student-study-abroad-website
```

---

## Step 3: Backend Setup

### 3.1 Navigate to Backend Directory

```bash
cd Backend
```

### 3.2 Install Dependencies

```bash
npm init -y
npm install express cors dotenv mysql2 sequelize bcryptjs jsonwebtoken
npm install express-session express-rate-limit helmet compression
npm install multer aws-sdk stripe
npm install openai
npm install --save-dev nodemon
```

### 3.3 Configure Environment Variables

```bash
# Copy the production environment file
cp .env.production .env

# Edit the .env file and update the following:
nano .env
```

**Update these critical values:**

```env
# JWT & Session Secrets (Generate random 32+ character strings)
JWT_SECRET=<generate_random_string>
SESSION_SECRET=<generate_random_string>

# Email Configuration
SMTP_USER=noreply@studyproglobal.com.bd
SMTP_PASSWORD=<your_email_app_password>

# Stripe Payment (Get from Stripe Dashboard)
STRIPE_PUBLIC_KEY=pk_live_<your_key>
STRIPE_SECRET_KEY=sk_live_<your_key>
STRIPE_WEBHOOK_SECRET=whsec_<your_key>

# $myxn Token Configuration (Get from myxenpay-dapp repo)
MYXN_TOKEN_CONTRACT_ADDRESS=<contract_address>
MYXN_PAYMENT_WALLET_ADDRESS=<wallet_address>
MYXN_RPC_URL=<rpc_endpoint>

# OpenAI for AI Chat Support
OPENAI_API_KEY=<your_openai_api_key>

# Admin Password (CHANGE IMMEDIATELY)
ADMIN_PASSWORD=<strong_secure_password>

# AWS S3 for File Uploads
AWS_ACCESS_KEY_ID=<your_aws_key>
AWS_SECRET_ACCESS_KEY=<your_aws_secret>
```

### 3.4 Database Setup

```bash
# Connect to MySQL database (use your credentials from .env)
mysql -h $DB_HOST -u $DB_USER -p $DB_NAME

# Run database migrations (create tables)
# This should be done through your backend application
# See Backend/README.md for schema details
```

### 3.5 Create Server File

Create `Backend/server.js` following the implementation guide in `Backend/README.md`

### 3.6 Test Backend

```bash
# Test locally first
npm run dev

# Or start with node
node server.js
```

---

## Step 4: Frontend Deployment

### 4.1 Configure Domain

Edit `Frontend/index.html` to update API endpoint:

```javascript
// Update API base URL in Frontend/js/script.js
const API_BASE_URL = 'https://www.studyproglobal.com.bd/api';
```

### 4.2 Copy Frontend Files

```bash
# Copy frontend files to web directory
sudo cp -r Frontend/* /var/www/html/studyproglobal/

# Or if using subdomain
sudo cp -r Frontend/* /var/www/studyproglobal.com.bd/
```

---

## Step 5: Nginx Configuration

### 5.1 Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/studyproglobal
```

```nginx
server {
    listen 80;
    server_name www.studyproglobal.com.bd studyproglobal.com.bd;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.studyproglobal.com.bd studyproglobal.com.bd;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/www.studyproglobal.com.bd/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.studyproglobal.com.bd/privkey.pem;
    
    # Frontend - Static Files
    root /var/www/html/studyproglobal;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API Proxy
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### 5.2 Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/studyproglobal /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 6: SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d www.studyproglobal.com.bd -d studyproglobal.com.bd

# Auto-renewal (certbot creates cron job automatically)
sudo certbot renew --dry-run
```

---

## Step 7: Start Backend with PM2

```bash
cd /var/www/Study-Pro-Global-/Backend

# Start application with PM2
pm2 start server.js --name "studyproglobal-api"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
```

### PM2 Useful Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs studyproglobal-api

# Restart
pm2 restart studyproglobal-api

# Stop
pm2 stop studyproglobal-api

# Monitor
pm2 monit
```

---

## Step 8: Database Initial Setup

### 8.1 Create Database Tables

Run the SQL schema from `Backend/README.md` or use Sequelize migrations:

```bash
# If using Sequelize ORM
cd Backend
npx sequelize-cli db:migrate
```

### 8.2 Create Admin User

```bash
# Use the admin registration endpoint or run SQL:
# INSERT INTO users (email, password, role) VALUES 
# ('admin@studyproglobal.com.bd', '$2a$12$hash', 'admin');
```

---

## Step 9: Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Generate secure JWT_SECRET and SESSION_SECRET
- [ ] Enable firewall (UFW) and allow only ports 22, 80, 443
- [ ] Configure database user with minimum required privileges
- [ ] Set up regular database backups
- [ ] Configure fail2ban for SSH protection
- [ ] Set proper file permissions (755 for directories, 644 for files)
- [ ] Enable rate limiting in the backend
- [ ] Configure CORS to allow only your domain
- [ ] Set up monitoring (e.g., PM2 monitoring, UptimeRobot)

---

## Step 10: Post-Deployment Testing

### 10.1 Test Frontend

Visit: https://www.studyproglobal.com.bd

- [ ] Homepage loads correctly
- [ ] Logo displays (upload logo.jpg to Frontend/images/)
- [ ] Navigation works
- [ ] Footer shows MyXen Foundation attribution
- [ ] Forms validate properly
- [ ] Responsive on mobile

### 10.2 Test Backend API

```bash
# Health check
curl https://www.studyproglobal.com.bd/api/health

# Test registration endpoint
curl -X POST https://www.studyproglobal.com.bd/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!"}'
```

### 10.3 Test Payment Integration

- [ ] Stripe payment test mode
- [ ] $myxn token connection
- [ ] Webhook endpoints configured

---

## Step 11: Monitoring & Maintenance

### 11.1 Set Up Monitoring

```bash
# PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 11.2 Database Backups

```bash
# Create backup script
nano /home/backup-db.sh
```

```bash
#!/bin/bash
# Load environment variables
source /home/myxenpay/studypro-backend/.env

DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -h $DB_HOST \
  -u $DB_USER \
  -p$DB_PASSWORD \
  $DB_NAME > /backups/db_$DATE.sql
  
# Keep only last 7 days
find /backups/ -name "db_*.sql" -mtime +7 -delete
```

```bash
# Make executable
chmod +x /home/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/backup-db.sh
```

---

## Step 12: Update & Deployment

### 12.1 Pull Latest Changes

```bash
cd /var/www/Study-Pro-Global-
git pull origin copilot/create-student-study-abroad-website

# Update frontend
sudo cp -r Frontend/* /var/www/html/studyproglobal/

# Update backend dependencies
cd Backend
npm install

# Restart API
pm2 restart studyproglobal-api
```

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
pm2 logs studyproglobal-api

# Check if port 3000 is in use
sudo netstat -tlnp | grep 3000

# Check environment variables
cat Backend/.env
```

### Database connection issues
```bash
# Test database connection
mysql -h server10.cloudswebserver.com -u myxenpay_studyproglobal -p

# Check if database user has correct permissions
SHOW GRANTS FOR 'myxenpay_studyproglobal'@'%';
```

### SSL certificate issues
```bash
# Check certificate
sudo certbot certificates

# Renew if needed
sudo certbot renew
```

---

## Support

For deployment support:
- Email: admin@studyproglobal.com.bd
- Check Backend/README.md for detailed API implementation
- Check API/README.md for complete endpoint documentation

---

## Production Checklist

- [ ] Server credentials verified
- [ ] Domain DNS configured
- [ ] SSL certificate installed
- [ ] Backend environment variables configured
- [ ] Database tables created
- [ ] Frontend deployed
- [ ] Backend API running with PM2
- [ ] Nginx configured and running
- [ ] Payment gateways configured
- [ ] Admin user created
- [ ] Security hardening completed
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Logo uploaded
- [ ] All endpoints tested
- [ ] Mobile responsive verified

---

**MyXen Foundation**  
Study Pro Global - EdTech Platform for Global University Enrollment
