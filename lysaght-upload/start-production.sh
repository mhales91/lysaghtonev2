#!/bin/bash
echo "🚀 Starting Lysaght Consultants Production Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Set up environment
if [ ! -f .env.production ]; then
    echo "⚙️  Setting up environment..."
    cp .env.production.template .env.production
    echo "📝 Please edit .env.production with your Supabase credentials"
fi

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.cjs --env production
pm2 save

echo "✅ Application started successfully!"
echo "🌐 Access your application at: http://localhost:3000"
echo "📊 Check status with: pm2 status"
echo "📋 View logs with: pm2 logs lysaght-consultants"
