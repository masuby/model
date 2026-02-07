#!/bin/bash
# INFORM Tanzania - Deployment Script
# Run this on your production server to deploy the latest changes

set -e

echo "========================================"
echo "  INFORM Tanzania - Deployment Script  "
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "\n${YELLOW}Step 1: Pulling latest changes from GitHub...${NC}"
git pull origin main

echo -e "\n${YELLOW}Step 2: Installing dependencies...${NC}"
npm install

echo -e "\n${YELLOW}Step 3: Building the application...${NC}"
npm run build

echo -e "\n${YELLOW}Step 4: Checking build output...${NC}"
if [ -d "dist" ]; then
    echo -e "${GREEN}Build successful! Files in dist/:${NC}"
    ls -la dist/
else
    echo -e "${RED}Build failed - dist directory not found${NC}"
    exit 1
fi

# Check if running with PM2
if command -v pm2 &> /dev/null; then
    echo -e "\n${YELLOW}Step 5: Restarting PM2 process...${NC}"
    pm2 restart all || pm2 start npm --name "inform" -- run preview
    pm2 save
    echo -e "${GREEN}PM2 process restarted${NC}"
fi

# Check if running with systemd
if systemctl is-active --quiet inform 2>/dev/null; then
    echo -e "\n${YELLOW}Step 5: Restarting systemd service...${NC}"
    sudo systemctl restart inform
    echo -e "${GREEN}Systemd service restarted${NC}"
fi

echo -e "\n${GREEN}========================================"
echo -e "  Deployment Complete!                  "
echo -e "========================================${NC}"
echo -e "\nThe application should now be updated at inform.co.tz"
echo -e "If using nginx, make sure it's pointing to the dist/ folder"
