#!/bin/bash

# Study Pro Global - Quick Deployment Script
# Run this script on your production server: server10.cloudswebserver.com

set -e

echo "======================================"
echo "Study Pro Global - Deployment Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Please do not run this script as root${NC}"
    exit 1
fi

# Configuration
PROJECT_NAME="studyproglobal"
BACKEND_DIR="/var/www/Study-Pro-Global-/Backend"
FRONTEND_DIR="/var/www/Study-Pro-Global-/Frontend"
WEB_DIR="/var/www/html/studyproglobal"

echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo -e "${GREEN}✓ Node.js version: $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm version: $(npm --version)${NC}"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 not found. Installing...${NC}"
    sudo npm install -g pm2
fi

echo -e "${GREEN}✓ PM2 installed${NC}"

echo -e "${YELLOW}Step 2: Setting up Backend...${NC}"

cd $BACKEND_DIR

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from .env.production...${NC}"
    cp .env.production .env
    echo -e "${YELLOW}⚠ IMPORTANT: Edit .env file and update all CONFIGURE_* placeholders${NC}"
    echo -e "${YELLOW}Press Enter to continue after editing .env...${NC}"
    read
fi

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

echo -e "${YELLOW}Step 3: Deploying Frontend...${NC}"

# Create web directory if it doesn't exist
sudo mkdir -p $WEB_DIR

# Copy frontend files
echo -e "${YELLOW}Copying frontend files...${NC}"
sudo cp -r $FRONTEND_DIR/* $WEB_DIR/
sudo chown -R www-data:www-data $WEB_DIR
echo -e "${GREEN}✓ Frontend deployed to $WEB_DIR${NC}"

echo -e "${YELLOW}Step 4: Starting Backend with PM2...${NC}"

cd $BACKEND_DIR

# Check if server.js exists
if [ ! -f "server.js" ]; then
    echo -e "${RED}server.js not found in $BACKEND_DIR${NC}"
    echo -e "${YELLOW}Please create server.js following Backend/README.md${NC}"
    exit 1
fi

# Stop existing instance if running
pm2 stop $PROJECT_NAME-api 2>/dev/null || true

# Start with PM2
pm2 start server.js --name "$PROJECT_NAME-api"
pm2 save

echo -e "${GREEN}✓ Backend started with PM2${NC}"

echo -e "${YELLOW}Step 5: Configuring PM2 Startup...${NC}"
pm2 startup

echo ""
echo -e "${GREEN}======================================"
echo -e "Deployment Complete!"
echo -e "======================================${NC}"
echo ""
echo "Frontend URL: https://www.studyproglobal.com.bd"
echo "Backend API: https://www.studyproglobal.com.bd/api"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure Nginx (see Backend/DEPLOYMENT.md Step 5)"
echo "2. Install SSL certificate with Certbot (see Backend/DEPLOYMENT.md Step 6)"
echo "3. Upload logo.jpg to Frontend/images/"
echo "4. Test all endpoints"
echo ""
echo "Useful commands:"
echo "  pm2 status                    - Check application status"
echo "  pm2 logs $PROJECT_NAME-api    - View logs"
echo "  pm2 restart $PROJECT_NAME-api - Restart application"
echo ""
echo -e "${GREEN}For detailed deployment guide, see Backend/DEPLOYMENT.md${NC}"
echo ""
