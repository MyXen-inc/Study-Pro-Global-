# cPanel Deployment Guide for Study Pro Global

This guide explains how to deploy Study Pro Global EdTech platform using cPanel's Git Version Control integration.

## Prerequisites

- cPanel account with Git Version Control feature enabled
- Access to www.studyproglobal.com.bd domain
- MySQL database: `myxenpay_studyproglobal`
- Server: server10.cloudswebserver.com

## Deployment Method

This repository includes a `.cpanel.yml` file that automates deployment when you push to GitHub. cPanel will automatically:

1. Pull the latest code from GitHub
2. Deploy Frontend to `studyproglobal.com.bd/`
3. Deploy Backend to `studypro-backend/` (outside public directory for security)
4. Set proper file permissions
5. Create necessary directories

## Setup Instructions

### Step 1: Connect Repository to cPanel

1. Log into cPanel at: https://server10.cloudswebserver.com:2083
2. Navigate to **Git Version Control** (under Files section)
3. Click **Create** to add a new repository
4. Fill in the details:
   - **Clone URL**: `https://github.com/MyXen-inc/Study-Pro-Global-.git`
   - **Repository Path**: `/home/myxenpay/repository`
   - **Repository Name**: `Study-Pro-Global`
   - **Branch**: `copilot/create-student-study-abroad-website` (or your main branch)
5. Click **Create**

### Step 2: Configure Deployment

The `.cpanel.yml` file is already configured and will automatically:

- Deploy Frontend files to `/home/myxenpay/studyproglobal.com.bd/`
- Deploy Backend files to `/home/myxenpay/studypro-backend/`
- Set appropriate permissions
- Create necessary directories

### Step 3: Set Up Database Connection

1. In cPanel, go to **MySQL Databases**
2. Verify database exists: `myxenpay_studyproglobal`
3. Verify user has privileges: `myxenpay_studyproglobal`
4. If needed, add user to database with ALL PRIVILEGES

### Step 4: Configure Environment Variables

1. SSH into your server or use cPanel File Manager
2. Navigate to `/home/myxenpay/studypro-backend/`
3. Create `.env.production` file from the template:

```bash
cd /home/myxenpay/studypro-backend/
cp .env.example .env.production
nano .env.production
```

4. Update with your actual values:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
API_URL=https://www.studyproglobal.com.bd/api

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=myxenpay_studyproglobal
DB_USER=myxenpay_studyproglobal
DB_PASSWORD=Nazmuzsakib01715@@##

# Generate secure secrets for production:
JWT_SECRET=your_secure_jwt_secret_here_minimum_32_characters
SESSION_SECRET=your_secure_session_secret_here_minimum_32_characters

# Payment Gateway (Add your keys)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# $myxn Token Integration
MYXN_TOKEN_CONTRACT=your_contract_address
MYXN_RPC_URL=your_blockchain_rpc_url
```

5. Secure the file:

```bash
chmod 600 .env.production
```

### Step 5: Set Up Node.js Application (if using Node.js backend)

1. In cPanel, go to **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **Node.js version**: 18.x (or latest LTS)
   - **Application mode**: Production
   - **Application root**: `studypro-backend`
   - **Application URL**: https://www.studyproglobal.com.bd/api
   - **Application startup file**: `server.js` (or your entry point)
4. Click **Create**

### Step 6: Install Backend Dependencies

1. In the Node.js App interface, click **Run NPM Install**
2. Or via SSH:

```bash
cd /home/myxenpay/studypro-backend/
npm install --production
```

### Step 7: Configure Domain

1. In cPanel, go to **Domains**
2. Ensure `www.studyproglobal.com.bd` points to `/home/myxenpay/studyproglobal.com.bd/`
3. Enable HTTPS/SSL:
   - Go to **SSL/TLS Status**
   - Run AutoSSL for your domain
   - Or install Let's Encrypt certificate

### Step 8: Set Up .htaccess for Frontend Routing

Create `/home/myxenpay/studyproglobal.com.bd/.htaccess`:

```apache
# Enable rewrite engine
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API proxy to backend
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]

