#!/bin/bash

# Lysaght Consultants - Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Lysaght Consultants - Production Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v)"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 is not installed. Installing PM2 globally..."
    npm install -g pm2
    print_status "PM2 installed successfully"
fi

# Create logs directory
mkdir -p logs
print_status "Created logs directory"

# Install dependencies
print_info "Installing dependencies..."
npm install
print_status "Dependencies installed"

# Build the application
print_info "Building application..."
npm run build
print_status "Application built successfully"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.production.template .env
    print_warning "Please update .env file with your actual Supabase keys"
fi

# Start/restart the application with PM2
print_info "Starting application with PM2..."

# Stop existing instance if running
pm2 stop lysaght-consultants 2>/dev/null || true
pm2 delete lysaght-consultants 2>/dev/null || true

# Start new instance
pm2 start ecosystem.config.cjs --env production
print_status "Application started with PM2"

# Save PM2 configuration
pm2 save
print_status "PM2 configuration saved"

# Set up PM2 startup script
pm2 startup
print_warning "Please run the command shown above to set up PM2 startup"

# Health check
print_info "Performing health check..."
sleep 5

if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_status "Health check passed - Application is running!"
else
    print_error "Health check failed - Application may not be running properly"
    exit 1
fi

# Display status
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
print_info "Application Status:"
pm2 status

echo ""
print_info "Useful commands:"
echo "  View logs:     pm2 logs lysaght-consultants"
echo "  Restart app:   pm2 restart lysaght-consultants"
echo "  Stop app:      pm2 stop lysaght-consultants"
echo "  Monitor:       pm2 monit"

echo ""
print_info "Application URLs:"
echo "  Main app:      http://localhost:3000"
echo "  Health check:  http://localhost:3000/health"
echo "  API status:    http://localhost:3000/api/status"

echo ""
print_warning "Next steps:"
echo "1. Update .env file with your Supabase credentials"
echo "2. Configure your web server (Apache/Nginx) to proxy to port 3000"
echo "3. Set up SSL certificate for HTTPS"
echo "4. Configure domain name"

echo ""
print_status "Deployment complete! 🚀"
