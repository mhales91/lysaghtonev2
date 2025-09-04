#!/bin/bash

# Lysaght Consultants - Update Script
# This script handles application updates without downtime

set -e  # Exit on any error

echo "🔄 Lysaght Consultants - Application Update"
echo "=========================================="

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

# Check if PM2 is running
if ! pm2 list | grep -q "lysaght-consultants"; then
    print_error "Application is not running with PM2. Please run deploy.sh first."
    exit 1
fi

# Backup current build
print_info "Creating backup of current build..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r dist "$BACKUP_DIR/"
print_status "Backup created: $BACKUP_DIR"

# Pull latest changes (if using git)
if [ -d ".git" ]; then
    print_info "Pulling latest changes from git..."
    git pull
    print_status "Latest changes pulled"
fi

# Install/update dependencies
print_info "Installing/updating dependencies..."
npm install
print_status "Dependencies updated"

# Build the application
print_info "Building application..."
npm run build
print_status "Application built successfully"

# Reload the application with PM2 (zero-downtime)
print_info "Reloading application with PM2..."
pm2 reload lysaght-consultants
print_status "Application reloaded successfully"

# Health check
print_info "Performing health check..."
sleep 3

if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_status "Health check passed - Update successful!"
else
    print_error "Health check failed - Rolling back..."
    
    # Rollback
    print_info "Rolling back to previous version..."
    rm -rf dist
    mv "$BACKUP_DIR/dist" ./
    pm2 reload lysaght-consultants
    print_warning "Rolled back to previous version"
    exit 1
fi

# Clean up old backups (keep last 5)
print_info "Cleaning up old backups..."
ls -t backup-* | tail -n +6 | xargs -r rm -rf
print_status "Old backups cleaned up"

# Display status
echo ""
echo "🎉 Update completed successfully!"
echo ""
print_info "Application Status:"
pm2 status

echo ""
print_info "Update Summary:"
echo "  - New build created and deployed"
echo "  - Zero-downtime reload completed"
echo "  - Health check passed"
echo "  - Previous version backed up to: $BACKUP_DIR"

echo ""
print_status "Update complete! 🚀"