# Frontend routing (for single-page app)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### Step 9: Upload Logo

1. Upload `logo.jpg` to `/home/myxenpay/studyproglobal.com.bd/images/`
2. Set permissions:

```bash
chmod 644 /home/myxenpay/studyproglobal.com.bd/images/logo.jpg
```

## Automatic Deployment Workflow

Once configured, every time you push to GitHub:

1. **Commit your changes locally:**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

2. **Push to GitHub:**
   ```bash
   git push origin your-branch-name
   ```

3. **cPanel automatically:**
   - Detects the push
   - Pulls the latest code
   - Runs `.cpanel.yml` deployment tasks
   - Deploys Frontend to studyproglobal.com.bd
   - Deploys Backend to studypro-backend
   - Updates permissions

4. **Visit your site:**
   - Frontend: https://www.studyproglobal.com.bd
   - API: https://www.studyproglobal.com.bd/api

## Manual Deployment (if needed)

If automatic deployment doesn't work, you can manually pull updates:

1. Log into cPanel
2. Go to **Git Version Control**
3. Find your repository
4. Click **Manage**
5. Click **Pull or Deploy** > **Update from Remote**
6. Click **Deploy HEAD Commit**

## Troubleshooting

### Issue: Changes not appearing

1. Clear browser cache (Ctrl+Shift+R)
2. Check Git Version Control for deployment status
3. Verify file permissions in File Manager
4. Check error logs: `/home/myxenpay/logs/`

### Issue: 500 Internal Server Error

1. Check `.htaccess` syntax
2. Verify file permissions (644 for files, 755 for directories)
3. Check cPanel Error Log in Metrics section
4. Verify database connection in `.env.production`

### Issue: Backend API not responding

1. Check Node.js application status in cPanel
2. Restart the application
3. Check application logs
4. Verify port 3000 is not blocked
5. Check `.env.production` configuration

### Issue: SSL not working

1. Run AutoSSL in cPanel
2. Or use Let's Encrypt via SSL/TLS section
3. Force HTTPS in .htaccess (already included above)

## Directory Structure After Deployment

```
/home/myxenpay/
├── studyproglobal.com.bd/          # Frontend (accessible via web)
│   ├── index.html
│   ├── css/
│   ├── js/
│   ├── images/
│   │   └── logo.jpg               # Upload your logo here
│   └── .htaccess
├── studypro-backend/               # Backend (secure, outside public directory)
│   ├── .env.production            # Your configuration (create this)
│   ├── server.js
│   ├── package.json
│   └── node_modules/
├── repository/                     # Git repository clone
└── logs/                          # Application logs
```

## Post-Deployment Checklist

- [ ] Frontend accessible at www.studyproglobal.com.bd
- [ ] HTTPS/SSL enabled and working
- [ ] Logo uploaded and displaying
- [ ] Backend API responding
- [ ] Database connection working
- [ ] Payment gateways configured (Stripe, $myxn token)
- [ ] Email notifications configured
- [ ] Automatic backups enabled
- [ ] Monitoring set up
- [ ] Test registration flow
- [ ] Test payment flow

## Security Best Practices

1. **Never commit** `.env.production` to Git (already in .gitignore)
2. **Use strong passwords** for database and JWT secrets
3. **Enable ModSecurity** in cPanel if available
4. **Regular backups**: Use cPanel Backup Wizard
5. **Monitor logs**: Check regularly for suspicious activity
6. **Update dependencies**: Run `npm audit fix` periodically
7. **Keep Node.js updated**: Update via cPanel Node.js app interface

## Support

For deployment issues:
- Check cPanel error logs
- Review Git Version Control deployment logs
- Contact your hosting provider's support
- Review Backend/DEPLOYMENT.md for detailed server setup

## Additional Resources

- cPanel Documentation: https://docs.cpanel.net/
- Backend Implementation Guide: See `Backend/README.md`
- API Documentation: See `API/README.md`
- Server Credentials: See `Backend/SERVER_CREDENTIALS.md`
- Detailed Deployment: See `Backend/DEPLOYMENT.md`
