// Production Setup Script for Lysaght Consultants
import fs from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Lysaght Consultants - Production Setup');
console.log('=========================================\n');

// Create production environment file
const envContent = `# Production Environment Variables for Lysaght Consultants
# Update these values with your actual Supabase credentials

# Supabase Configuration
VITE_SUPABASE_URL=http://134.199.146.249:8000
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Configuration
NODE_ENV=production
PORT=3000

# PM2 Configuration
PM2_HOME=/home/user/.pm2`;

fs.writeFileSync('.env.production', envContent);
console.log('✅ Created .env.production file');

// Create logs directory
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
    console.log('✅ Created logs directory');
}

// Create backup directory
if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups');
    console.log('✅ Created backups directory');
}

// Make shell scripts executable (Unix/Linux)
try {
    execSync('chmod +x deploy.sh update.sh', { stdio: 'ignore' });
    console.log('✅ Made shell scripts executable');
} catch (error) {
    console.log('⚠️  Could not make shell scripts executable (Windows)');
}

// Create PM2 startup script
const pm2StartupScript = `#!/bin/bash
# PM2 Startup Script for Lysaght Consultants

# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup

echo "Lysaght Consultants started with PM2"
echo "Use 'pm2 status' to check application status"
echo "Use 'pm2 logs lysaght-consultants' to view logs"`;

fs.writeFileSync('start-production.sh', pm2StartupScript);
console.log('✅ Created start-production.sh script');

// Create production README
const productionReadme = `# Lysaght Consultants - Production Deployment

## 🚀 Quick Start

1. **Set up environment variables:**
   \`\`\`bash
   # Edit .env.production with your Supabase credentials
   nano .env.production
   \`\`\`

2. **Deploy the application:**
   \`\`\`bash
   # For Unix/Linux
   ./deploy.sh
   
   # For Windows
   npm run setup
   \`\`\`

3. **Check application status:**
   \`\`\`bash
   pm2 status
   pm2 logs lysaght-consultants
   \`\`\`

## 🔄 Updates

To update the application:
\`\`\`bash
# For Unix/Linux
./update.sh

# For Windows
npm run deploy
\`\`\`

## 📊 Monitoring

- **Health Check:** http://localhost:3000/health
- **API Status:** http://localhost:3000/api/status
- **Main App:** http://localhost:3000

## 🛠️ Management Commands

\`\`\`bash
# Start application
pm2 start lysaght-consultants

# Stop application
pm2 stop lysaght-consultants

# Restart application
pm2 restart lysaght-consultants

# Reload application (zero-downtime)
pm2 reload lysaght-consultants

# View logs
pm2 logs lysaght-consultants

# Monitor resources
pm2 monit

# Save PM2 configuration
pm2 save

# Delete application
pm2 delete lysaght-consultants
\`\`\`

## 🔧 Configuration

- **Port:** 3000 (configurable via PORT environment variable)
- **Process Manager:** PM2
- **Auto-restart:** Enabled
- **Memory limit:** 1GB
- **Logs:** ./logs/ directory

## 🆘 Troubleshooting

1. **Check application status:**
   \`\`\`bash
   pm2 status
   \`\`\`

2. **View error logs:**
   \`\`\`bash
   pm2 logs lysaght-consultants --err
   \`\`\`

3. **Restart if needed:**
   \`\`\`bash
   pm2 restart lysaght-consultants
   \`\`\`

4. **Check health endpoint:**
   \`\`\`bash
   curl http://localhost:3000/health
   \`\`\`

## 📁 File Structure

\`\`\`
lysaght-consultants/
├── dist/                 # Built application
├── logs/                 # PM2 logs
├── backups/              # Backup directory
├── server.js             # Express server
├── ecosystem.config.js   # PM2 configuration
├── deploy.sh             # Deployment script
├── update.sh             # Update script
├── .env.production       # Environment variables
└── package.json          # Dependencies
\`\`\`
`;

fs.writeFileSync('PRODUCTION-README.md', productionReadme);
console.log('✅ Created PRODUCTION-README.md');

console.log('\n🎉 Production setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Update .env.production with your Supabase credentials');
console.log('2. Run: ./deploy.sh (Unix/Linux) or npm run setup (Windows)');
console.log('3. Check application status with: pm2 status');
console.log('\n📖 See PRODUCTION-README.md for detailed instructions');
