#!/bin/bash
# PM2 Startup Script for Lysaght Consultants

# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup

echo "Lysaght Consultants started with PM2"
echo "Use 'pm2 status' to check application status"
echo "Use 'pm2 logs lysaght-consultants' to view logs"