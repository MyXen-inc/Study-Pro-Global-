#!/bin/bash
# Deployment script for Study Pro Global Backend

echo "🚀 Starting deployment..."

# Navigate to backend directory
cd /home/myxenpay/studypro-backend

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --production

# Run database migrations/initialization
node -e "require('./config/database').initializeDatabase().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })"

# Restart with PM2
pm2 restart studyproglobal-api || pm2 start ecosystem.config.js --env production

echo "✅ Deployment complete!"
